/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/return-await */
/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable prefer-const */
import moment from 'moment';
import puppeteer from 'puppeteer';
import { SocialMediaUpdate, UpdateSource } from '../types/global.types';
import {
  getMediaFileForS3,
  SocialMediaUpdatesController
} from '../controllers/social-media-updates.controller';
import { cronLogger } from '../logger/winston.config';

let MAX_ATTEMPTS = 35;
let NAVIGATION_TIMEOUT = 50000;
let SCROLL_DELAY = 2000;
const SOCIAL_MEDIA_HANDLE = 'aroundly-highape';
const SKILLBOX_SOURCE: UpdateSource = 'highape';

let data = async (): Promise<string[]> => {
  let browser = await puppeteer.launch();
  let page = await browser.newPage();

  try {
    await page.goto('https://highape.com/bangalore/all-events', {
      timeout: NAVIGATION_TIMEOUT
    });

    let divSelector = '.row'; // Adjust this selector
    let uniqueLinks = new Set();

    let attempts = 0;

    let scrollDown = async (): Promise<any> => {
      let links = await page.evaluate((divSelector) => {
        let anchorTags = Array.from(document.querySelectorAll(`${divSelector} a`));
        return anchorTags.map((anchorTag) => (anchorTag as HTMLAnchorElement).href);
      }, divSelector);

      links.forEach((link) => uniqueLinks.add(link));

      await page.evaluate(() => window.scrollBy(0, 2 * window.innerHeight));

      attempts++;

      if (attempts >= MAX_ATTEMPTS) {
        let allLinks = Array.from(uniqueLinks);
        await browser.close();
        return await Promise.resolve(allLinks);
      } else {
        await new Promise((resolve) => setTimeout(resolve, SCROLL_DELAY));
        return scrollDown();
      }
    };

    return scrollDown();
  } catch (error) {
    await browser.close();
    return Promise.reject(error);
  }
};
function convertUrl(oldUrl: string): string {
  const urlObj = new URL(oldUrl);

  const pathnameParts = urlObj.pathname.split('/');
  const eventName = pathnameParts[pathnameParts.length - 1];

  const utmSource = urlObj.searchParams.get('utm_source') ?? '';

  const newUrl = new URL('https://tickets.highape.com/');
  newUrl.searchParams.set('event_name', eventName);
  newUrl.searchParams.set('city', 'bangalore');
  newUrl.searchParams.set('source', utmSource);

  return newUrl.toString();
}

const scrapHighape = async (allPostIDsFromDump: Set<string>): Promise<SocialMediaUpdate[]> => {
  let allLinks: any[] = await data();
  let cardLinks = allLinks.filter((link) => !link.includes('tickets?'));
  cardLinks = cardLinks.slice(3);
  let browser = await puppeteer.launch();
  let resultToProcess = cardLinks.slice(2);
  let allEventsData: any = [];
  const successFullyScrapedIDs: string[] = [];
  const skippedScrapingIDs: string[] = [];
  const failedScrapingIDs: string[] = [];
  let uniqueIdentifier: string = '';
  try {
    for (let link of resultToProcess) {
      console.log('Scraping ', link);
      let id = link.split('?')[0].split('/events/')[1];
      if (allPostIDsFromDump.has(id)) {
        console.log('Skipping this Item since it has already been scrapped');
        skippedScrapingIDs.push(link);
        continue;
      }
      let page = await browser.newPage();
      try {
        await page.goto(link, { timeout: NAVIGATION_TIMEOUT });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        let eventImage = await page.evaluate(() => {
          let imgSrc: any = document?.querySelector('.slick-slide img')?.getAttribute('src');
          return imgSrc;
        });

        let eventName = await page.evaluate(() => {
          let heading: any = document.querySelector('.event-name-heading');
          return heading.textContent;
        });
        let dateParts = await page.evaluate(() => {
          const spans: any = document.querySelectorAll('.details');
          const textContents: any = [];
          spans.forEach((span: any) => {
            textContents.push(span.textContent.trim());
          });

          return textContents;
        });

        let datePart: any = dateParts[1];
        let description = await page.evaluate(() => {
          let div: any = document.querySelector('.event-content-div');
          return div.textContent.trim();
        });
        description = description.replace(/\n/g, '');

        let parts = link.split('/');
        let flag = 1;

        let lastPart = parts[parts.length - 1];

        uniqueIdentifier = lastPart.split('?')[0];
        let starts_at: Date | undefined, expires_at: Date | undefined;

        datePart = datePart.split('-');
        let startDate = datePart[0];
        let endDate = datePart[1];
        startDate = startDate.split(' ');
        endDate = endDate.split(' ');

        let timePart = startDate[3] + startDate[4];
        let stmonth = startDate[2];
        let stday = startDate[1];
        let styear = '2024';
        let stdatetimeString = stmonth + ' ' + stday + ' ' + styear + ' ' + timePart;
        starts_at = moment(stdatetimeString, 'MMM DD YYYY hh:mm A').toDate();

        let exptimePart, expmonth, expday, expyear, expdatetimeString;
        if (endDate.includes('onwards')) {
          flag = 0;
          expires_at = moment(starts_at).add(1, 'month').toDate();
        } else {
          exptimePart = endDate[4] + endDate[5];
          expmonth = endDate[3];
          expday = endDate[2];
          expyear = '2024';
          expdatetimeString = expmonth + ' ' + expday + ' ' + expyear + ' ' + exptimePart;
          expires_at = moment(expdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
        }
        let ctaLink = convertUrl(link);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const res: SocialMediaUpdate = {
          social_media_update_id: uniqueIdentifier,
          social_media_handle: SOCIAL_MEDIA_HANDLE,
          is_relevant: false,
          is_published: false,
          source: SKILLBOX_SOURCE,
          social_media_update_details: {
            caption: description,
            media_type: 'IMAGE',
            media_url: await getMediaFileForS3(
              {
                id: uniqueIdentifier,
                media_type: 'IMAGE',
                media_url: eventImage as string
              },
              SOCIAL_MEDIA_HANDLE,
              SKILLBOX_SOURCE
            ),
            timestamp: new Date()
          },
          source_link: link,

          caption_title: eventName,
          expires_at: expires_at,
          starts_at: starts_at,
          cta_links: [
            {
              url: ctaLink,
              source: 'High Ape',
              text: 'Book'
            }
          ],
          timestamp: new Date()
        };
        allEventsData.push(res);
        successFullyScrapedIDs.push(uniqueIdentifier);
      } catch (error: any) {
        cronLogger.info('Scrapping failed for ' + uniqueIdentifier);
        failedScrapingIDs.push(uniqueIdentifier);
      } finally {
        await page.close();
      }
    }

    cronLogger.info(
      'Scrapping complete with succesfully scrapped IDs - ' +
        successFullyScrapedIDs.toString() +
        ' failed-to-scrape IDs - ' +
        failedScrapingIDs.toString() +
        ' skipped-scraping IDs - ' +
        skippedScrapingIDs.toString()
    );

    return allEventsData;
  } catch (error) {
    return [];
  } finally {
    console.log('Link processing completed.');
    await browser.close();
  }
};

export const scrapHighapeAndUpdateDb = async (): Promise<void> => {
  const allPostIDsFromDump = new Set(
    (await SocialMediaUpdatesController.getAllUpdates({ source: 'highape' })).map(
      (item) => item.social_media_update_id
    )
  );
  const scrapedSocialMediaUpdates: SocialMediaUpdate[] = await scrapHighape(allPostIDsFromDump);

  await SocialMediaUpdatesController.insertMany(scrapedSocialMediaUpdates);
};
