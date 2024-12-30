import { HttpException, Injectable } from '@nestjs/common';
import { PlaywrightCrawler, CheerioCrawler, Dataset } from 'crawlee';
import { MongoDataAccess } from './DataAccess/mongoose/mongo-dataAccess';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
// import { DataAccess } from './dataAccess';

@Injectable()
export class AppService {
  private isCrawling = false;
  private cronJob: CronJob;

  constructor(
    private readonly dataAccess: MongoDataAccess,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async saveUrl(title: string, url: string) {
    console.log('Save Urls In DataBase ...');
    await this.dataAccess.getQavaninLinks(title, url);
    if (!this.isCrawling) {
      await this.startCronJob();
    }
  }

  async startCronJob() {
    if (this.cronJob) {
      console.log('Cron Job is running');
      return;
    }

    this.cronJob = new CronJob(
      '*/10 * * * * *', // هر ۳۰ ثانیه
      async () => {
        await this.runAuto();
      },
    );

    this.schedulerRegistry.addCronJob('crawlJob', this.cronJob);
    this.cronJob.start();
    console.log('کران جاب شروع به کار کرد');
  }

  async runAuto() {
    if (this.isCrawling) {
      console.log('crawler is running...');
      return;
    }

    try {
      this.isCrawling = true;
      console.log('finding false status url to crawl ...');
      const link = await this.dataAccess.findOneUnprocessedUrl();
      console.log('find title ...');
      const title = await this.dataAccess.findTitle();

      if (!link) {
        console.log('all url is crawled !');
        this.stopCronJob();
        return;
      }

      console.log('start crawling url :', link);
      await this.getContentPage(title, link);
      console.log('in progress');
      console.log('update status !');
      await this.dataAccess.updateCrawlStatus(link);
    } catch (error) {
      console.error('error in crawl progress:', error);
    } finally {
      this.isCrawling = false;
    }
  }

  private stopCronJob() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.schedulerRegistry.deleteCronJob('crawlJob');
      this.cronJob = null;
      console.log('کران جاب متوقف شد');
    }
  }

  async getContentPage(title: string | null, url: string): Promise<string> {
    const crawler = new PlaywrightCrawler({
      maxRequestRetries: 5,
      navigationTimeoutSecs: 120,
      requestHandlerTimeoutSecs: 180,

      requestHandler: async ({ page, request }) => {
        try {
          await page.setViewportSize({ width: 1920, height: 1080 });

          await page.waitForLoadState('networkidle', { timeout: 60000 });
          await page.waitForTimeout(5000);

          const pageData = await page.evaluate(() => {
            // تابع بهبود یافته برای استخراج محتوا
            function getTagContent(tagName: string): string[] {
              const elements = document.getElementsByTagName(tagName);
              const contents: string[] = [];

              for (const element of elements) {
                // حذف فضاهای خالی اضافی و نیولاین‌ها
                const text = element.textContent?.replace(/\s+/g, ' ').trim();

                if (text && text.length > 0) {
                  contents.push(text);
                }
              }

              return contents;
            }

            // روش جایگزین برای گرفتن پاراگراف‌ها
            const paragraphs = Array.from(document.querySelectorAll('p'))
              .map((p) => p.innerText.trim())
              .filter((text) => text.length > 0);

            return {
              url: decodeURI(window.location.href),
              title: document.title,
              content: {
                h1: getTagContent('h1'),
                h2: getTagContent('h2'),
                h3: getTagContent('h3'),
                h4: getTagContent('h4'),
                h5: getTagContent('h5'),
                h6: getTagContent('h6'),
                p: paragraphs,
                strong: getTagContent('strong'),
                b: getTagContent('b'),
              },
              timestamp: new Date().toISOString(),
            };
          });

          if (pageData) {
            try {
              const pageDataJson = JSON.stringify(pageData);
              await this.dataAccess.createContent(
                title,
                pageDataJson,
                request.url,
              );
              console.log('Content saved for:', request.url);
            } catch (dbError) {
              console.error('Error saving to database:', dbError.message);
            }
          }
        } catch (error) {
          console.error(`Error processing ${request.url}: ${error.message}`);
        }
      },

      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--lang=fa',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
          ],
          slowMo: 100,
        },
      },
    });

    try {
      console.log(`Starting to crawl ${url} ...`);
      await crawler.run([url]);

      return 'Crawl successfully Done';
    } catch (error) {
      console.error('Crawler failed:', error.message);
      throw error;
    }
  }

  async getAllContent(title: string, siteMap: string): Promise<string> {
    const sitemapUrls = await this.dataAccess.getSitemapUrls(siteMap);

    const crawler = new PlaywrightCrawler({
      maxRequestRetries: 5,
      navigationTimeoutSecs: 120,
      requestHandlerTimeoutSecs: 180,

      requestHandler: async ({ page, request }) => {
        try {
          await page.setViewportSize({ width: 1920, height: 1080 });

          await page.waitForLoadState('networkidle', { timeout: 60000 });
          await page.waitForTimeout(5000);

          const pageData = await page.evaluate(() => {
            // تابع بهبود یافته برای استخراج محتوا
            function getTagContent(tagName: string): string[] {
              const elements = document.getElementsByTagName(tagName);
              const contents: string[] = [];

              for (const element of elements) {
                // حذف فضاهای خالی اضافی و نیولاین‌ها
                const text = element.textContent?.replace(/\s+/g, ' ').trim();

                if (text && text.length > 0) {
                  contents.push(text);
                }
              }

              return contents;
            }

            // روش جایگزین برای گرفتن پاراگراف‌ها
            const paragraphs = Array.from(document.querySelectorAll('p'))
              .map((p) => p.innerText.trim())
              .filter((text) => text.length > 0);

            return {
              url: decodeURI(window.location.href),
              title: document.title,
              content: {
                h1: getTagContent('h1'),
                h2: getTagContent('h2'),
                h3: getTagContent('h3'),
                h4: getTagContent('h4'),
                h5: getTagContent('h5'),
                h6: getTagContent('h6'),
                p: paragraphs,
                strong: getTagContent('strong'),
                b: getTagContent('b'),
              },
              timestamp: new Date().toISOString(),
            };
          });

          if (pageData) {
            try {
              const pageDataJson = JSON.stringify(pageData);
              await this.dataAccess.createContent(
                title,
                pageDataJson,
                request.url,
              );
              console.log('Content saved for:', request.url);
            } catch (dbError) {
              console.error('Error saving to database:', dbError.message);
            }
          }
        } catch (error) {
          console.error(`Error processing ${request.url}: ${error.message}`);
        }
      },

      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--lang=fa',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
          ],
          slowMo: 100,
        },
      },
    });

    try {
      console.log(`Starting to crawl ${sitemapUrls.length} URLs...`);
      await crawler.run(sitemapUrls);

      return 'Crawl successfully Done';
    } catch (error) {
      console.error('Crawler failed:', error.message);
      throw error;
    }
  }

  async getAllContentUrl1(title: string, url: string): Promise<string> {
    await this.dataAccess.getQavaninLinks(title, url);
    const sitemapUrls = await this.dataAccess.findOneUnprocessedUrl();

    const crawler = new PlaywrightCrawler({
      maxRequestRetries: 5,
      navigationTimeoutSecs: 120,
      requestHandlerTimeoutSecs: 180,

      requestHandler: async ({ page, request }) => {
        try {
          await page.setViewportSize({ width: 1920, height: 1080 });

          await page.waitForLoadState('networkidle', { timeout: 60000 });
          await page.waitForTimeout(5000);

          const pageData = await page.evaluate(() => {
            // تابع بهبود یافته برای استخراج محتوا
            function getTagContent(tagName: string): string[] {
              const elements = document.getElementsByTagName(tagName);
              const contents: string[] = [];

              for (const element of elements) {
                // حذف فضاهای خالی اضافی و نیولاین‌ها
                const text = element.textContent?.replace(/\s+/g, ' ').trim();

                if (text && text.length > 0) {
                  contents.push(text);
                }
              }

              return contents;
            }

            // روش جایگزین برای گرفتن پاراگراف‌ها
            const paragraphs = Array.from(document.querySelectorAll('p'))
              .map((p) => p.innerText.trim())
              .filter((text) => text.length > 0);

            return {
              url: decodeURI(window.location.href),
              title: document.title,
              content: {
                h1: getTagContent('h1'),
                h2: getTagContent('h2'),
                h3: getTagContent('h3'),
                h4: getTagContent('h4'),
                h5: getTagContent('h5'),
                h6: getTagContent('h6'),
                p: paragraphs,
                strong: getTagContent('strong'),
                b: getTagContent('b'),
              },
              timestamp: new Date().toISOString(),
            };
          });

          if (pageData) {
            try {
              const pageDataJson = JSON.stringify(pageData);
              await this.dataAccess.createContent(
                title,
                pageDataJson,
                request.url,
              );
              console.log('Content saved for:', request.url);
            } catch (dbError) {
              console.error('Error saving to database:', dbError.message);
            }
          }
        } catch (error) {
          console.error(`Error processing ${request.url}: ${error.message}`);
        }
      },

      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--lang=fa',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
          ],
          slowMo: 100,
        },
      },
    });

    try {
      console.log(`Starting to crawl ${sitemapUrls.length} URLs...`);
      await crawler.run([sitemapUrls]);

      return 'Crawl successfully Done';
    } catch (error) {
      console.error('Crawler failed:', error.message);
      throw error;
    }
  }

  async getAllContentUrl2(title: string, url: string): Promise<string> {
    const sitemapUrls = await this.getUrl(url);

    const crawler = new PlaywrightCrawler({
      maxRequestRetries: 5,
      navigationTimeoutSecs: 120,
      requestHandlerTimeoutSecs: 180,

      requestHandler: async ({ page, request }) => {
        try {
          await page.setViewportSize({ width: 1920, height: 1080 });

          await page.waitForLoadState('networkidle', { timeout: 60000 });
          await page.waitForTimeout(5000);

          const pageData = await page.evaluate(() => {
            // تابع بهبود یافته برای استخراج محتوا
            function getTagContent(tagName: string): string[] {
              const elements = document.getElementsByTagName(tagName);
              const contents: string[] = [];

              for (const element of elements) {
                // حذف فضاهای خالی اضافی و نیولاین‌ها
                const text = element.textContent?.replace(/\s+/g, ' ').trim();

                if (text && text.length > 0) {
                  contents.push(text);
                }
              }

              return contents;
            }

            // روش جایگزین برای گرفتن پاراگراف‌ها
            const paragraphs = Array.from(document.querySelectorAll('p'))
              .map((p) => p.innerText.trim())
              .filter((text) => text.length > 0);

            return {
              url: decodeURI(window.location.href),
              title: document.title,
              content: {
                h1: getTagContent('h1'),
                h2: getTagContent('h2'),
                h3: getTagContent('h3'),
                h4: getTagContent('h4'),
                h5: getTagContent('h5'),
                h6: getTagContent('h6'),
                p: paragraphs,
                strong: getTagContent('strong'),
                b: getTagContent('b'),
              },
              timestamp: new Date().toISOString(),
            };
          });

          if (pageData) {
            try {
              const pageDataJson = JSON.stringify(pageData);
              await this.dataAccess.createContent(
                title,
                pageDataJson,
                request.url,
              );
              console.log('Content saved for:', request.url);
            } catch (dbError) {
              console.error('Error saving to database:', dbError.message);
            }
          }
        } catch (error) {
          console.error(`Error processing ${request.url}: ${error.message}`);
        }
      },

      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--lang=fa',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
          ],
          slowMo: 100,
        },
      },
    });

    try {
      console.log(`Starting to crawl ${sitemapUrls.length} URLs...`);
      await crawler.run(sitemapUrls);

      return 'Crawl successfully Done';
    } catch (error) {
      console.error('Crawler failed:', error.message);
      throw error;
    }
  }

  async delete(id: string): Promise<string> {
    return await this.dataAccess.delete(id);
  }

  async findAllContent() {
    return this.dataAccess.findAllContent();
  }

  async findAllUrl() {
    return this.dataAccess.findAllUrl();
  }

  // async findAllUrl() {
  //   return this.dataAccess.findAllUrl();
  // }

  async getUrl(url: string): Promise<string[]> {
    const dataset = await Dataset.open();

    const crawler = new CheerioCrawler({
      async requestHandler({ request, enqueueLinks, $, log }) {
        log.info(request.url);

        const pageLinks = $('a')
          .map((_, el) => {
            const href = $(el).attr('href');
            if (!href) return null;

            try {
              const absoluteUrl = new URL(href, request.url).href;
              if (new URL(absoluteUrl).hostname === new URL(url).hostname) {
                return absoluteUrl;
              }
              return null;
            } catch {
              return null;
            }
          })
          .get()
          .filter((href) => href);

        await dataset.pushData({
          url: request.url,
          links: pageLinks,
        });

        await enqueueLinks({
          transformRequestFunction: (req) => {
            if (new URL(req.url).hostname === new URL(url).hostname) {
              return req;
            }
            return false;
          },
        });
      },
      // تنظیمات جدید برای بهبود عملکرد
      maxRequestRetries: 3, // تعداد تلاش‌های مجدد در صورت شکست
      requestHandlerTimeoutSecs: 60, // تایم‌اوت برای هر درخواست
      maxRequestsPerCrawl: 10,
      maxConcurrency: 5, // تعداد درخواست‌های همزمان
      navigationTimeoutSecs: 30, // تایم‌اوت برای ناوبری
      sessionPoolOptions: {
        maxPoolSize: 100, // حداکثر تعداد سشن‌ها
      },

      // تنظیمات مربوط به هدرها
      additionalMimeTypes: ['application/json', 'text/plain'],
      preNavigationHooks: [
        async ({ request }) => {
          request.headers = {
            ...request.headers,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            Connection: 'keep-alive',
          };
        },
      ],
    });

    try {
      await crawler.run([url]);

      const results = await dataset.getData();
      const allLinks = results.items.flatMap((item) => item.links);
      return [...new Set(allLinks)];
    } catch (error) {
      console.error('خطا در کرال کردن:', error);
      // در صورت خطا، لینک‌های جمع‌آوری شده تا این لحظه را برمی‌گرداند
      const results = await dataset.getData();
      const allLinks = results.items.flatMap((item) => item.links);
      return [...new Set(allLinks)];
    }
  }

  async getQavaninLinks(title: string, url: string) {
    const urls = await this.dataAccess.getQavaninLinks(title, url);
    return urls;
  }

  async crawlSingleUrl(title: string, url: string): Promise<string> {
    try {
      await this.dataAccess.getQavaninLinks(title, url);
      const pagess = await this.dataAccess.findOneUnprocessedUrl();

      const crawler = new PlaywrightCrawler({
        maxRequestRetries: 5,
        navigationTimeoutSecs: 180, // افزایش به 3 دقیقه
        requestHandlerTimeoutSecs: 240, // افزایش به 4 دقیقه

        async requestHandler({ page }) {
          try {
            // تنظیمات اولیه صفحه
            await page.setViewportSize({ width: 1920, height: 1080 });

            // تنظیم هدرها
            await page.setExtraHTTPHeaders({
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'fa,en-US;q=0.7,en;q=0.3',
            });

            // لود صفحه با تایم‌اوت بیشتر
            await page.goto(url, {
              waitUntil: 'networkidle',
              timeout: 120000, // 2 دقیقه تایم‌اوت
            });

            // صبر برای لود کامل صفحه
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);

            // ... ادامه پردازش صفحه
          } catch (error) {
            console.error(`Error processing page: ${error.message}`);
            await page.screenshot({ path: `error-${Date.now()}.png` });
          }
        },

        // تنظیمات لانچر
        launchContext: {
          launchOptions: {
            headless: true,
            args: [
              '--disable-web-security',
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
            ],
          },
        },
      });

      await crawler.run([pagess]);
      await this.dataAccess.updateCrawlStatus(pagess);
      return 'کرال با موفقیت انجام شد';
    } catch (error) {
      console.error('خطا در کرال:', error.message);
      throw error;
    }
  }

  async startManualCrawling() {
    try {
      console.log('شروع دستی فرآیند کرال...');
      await this.startCronJob();
      return {
        status: 'success',
        message: 'فرآیند کرال با موفقیت شروع شد',
      };
    } catch (error) {
      console.error('خطا در شروع فرآیند کرال:', error);
      return {
        status: 'error',
        message: 'خطا در شروع فرآیند کرال',
        error: error.message,
      };
    }
  }

  async stopManualCrawling() {
    try {
      this.stopCronJob();
      return {
        status: 'success',
        message: 'فرآیند کرال متوقف شد',
      };
    } catch (error) {
      console.error('خطا در توقف فرآیند کرال:', error);
      return {
        status: 'error',
        message: 'خطا در توقف فرآیند کرال',
        error: error.message,
      };
    }
  }

  async getCrawlingStatus() {
    return {
      isRunning: !!this.cronJob?.running,
      isCrawling: this.isCrawling,
    };
  }
}
