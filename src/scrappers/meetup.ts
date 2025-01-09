import { type Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import {
  getMediaFileForS3,
  SocialMediaUpdatesController
} from '../controllers/social-media-updates.controller';
import { type SocialMediaUpdate, type UpdateSource } from '../types/global.types';
import sanitizeHtml from 'sanitize-html';
import { cronLogger } from '../logger/winston.config';
// import fs from 'fs';

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
  Array.from(document.body.querySelectorAll('.max-w-narrow > div:nth-child(1) > *')).forEach(
    (el) => {
      items.push({
        image: el.querySelector('img')?.src,
        link: el.querySelector('a')?.href,
        title: el.querySelector('h2')?.innerHTML
      });
    }
  );
  return items;
}

function extractDescAndTime(): any {
  let eventDesc: string = '';

  Array.from(document.body.querySelectorAll('#event-details > div:nth-child(2) > *')).forEach(
    (info) => {
      eventDesc = eventDesc + '\n' + info?.innerHTML?.trim();
      return null;
    }
  );

  const timeString = document.body.querySelector('time')?.innerHTML;
  return { eventDesc, timeString };
}

function parseStartAndEndTime(timeStr: any): any {
  let resultingStartDate: any = new Date(timeStr.split('to')[0]?.replaceAll('at', ''));
  let resultingEndDate: any = new Date(
    timeStr.split('to')[timeStr.split('to').length - 1]?.replaceAll('at', '')?.replaceAll('IST', '')
  );

  if (isNaN(resultingStartDate.getUTCDate())) {
    resultingStartDate = null;
  }

  if (isNaN(resultingEndDate.getUTCDate())) {
    resultingEndDate = null;
  }

  return { resultingStartDate, resultingEndDate };
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

export const scrapMeetups = async (
  allPostIDsFromDump: Set<string>
): Promise<SocialMediaUpdate[]> => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667, isMobile: true });
  await page.goto('https://www.meetup.com/find/in--bangalore/');
  await page.waitForNetworkIdle();
  const items = await scrapeItems(page, extractItems);
  const successFullyScrapedIDs: string[] = [];
  const failedScrapingIDs: string[] = [];
  const skippedScrapingIDs: string[] = [];

  const SOCIAL_MEDIA_HANDLE = 'aroundly-meetup';
  const MEETUP_SOURCE: UpdateSource = 'meetup';

  console.log('Total scrapped data count for source ', MEETUP_SOURCE, ': ', items.length);

  const meetUpEvents: SocialMediaUpdate[] = [];
  for (const item of items) {
    const uniqueEvenetID =
      item.link.split('/')[item.link.split('/').length - 4] +
      '-' +
      item.link.split('/')[item.link.split('/').length - 2];
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
      const { eventDesc, timeString } = await page.evaluate(extractDescAndTime);
      const { resultingStartDate, resultingEndDate } = parseStartAndEndTime(timeString);

      const res: SocialMediaUpdate = {
        social_media_update_id: uniqueEvenetID,
        social_media_handle: SOCIAL_MEDIA_HANDLE,
        is_relevant: false,
        is_published: false,
        source: MEETUP_SOURCE,
        social_media_update_details: {
          caption: sanitizeHtmlString(eventDesc),
          media_type: 'IMAGE',
          media_url: await getMediaFileForS3(
            { id: uniqueEvenetID, media_type: 'IMAGE', media_url: item.image },
            SOCIAL_MEDIA_HANDLE,
            MEETUP_SOURCE
          ),
          timestamp: new Date()
        },
        source_link: item.link,
        update_type: 'event',
        caption_title: item.title,
        cta_links: [
          {
            url: item.link,
            source: MEETUP_SOURCE,
            text: 'Book'
          }
        ],
        starts_at: resultingStartDate,
        expires_at: resultingEndDate,
        timestamp: new Date()
      };

      // console.log(res)
      meetUpEvents.push(res);
      await page.close();
      successFullyScrapedIDs.push(uniqueEvenetID);
    } catch (e) {
      failedScrapingIDs.push(uniqueEvenetID);
    }
  }
  //   const json = JSON.stringify({"data": meetUpEvents}, null, 2);

  // fs.writeFileSync('myjsonfile.json', json, 'utf8');

  await browser.close();

  cronLogger.info(
    'Scrapping complete with succesfully scrapped IDs - ' +
      successFullyScrapedIDs.toString() +
      ' failed-to-scrape IDs - ' +
      failedScrapingIDs.toString() +
      ' skipped-scraping IDs - ' +
      skippedScrapingIDs.toString()
  );

  return meetUpEvents;
};

export const scrapMeetUpsAndUpdateDb = async (): Promise<void> => {
  const allPostIDsFromDump = new Set(
    (await SocialMediaUpdatesController.getAllUpdates({ source: 'meetup' })).map(
      (item) => item.social_media_update_id
    )
  );

  const scrapedSocialMediaUpdates: SocialMediaUpdate[] = await scrapMeetups(allPostIDsFromDump);

  await SocialMediaUpdatesController.insertMany(scrapedSocialMediaUpdates);
};
