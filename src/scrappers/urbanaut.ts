/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/return-await */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/consistent-type-imports */
import puppeteer from 'puppeteer';
import moment from 'moment';
import { SocialMediaUpdate, UpdateSource } from '../types/global.types';
import {
  getMediaFileForS3,
  SocialMediaUpdatesController
} from '../controllers/social-media-updates.controller';
import { cronLogger } from '../logger/winston.config';

let MAX_ATTEMPTS = 2;
let NAVIGATION_TIMEOUT = 50000;
let SCROLL_DELAY = 2000;

const SOCIAL_MEDIA_HANDLE = 'aroundly-urbanaut';
const SKILLBOX_SOURCE: UpdateSource = 'urbanaut';

let data = async (): Promise<any> => {
  let browser = await puppeteer.launch();
  let page = await browser.newPage();

  try {
    await page.goto('https://urbanaut.app/spots?category_id=12&city=Bengaluru', {
      timeout: NAVIGATION_TIMEOUT
    });

    let divSelector = '.row';
    let uniqueLinks = new Set();

    let attempts = 0;

    let scrollDown = async () => {
      let links = await page.evaluate((divSelector) => {
        let anchorTags = Array.from(document.querySelectorAll(`${divSelector} a`));

        return anchorTags.map((anchorTag) => (anchorTag as HTMLAnchorElement).href);
      }, divSelector);

      links.forEach((link) => uniqueLinks.add(link));

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

const scrapHighape = async (allPostIDsFromDump: Set<string>): Promise<SocialMediaUpdate[]> => {
  const result = await data();
  const usefulLinks: any = result.slice(1, result.length - 3);
  let browser = await puppeteer.launch();
  const successFullyScrapedIDs: string[] = [];
  const skippedScrapingIDs: string[] = [];
  const failedScrapingIDs: string[] = [];
  const ans: any = [];
  let uniqueIdentifier;
  try {
    for (let link of usefulLinks) {
      console.log('Scraping ', link);
      let uniqueEvenetID = link.split('/spot/')[1];
      if (allPostIDsFromDump.has(uniqueEvenetID)) {
        console.log('Skipping this Item since it has already been scrapped');
        skippedScrapingIDs.push(uniqueEvenetID);
        continue;
      }
      let page = await browser.newPage();
      try {
        await page.goto(link, { timeout: NAVIGATION_TIMEOUT });

        await page.setViewport({ width: 1390, height: 996 });

        await new Promise((resolve) => setTimeout(resolve, 4000));
        const spotName: string = await page.$eval('.spot_name', (element: any) =>
          element?.textContent.trim()
        );

        const dateTimeElements = await page.$$('.date_time');
        const dateTime: any = await Promise.all(
          dateTimeElements.map(async (dateTimeElement) => {
            return await dateTimeElement.evaluate((node: any) => node.textContent.trim());
          })
        );
        let datePart: any = dateTime[0];
        let timePart: any = dateTime[2];
        timePart = timePart.split('-');

        let sttime = timePart[0].trim();
        let exptime = timePart[1].trim();

        if (sttime.includes('am')) {
          sttime = sttime.replace('am', 'AM');
        } else {
          sttime = sttime.replace('pm', 'PM');
        }

        if (exptime.includes('am')) {
          exptime = exptime.replace('am', 'AM');
        } else {
          exptime = exptime.replace('pm', 'PM');
        }

        let starts_at, expires_at;
        if (datePart.includes('-')) {
          datePart = datePart.split('-');

          let stmonth = datePart[0][0] + datePart[0][1] + datePart[0][2];
          let expmonth = datePart[1][1] + datePart[1][2] + datePart[1][3];
          let stday = datePart[0][4] + datePart[0][5];
          let expday = datePart[1][5] + datePart[1][6];
          let styear = '2024';
          let expyear = '2024';
          let stdatetimeString = stmonth + ' ' + stday + ' ' + styear + ' ' + sttime;
          let expdatetimeString = expmonth + ' ' + expday + ' ' + expyear + ' ' + exptime;
          let stFormated = moment(stdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
          let expFormated = moment(expdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
          starts_at = stFormated;
          expires_at = expFormated;
        } else {
          const stmonth = datePart[0] + datePart[1] + datePart[2];
          const stday = datePart[4] + datePart[5];
          const styear = '2024';
          const expmonth = datePart[0] + datePart[1] + datePart[2];
          const expday = datePart[4] + datePart[5];
          const expyear = '2024';
          let stdatetimeString = stmonth + ' ' + stday + ' ' + styear + ' ' + sttime;
          let expdatetimeString = expmonth + ' ' + expday + ' ' + expyear + ' ' + exptime;
          let stFormated = moment(stdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
          let expFormated = moment(expdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
          starts_at = stFormated;
          expires_at = expFormated;
        }
        const eventImage = await page.$eval('.cover', (img) => img.getAttribute('src'));

        const shortDesElements = await page.$$('.short_des p');
        const shortDes = await Promise.all(
          shortDesElements.map(async (shortDesElement) => {
            return await shortDesElement.evaluate((node: any) => node.textContent.trim());
          })
        );
        const description = shortDes.join(' ');
        uniqueIdentifier = link.split('spot/');
        uniqueIdentifier = uniqueIdentifier[1];
        let ctaLink = link.replace('spot', 'booking');

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

          caption_title: spotName,
          expires_at: expires_at,
          starts_at: starts_at,
          cta_links: [
            {
              url: ctaLink,
              source: 'Urbanaut',
              text: 'Book'
            }
          ],
          timestamp: new Date()
        };
        ans.push(res);
        successFullyScrapedIDs.push(uniqueIdentifier);
      } catch (e) {
        failedScrapingIDs.push(uniqueIdentifier);
        console.log(e);
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

    return ans;
  } catch (e) {
    console.log(e);
    return [];
  } finally {
    console.log('Link processing completed.');
    await browser.close();
  }
};
export const scrapUrbanautAndUpdateDb = async (): Promise<void> => {
  const allPostIDsFromDump = new Set(
    (await SocialMediaUpdatesController.getAllUpdates({ source: 'urbanaut' })).map(
      (item) => item.social_media_update_id
    )
  );
  const scrapedSocialMediaUpdates: SocialMediaUpdate[] = await scrapHighape(allPostIDsFromDump);

  await SocialMediaUpdatesController.insertMany(scrapedSocialMediaUpdates);
};
