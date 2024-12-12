import { Injectable } from '@nestjs/common';
import { PlaywrightCrawler } from 'crawlee';
import { DataAccess } from './dataAccess';

@Injectable()
export class AppService {
  constructor(private readonly dataAccess: DataAccess) {}

  async getContent() {
    const crawler = new PlaywrightCrawler({
      maxRequestRetries: 3,
      navigationTimeoutSecs: 30,
      requestHandlerTimeoutSecs: 60,

      requestHandler: async ({ page, request }) => {
        try {
          const classSelector = '.content';
          await page.waitForSelector(classSelector, { timeout: 10000 });

          // گرفتن متن محتوا
          const contents = await page.$$eval(classSelector, (elements) =>
            elements.map((el) => el.textContent?.trim() || ''),
          );

          // ذخیره در دیتابیس
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
      await crawler.run([
        'https://ehghagh.com/مهدیس-گودرزی/همه-چیز-در-رابطه-با-جرم-افترا-تهمت-زدن-بخش-هشتم',
      ]);
    } catch (error) {
      console.error('Crawler failed:', error.message);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const content = await this.dataAccess.findOne(id);
    await content.destroy();
  }

  async findAll(){
    return this.dataAccess.findAll();
  }
}
