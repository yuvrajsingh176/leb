import { type Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { type SocialMediaUpdate, type UpdateSource } from '../types/global.types';
import sanitizeHtml from 'sanitize-html';
import {
  SocialMediaUpdatesController,
  getMediaFileForS3
} from '../controllers/social-media-updates.controller';
import { cronLogger } from '../logger/winston.config';

puppeteer.use(StealthPlugin());
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

function sanitizeHtmlString(htmlString: any): any {
  // Specify allowed tags and attributes
  // Sanitize the HTML string
  const sanitizedString = sanitizeHtml(htmlString, {
    allowedTags: []
  });

  return sanitizedString;
}

function extractItems(): any {
  const items: any = [];
  Array.from(document.querySelectorAll('.card-list-item')).forEach((info) => {
    const attr = info.querySelector('a')?.getAttribute('href');
    const title = info
      .querySelector('a > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span')
      ?.innerHTML?.trim();
    if (title != null) {
      items.push({
        title: info
          .querySelector('a > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > span')
          ?.innerHTML?.trim(),
        link: 'https://insider.in' + attr,
        time: info
          .querySelector('a > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > p')
          ?.innerHTML?.trim(),
        place: info
          .querySelector('a > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > p')
          ?.innerHTML?.trim(),
        type: info.querySelector('a > div:nth-child(1) > span')?.innerHTML?.trim(),
        price: info
          .querySelector('a > div:nth-child(2) > div:nth-child(2) > p:nth-child(1)')
          ?.innerHTML?.trim()
      });
    }
  });
  return items;
}

function extractDesc(): any {
  let eventDesc: string = '';

  Array.from(document.body.querySelectorAll('#react-tabs-1 > div > .css-1rmq8t0 > p')).forEach(
    (info) => {
      eventDesc = eventDesc + '\n' + info?.innerHTML?.trim();
      return null;
    }
  );

  return eventDesc;
}

function extractImage(): any {
  return document.querySelectorAll('img')[0]?.src;
}

async function scrapeItems(page: Page, extractItems: any, scrollDelay = 3000): Promise<any> {
  let items = [];
  try {
    let prevHeight = -1;

    while (true) {
      await page.evaluate(
        'window.scrollTo({top: document.body.scrollHeight-3500,left: 0,behavior: "smooth"})'
      );
      await page.waitForNetworkIdle();
      await sleep(scrollDelay);
      const newHeight: number = (await page.evaluate('document.body.scrollHeight')) as number;
      if (newHeight === prevHeight) {
        break;
      }
      prevHeight = newHeight;
    }
    items = await page.evaluate(extractItems);
  } catch (e) {}
  return items;
}

function parseStartAndEndTime(timeStr: string): any {
  let startTimeStr = timeStr.split('-')[0];
  let endTimeStr = timeStr.split('-')[timeStr.split('-').length - 1];

  if (timeStr.includes('&amp;')) {
    endTimeStr = startTimeStr.split('|')[0] + ' ' + startTimeStr.split('&amp;')[1];
    startTimeStr = startTimeStr.split('&amp;')[0];
  }

  if (!startTimeStr.includes(':')) {
    startTimeStr = startTimeStr.replaceAll('AM', ':00');
    startTimeStr = startTimeStr.replaceAll('PM', ':00');
  }

  if (!endTimeStr.includes(':')) {
    endTimeStr = endTimeStr.replaceAll('AM', ':00');
    endTimeStr = endTimeStr.replaceAll('PM', ':00');
  }

  startTimeStr = startTimeStr.replaceAll('|', '');
  endTimeStr = endTimeStr.replaceAll('|', '');

  endTimeStr = endTimeStr.replaceAll('Gates', '');
  endTimeStr = endTimeStr.replaceAll('open', '');
  endTimeStr = endTimeStr.replaceAll('Open', '');
  endTimeStr = endTimeStr.replaceAll('starts', '');
  endTimeStr = endTimeStr.replaceAll('Event', '');
  startTimeStr = startTimeStr.replaceAll('Gates', '');
  startTimeStr = startTimeStr.replaceAll('open', '');
  startTimeStr = startTimeStr.replaceAll('Open', '');
  startTimeStr = startTimeStr.replaceAll('starts', '');
  startTimeStr = startTimeStr.replaceAll('Event', '');
  endTimeStr = endTimeStr.replaceAll('Onwards', '');
  startTimeStr = startTimeStr.replaceAll('Onwards', '');

  let resultingStartDate: any = new Date(startTimeStr);
  if (isNaN(resultingStartDate.getUTCDate())) {
    resultingStartDate = null;
  }

  let resultingEndDate: any = new Date(endTimeStr);
  if (isNaN(resultingEndDate.getUTCDate())) {
    resultingEndDate = null;
  }

  return { resultingStartDate, resultingEndDate };
}

export const scrapPaytmInsider = async (
  allPostIDsFromDump: Set<string>
): Promise<SocialMediaUpdate[]> => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667, isMobile: true });
  await page.goto('https://insider.in/all-events-in-bengaluru');
  await page.waitForNetworkIdle();
  const items = await scrapeItems(page, extractItems);
  const SOCIAL_MEDIA_HANDLE = 'aroundly-insider';
  const INSIDER_SOURCE: UpdateSource = 'paytm-insider';
  const successFullyScrapedIDs: string[] = [];
  const failedScrapingIDs: string[] = [];
  const skippedScrapingIDs: string[] = [];

  console.log('Total scrapped data count :', items.length);

  const insiderEvents: SocialMediaUpdate[] = [];
  for (const item of items) {
    const uniqueEvenetID = item.link.split('/')[item.link.split('/').length - 2];
    try {
      console.log('Scraping ', item.link);
      if (allPostIDsFromDump.has(uniqueEvenetID)) {
        console.log('Skipping this Item since it has already been scrapped');
        skippedScrapingIDs.push(uniqueEvenetID);
        continue;
      }
      const page = await browser.newPage();
      await page.goto(item.link);
      await sleep(3000);
      const eventDesc = await page.evaluate(extractDesc);
      const { resultingStartDate, resultingEndDate } = parseStartAndEndTime(item.time);
      const eventImg = await page.evaluate(extractImage);

      const res: SocialMediaUpdate = {
        social_media_update_id: uniqueEvenetID,
        social_media_handle: SOCIAL_MEDIA_HANDLE,
        is_relevant: false,
        is_published: false,
        source: INSIDER_SOURCE,
        social_media_update_details: {
          caption: sanitizeHtmlString(eventDesc),
          media_type: 'IMAGE',
          media_url: await getMediaFileForS3(
            { id: uniqueEvenetID, media_type: 'IMAGE', media_url: eventImg },
            SOCIAL_MEDIA_HANDLE,
            INSIDER_SOURCE
          ),
          timestamp: new Date()
        },
        source_link: item.link,
        update_type: 'event',
        caption_title: item.title,
        cta_links: [
          {
            url: 'https://insider.in/event/' + uniqueEvenetID + '/buy',
            source: INSIDER_SOURCE,
            text: 'Book'
          }
        ],
        starts_at: resultingStartDate,
        expires_at: resultingEndDate,
        timestamp: new Date()
      };
      successFullyScrapedIDs.push(uniqueEvenetID);
      insiderEvents.push(res);
      await page.close();
    } catch (e) {
      failedScrapingIDs.push(uniqueEvenetID);
      cronLogger.error('Scraping for ', uniqueEvenetID, 'from paytm failed with error: ', e);
    }
  }
  await browser.close();

  cronLogger.info(
    'Scrapping complete with succesfully scrapped IDs - ' +
      successFullyScrapedIDs.toString() +
      ' failed-to-scrape IDs - ' +
      failedScrapingIDs.toString() +
      ' skipped-scraping IDs - ' +
      skippedScrapingIDs.toString()
  );

  return insiderEvents;
};

export const scrapPaytmAndUpdateDb = async (): Promise<void> => {
  const allPostIDsFromDump = new Set(
    (await SocialMediaUpdatesController.getAllUpdates({ source: 'paytm insider' })).map(
      (item) => item.social_media_update_id
    )
  );

  const scrapedSocialMediaUpdates: SocialMediaUpdate[] = await scrapPaytmInsider(
    allPostIDsFromDump
  );

  await SocialMediaUpdatesController.insertMany(scrapedSocialMediaUpdates);
  cronLogger.info('SuccesFully added scraped updates to the DB');
};
