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
  Array.from(document.querySelectorAll('a')).forEach((info) => {
    const attr = info.getAttribute('href');
    if (attr?.includes('https://in.bookmyshow.com/events') === true) {
      items.push({
        title: info.querySelector('div > div:nth-child(3) > div > div')?.innerHTML?.trim(),
        link: attr,
        image: info.querySelector('img')?.src,
        place: info
          .querySelector('div > div:nth-child(3) > div:nth-child(2) > div')
          ?.innerHTML?.trim(),
        type: info
          .querySelector('div > div:nth-child(3) > div:nth-child(3) > div')
          ?.innerHTML?.trim(),
        price: info
          .querySelector('div > div:nth-child(3) > div:nth-child(4) > div')
          ?.innerHTML?.trim()
      });
    }
    return null;
  });
  return items;
}

async function scrapeItems(page: Page, extractItems: any, scrollDelay = 6000): Promise<any> {
  let items = [];
  try {
    let prevHeight = -1;

    while (true) {
      await page.evaluate('window.scrollTo({top: 0,left: 0,behavior: "smooth"})');
      await sleep(scrollDelay);
      await page.evaluate(
        'window.scrollTo({top: document.body.scrollHeight,left: 0,behavior: "smooth"})'
      );
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

function replaceTimeFormat(inputString: string): string {
  // Regular expression to match times in the format '7:29'
  const timeRegex = /\b(\d{1}:\d{2})\b/g;

  // Replace times with leading zeros in the hour part
  const resultString = inputString.replace(timeRegex, function (match: any, time: any) {
    const [hour, minute] = time.split(':');
    // Add leading zero if the hour part has only one digit
    const paddedHour = hour.length === 1 ? '0' + hour : hour;
    // Return the replaced time
    return `${paddedHour}:${minute}`;
  });

  return resultString;
}

function processTime(timeStr: string): Date | null {
  timeStr = timeStr.replace(' at', '');
  timeStr = timeStr.replace(' At', '');
  timeStr = timeStr.replace(' Onwards', '');
  timeStr = timeStr.replace(' onwards', '');
  timeStr = timeStr.replace(' AM', '');
  timeStr = timeStr.replace(' PM', '');
  timeStr = replaceTimeFormat(timeStr);

  const resultingDate = new Date(timeStr);
  if (isNaN(resultingDate.getUTCDate())) {
    return null;
  }

  return resultingDate;
}

function extractDescAndTime(): any {
  let eventDesc: string = '';
  let timeString: string = '';
  const regex = /\b\d{1,2}:\d{2}\b|\b\d:\d{1,2}\b/g;

  Array.from(document.querySelectorAll('.df-v > div:nth-child(1) > div:nth-child(1) > p')).forEach(
    (info) => {
      eventDesc = eventDesc + '\n' + info?.innerHTML?.trim();
      return null;
    }
  );

  // if event desc is not full, then scrape it from another section
  if (eventDesc === '') {
    Array.from(
      document.querySelectorAll('.df-s > div:nth-child(1) > div:nth-child(1) > p')
    ).forEach((info) => {
      eventDesc = eventDesc + '\n' + info?.innerHTML?.trim();
      return null;
    });
  }

  Array.from(document.querySelectorAll('.df-ck > div')).forEach((el) => {
    timeString += el.innerHTML;
  });

  if (timeString === '') {
    Array.from(document.querySelectorAll('.df-aw > div > span')).forEach((el) => {
      timeString += el.innerHTML;
    });
  }

  if (timeString === '') {
    Array.from(document.querySelectorAll('.df-ca > div')).forEach((el) => {
      timeString += el.innerHTML;
    });
  }

  // we extract end date from the event schedule
  const startTimeString = timeString.split('-')[0].trim();
  let endTimeString = timeString.split('-')[timeString.split('-').length - 1].trim();

  if (!regex.test(endTimeString)) {
    endTimeString += ' 11:59 PM';
  }

  return { eventDesc, startTimeString, endTimeString };
}

function extractNumberOfLikes(): any {
  let likes = 0;

  Array.from(document.querySelectorAll('svg')).forEach((el) => {
    if (el.innerHTML === '<use xlink:href="#like_filled"></use>') {
      likes = parseInt(el.parentElement?.parentElement?.children[1]?.innerHTML as string);
    }
    return null;
  });

  return likes;
}

export const scrapBookMyShow = async (
  allPostIDsFromDump: Set<string>
): Promise<SocialMediaUpdate[]> => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 926, isMobile: true });
  await page.goto('https://in.bookmyshow.com/explore/events-bengaluru');
  await page.waitForNetworkIdle();
  const items: any = await scrapeItems(page, extractItems);
  const successFullyScrapedIDs: string[] = [];
  const failedScrapingIDs: string[] = [];
  const skippedScrapingIDs: string[] = [];

  // const source = 'Bookmyshow';
  const SOCIAL_MEDIA_HANDLE = 'aroundly-bookmyshow';
  const BOOKMYSHOW_SOURCE: UpdateSource = 'bookmyshow';

  console.log('Total scrapped data count for source ', BOOKMYSHOW_SOURCE, ': ', items.length);

  const bookMyShowEvents: SocialMediaUpdate[] = [];
  for (const item of items) {
    const uniqueEvenetID = item.link.split('/')[item.link.split('/').length - 1];
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
      const { eventDesc, startTimeString, endTimeString } = await page.evaluate(extractDescAndTime);
      const startsAtDate = processTime(startTimeString);
      const endsAtDate = processTime(endTimeString);
      const likes = await page.evaluate(extractNumberOfLikes);

      const res: SocialMediaUpdate = {
        social_media_update_id: uniqueEvenetID,
        social_media_handle: SOCIAL_MEDIA_HANDLE,
        is_relevant: false,
        is_published: false,
        source: BOOKMYSHOW_SOURCE,
        social_media_update_details: {
          caption: sanitizeHtmlString(eventDesc),
          media_type: 'IMAGE',
          media_url: await getMediaFileForS3(
            { id: uniqueEvenetID, media_type: 'IMAGE', media_url: item.image },
            SOCIAL_MEDIA_HANDLE,
            BOOKMYSHOW_SOURCE
          ),
          timestamp: new Date()
        },
        source_link: item.link,
        update_type: 'event',
        caption_title: item.title,
        expires_at: startsAtDate,
        starts_at: endsAtDate,
        trends_history: [
          {
            time: new Date(),
            likes
          }
        ],
        cta_links: [
          {
            url: item.link,
            source: BOOKMYSHOW_SOURCE,
            text: 'Book'
          }
        ],
        timestamp: new Date()
      };

      bookMyShowEvents.push(res);
      await page.close();
      successFullyScrapedIDs.push(uniqueEvenetID);
    } catch (e) {
      failedScrapingIDs.push(uniqueEvenetID);
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

  return bookMyShowEvents;
};

export const scrapBookMyShowAndUpdateDb = async (): Promise<void> => {
  const allPostIDsFromDump = new Set(
    (await SocialMediaUpdatesController.getAllUpdates({ source: 'bookmyshow' })).map(
      (item) => item.social_media_update_id
    )
  );

  const scrapedSocialMediaUpdates: SocialMediaUpdate[] = await scrapBookMyShow(allPostIDsFromDump);

  await SocialMediaUpdatesController.insertMany(scrapedSocialMediaUpdates);
};
