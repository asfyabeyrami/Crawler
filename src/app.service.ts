import { Injectable } from '@nestjs/common';
import { PlaywrightCrawler } from 'crawlee';
import { DataAccess } from './dataAccess';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

@Injectable()
export class AppService {
  constructor(private readonly dataAccess: DataAccess) {}

  async getAllContent() {
    const sitemapUrls = await this.getSitemapUrls();

    const crawler = new PlaywrightCrawler({
      maxRequestRetries: 3,
      navigationTimeoutSecs: 30,
      requestHandlerTimeoutSecs: 60,

      requestHandler: async ({ page, request }) => {
        try {
          const classSelector =
            "//body/div[contains(@class,'container-fluid mb-3')]/div[contains(@class,'row justify-content-center')]/div[contains(@class,'col-md-10 col-12')]/div[contains(@class,'row')]/div[contains(@class,'col-md-9 p-1 text-dark')]/div[contains(@class,'content-cl shadow-lg border rounded')]/div[contains(@class,'')]/div[contains(@class,'p-2')]/div[contains(@class,'col-md-12 content p-1')]/p[1]";
          await page.waitForSelector(classSelector, { timeout: 10000 });

          const contents = await page.$$eval(classSelector, (elements) =>
            elements.map((el) => el.textContent?.trim() || ''),
          );

          for (const description of contents) {
            if (description) {
              try {
                const savedContent = await this.dataAccess.createContent(
                  description,
                  request.url,
                );
                console.log(`Content saved with ID: ${savedContent.id}`);
              } catch (dbError) {
                console.error('Error saving to database:', dbError.message);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing ${request.url}: ${error.message}`);
        }
      },

      launchContext: {
        launchOptions: {
          args: ['--lang=fa'],
        },
      },
    });

    try {
      await crawler.run(sitemapUrls);
    } catch (error) {
      console.error('Crawler failed:', error.message);
      throw error;
    }
  }

  private async getSitemapUrls(): Promise<string[]> {
    try {
      const response = await axios.get('https://ehghagh.com/sitemap.xml');
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

  async remove(id: string): Promise<void> {
    const content = await this.dataAccess.findOne(id);
    await content.destroy();
  }

  async findAll() {
    return this.dataAccess.findAll();
  }
}
