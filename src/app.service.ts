import { Injectable } from '@nestjs/common';
import { PlaywrightCrawler } from 'crawlee';
import { MongoDataAccess } from './DataAccess/mongoose/mongo-dataAccess';
// import { DataAccess } from './dataAccess';

@Injectable()
export class AppService {
  constructor(private readonly dataAccess: MongoDataAccess) {}

  async getAllContent(siteMap: string): Promise<string> {
    const sitemapUrls = await this.dataAccess.getQavaninLinks(siteMap);
    // const sitemapUrls = await this.dataAccess.getSitemapUrls(siteMap);

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
            // Extract text content from specific tags
            function getTagContent(tagName: string): string[] {
              return Array.from(document.getElementsByTagName(tagName))
                .map((element) => element.textContent?.trim())
                .filter((text) => text) as string[];
            }

            // Get all heading tags and paragraphs
            const headingsAndParagraphs = {
              h1: getTagContent('h1'),
              h2: getTagContent('h2'),
              h3: getTagContent('h3'),
              h4: getTagContent('h4'),
              h5: getTagContent('h5'),
              h6: getTagContent('h6'),
              p: getTagContent('p'),
              strong: getTagContent('strong'),
              b: getTagContent('b'),
            };

            return {
              url: decodeURI(window.location.href),
              title: document.title,
              content: headingsAndParagraphs,
              timestamp: new Date().toISOString(),
            };
          });

          if (pageData) {
            try {
              const pageDataJson = JSON.stringify(pageData);
              await this.dataAccess.createContent(pageDataJson, request.url);
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
          headless: false,
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

  async findAll() {
    return this.dataAccess.findAll();
  }

  async getUrl(siteMap: string) {
    console.log('Starting URL fetch process...');
    const links = await this.dataAccess.getQavaninLinks(siteMap);
    console.log(`Total links found: ${links.length}`);
    return links;
  }
}
