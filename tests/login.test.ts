import { chromium, test } from '@playwright/test';

// test('login test demo', async () => {
//   const browser = await chromium.launch({
//     headless: false,
//   });
//   const context = await browser.newContext();
//   const page = await context.newPage();

//   await page.goto('https://ehghagh.com/sitemap.xml');
//   const url = await page.goto(
//     '//body[1]/div[3]/div[1]/div[2]/div[1]/div[2]/div[1]/span[2]',
//   );
// });

import { PlaywrightCrawler } from 'crawlee';

test('crawler test demo', async () => {
  const crawler = new PlaywrightCrawler({
    // تنظیمات پایه برای مدیریت خطاها
    maxRequestRetries: 3,
    navigationTimeoutSecs: 30,
    requestHandlerTimeoutSecs: 60,

    requestHandler: async ({ page, request }) => {
      try {
        // افزودن timeout برای waitForSelector
        const classSelector = '.content';
        await page.waitForSelector(classSelector, { timeout: 10000 });

        const titles = await page.$$eval(classSelector, (elements) =>
          elements.map((el) => el.textContent?.trim() || ''),
        );

        titles.forEach((text, idx) => {
          if (text) {
            console.log(`content ${idx + 1}: ${text}`);
          }
        });
      } catch (error) {
        console.error(`Error processing ${request.url}: ${error.message}`);
      }
    },

    // تنظیمات فارسی سازی
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
  }
});
