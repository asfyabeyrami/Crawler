import { HttpException, Injectable } from '@nestjs/common';
import { PlaywrightCrawler } from 'crawlee';
import { DataAccess } from './dataAccess';

@Injectable()
export class AppService {
  constructor(private readonly dataAccess: DataAccess) {}

  async getAllContent(siteMap: string): Promise<string> {
    const sitemapUrls = await this.dataAccess.getSitemapUrls(siteMap);

    const crawler = new PlaywrightCrawler({
      maxRequestRetries: 3,
      navigationTimeoutSecs: 30,
      requestHandlerTimeoutSecs: 60,

      requestHandler: async ({ page, request }) => {
        try {
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
              const savedContent = await this.dataAccess.createContent(
                pageDataJson,
                request.url,
              );
              console.log(`Content saved with ID: ${savedContent.id}`);
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
          args: ['--lang=fa'],
        },
      },
    });

    try {
      await crawler.run(sitemapUrls);
      return 'Crawl successfully Done';
    } catch (error) {
      console.error('Crawler failed:', error.message);
      throw error;
    }
  }
  async remove(id: string): Promise<string> {
    const content = await this.dataAccess.findOne(id);
    if (!content) {
      throw new HttpException('not exist', 404);
    }
    await content.destroy();
    return `id: (${id}) Successfully Deleted`;
  }

  async findAll() {
    return this.dataAccess.findAll();
  }
}
