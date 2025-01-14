import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { content } from './schema/crawler.schema';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PlaywrightCrawler } from 'crawlee';
import { urls } from './schema/url.schema';

export class MongoDataAccess {
  constructor(
    @InjectModel(content.name) private readonly contentModel: Model<content>,
    @InjectModel(urls.name) private readonly urlsModel: Model<urls>,
  ) {}
  async createContent(title: string, description: string, url: string) {
    await this.contentModel.create({
      title,
      description,
      url,
    });
  }

  async findAllContent(): Promise<content[]> {
    return this.contentModel.find().exec();
  }

  async findAllUrl(): Promise<urls[]> {
    return this.urlsModel.find().exec();
  }

  async findOne(id: string): Promise<content> {
    return this.contentModel.findOne({ _id: id }).exec();
  }

  async findOneUrl(id: string): Promise<string | null> {
    try {
      const result = await this.urlsModel
        .findById(id)
        .select('url -_id')
        .lean()
        .exec();

      return result?.url || null;
    } catch (error) {
      console.error('خطا در پیدا کردن URL:', error);
      return null;
    }
  }

  async getSitemapUrls(siteMap: string): Promise<string[]> {
    try {
      const response = await axios.get(siteMap);
      const parser = new XMLParser();
      const jsonData = parser.parse(response.data);

      // sitemap urls
      const urls = jsonData.urlset.url.map((item: any) => item.loc);
      return urls;
    } catch (error) {
      console.error('Error fetching sitemap:', error.message);
      return [];
    }
  }

  async delete(id: string): Promise<string> {
    const deletedCat = await this.contentModel
      .findByIdAndDelete({ _id: id })
      .exec();
    if (!deletedCat) {
      throw new HttpException('not exist', 404);
    }
    return `id: (${id}) Successfully Deleted`;
  }

  private async getAllLinks(baseUrl: string): Promise<string[]> {
    const allLinks: string[] = [];

    const crawler = new PlaywrightCrawler({
      async requestHandler({ page }) {
        try {
          console.log('Starting to process page...');

          await page.setViewportSize({ width: 1920, height: 1080 });

          await page.setExtraHTTPHeaders({
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fa,en-US;q=0.7,en;q=0.3',
            Connection: 'keep-alive',
            'Cache-Control': 'max-age=0',
          });

          await page.goto(baseUrl, {
            waitUntil: 'networkidle',
            timeout: 60000,
          });

          try {
            await page.waitForSelector('table', { timeout: 30000 });
            console.log('Table found on page');
          } catch (e) {
            console.log('No table found, waiting for any content...');
            await page.waitForLoadState('domcontentloaded');
          }

          await page.waitForTimeout(2000);

          const hasTable = await page.evaluate(() => {
            return document.querySelector('table') !== null;
          });

          if (!hasTable) {
            console.log('No table element found after waiting');
            await page.screenshot({ path: 'debug-screenshot.png' });
            return;
          }

          const links = await page.evaluate(() => {
            const results: string[] = [];
            document.querySelectorAll('a').forEach((link) => {
              if (link.href && link.href.includes('qavanin.ir')) {
                results.push(link.href);
              }
            });
            console.log(`Found ${results.length} links in page`);
            return results;
          });

          if (links.length > 0) {
            console.log(`Adding ${links.length} links to collection`);
            allLinks.push(...links);
          }

          // بررسی پیجینیشن
          const paginationExists = await page.evaluate(() => {
            return document.querySelector('.pagination') !== null;
          });

          if (paginationExists) {
            const paginationInfo = await page.evaluate(() => {
              const pageInput = document.querySelector(
                'input[name="page"]',
              ) as HTMLInputElement;
              const paginationText = document.querySelector(
                '.pagination-details',
              )?.textContent;

              if (!pageInput || !paginationText) return null;

              return {
                currentPage: parseInt(pageInput.value),
                totalPages: parseInt(
                  paginationText.match(/از (\d+)/)?.[1] || '1',
                ),
              };
            });

            if (
              paginationInfo &&
              paginationInfo.currentPage < paginationInfo.totalPages
            ) {
              const nextPageUrl = new URL(baseUrl);
              nextPageUrl.searchParams.set(
                'page',
                (paginationInfo.currentPage + 1).toString(),
              );
              console.log(`Adding next page: ${nextPageUrl.toString()}`);
              await crawler.addRequests([nextPageUrl.toString()]);
            }
          }
        } catch (error) {
          console.error('Error in request handler:', error);
          await page.screenshot({ path: `error-${Date.now()}.png` });
        }
      },
      maxRequestsPerCrawl: 1000,
      maxRequestRetries: 3,
      navigationTimeoutSecs: 120,
      requestHandlerTimeoutSecs: 240,
      launchContext: {
        launchOptions: {
          headless: false,
          slowMo: 100,
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-accelerated-2d-canvas',
          ],
        },
      },
    });

    try {
      console.log('Starting crawler with URL:', baseUrl);
      await crawler.run([baseUrl]);
      console.log(`Crawler finished. Total links found: ${allLinks.length}`);
      return Array.from(new Set(allLinks));
    } catch (error) {
      console.error('Crawler error:', error);
      return allLinks;
    }
  }

  async getQavaninLinks(title: string, baseUrl: string) {
    try {
      console.log('شروع فرآیند کرال برای:', baseUrl);

      // تاخیر 3 ثانیه‌ای
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // ساخت URL با پارامتر size
      const url = new URL(baseUrl);
      url.searchParams.set('size', '1000');

      // دریافت همه لینک‌ها
      const links = await this.getAllLinks(url.toString());
      console.log(`تعداد لینک‌های یافت شده: ${links.length}`);

      // پردازش لینک‌ها
      const results = [];
      for (const link of links) {
        try {
          // بررسی تکراری بودن لینک
          const existingLink = await this.findByUrl(link);

          if (!existingLink) {
            // ذخیره لینک جدید
            const savedLink = await this.createUrls(link, title);
            results.push(savedLink);
            console.log(`لینک جدید ذخیره شد: ${link}`);
          } else {
            console.log(`لینک تکراری است: ${link}`);
            // اگر می‌خواهید فقط اطلاع‌رسانی شود و پردازش ادامه یابد
            continue;
            // اگر می‌خواهید کل فرآیند متوقف شود:
            // throw new HttpException('لینک تکراری یافت شد', HttpStatus.CONFLICT);
          }
        } catch (linkError) {
          console.error(`خطا در پردازش لینک ${link}:`, linkError);
          // ادامه پردازش بقیه لینک‌ها
          continue;
        }
      }

      console.log(`کرال تکمیل شد. ${results.length} لینک جدید ذخیره شد`);
      return results;
    } catch (error) {
      console.error('خطا در getQavaninLinks:', error);
      throw new HttpException(
        'خطا در دریافت و ذخیره لینک‌ها',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createUrls(url: string, title: string) {
    try {
      await this.urlsModel.create({
        url,
        title,
        isCrawl: false,
      });
      console.log(`لینک با عنوان "${title}" ذخیره شد: ${url}`);
    } catch (error) {
      console.error(`خطا در ذخیره‌سازی لینک ${url}:`, error);
    }
  }

  async findOneUnprocessedUrl(): Promise<string | null> {
    try {
      const result = await this.urlsModel
        .findOne({ isCrawl: false })
        .select('url -_id')
        .lean()
        .exec();

      return result?.url || null;
    } catch (error) {
      console.error('خطا در پیدا کردن URL پردازش نشده:', error);
      return null;
    }
  }

  async findTitle() {
    try {
      const result = await this.urlsModel
        .findOne({ isCrawl: false })
        .select('title -_id')
        .lean()
        .exec();

      return result?.title || null; // فقط فیلد title رو برمیگردونیم
    } catch (error) {
      console.error('خطا در پیدا کردن URL:', error);
      return null;
    }
  }

  async updateCrawlStatus(url: string): Promise<void> {
    try {
      await this.urlsModel.updateOne({ url }, { $set: { isCrawl: true } });
      console.log(`url status successfuly change !:${url}`);
    } catch (error) {
      console.error(`faild to update status${url}:`, error);
    }
  }

  async findByUrl(link: string) {
    const result = await this.urlsModel.findOne({ url: link }).exec();
    return result;
  }
}
