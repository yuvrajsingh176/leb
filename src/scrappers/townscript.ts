/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable array-callback-return */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/return-await */
/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/consistent-generic-constructors */

import moment from 'moment';
import puppeteer from 'puppeteer-extra';

import {
  getMediaFileForS3,
  SocialMediaUpdatesController
} from '../controllers/social-media-updates.controller';
import { SocialMediaUpdate, UpdateSource } from '../types/global.types';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { cronLogger } from '../logger/winston.config';

const MAX_ATTEMPTS: number = 5;
const NAVIGATION_TIMEOUT: number = 50000;
const SCROLL_DELAY: number = 5000;
const SOCIAL_MEDIA_HANDLE = 'aroundly-townscript';
const SKILLBOX_SOURCE: UpdateSource = 'townscript';
const MAX_RETRIES = 20;
puppeteer.use(StealthPlugin());

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};
const data = async (): Promise<string[]> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://www.townscript.com/in/bengaluru', {
      timeout: NAVIGATION_TIMEOUT
    });

    const divSelector: string = '.header';
    const uniqueLinks: Set<string> = new Set();

    let attempts: number = 0;

    const scrollDown = async (): Promise<string[]> => {
      let links = await page.evaluate((divSelector) => {
        let anchorTags = Array.from(document.querySelectorAll(`${divSelector} a`));
        return anchorTags.map((anchorTag) => (anchorTag as HTMLAnchorElement).href);
      }, divSelector);

      links.forEach((link) => uniqueLinks.add(link));

      await page.evaluate(() => window.scrollBy(0, window.innerHeight));

      attempts++;

      if (attempts >= MAX_ATTEMPTS) {
        const allLinks: string[] = Array.from(uniqueLinks);
        await browser.close();
        return allLinks;
      } else {
        await sleep(SCROLL_DELAY);
        return scrollDown();
      }
    };

    return scrollDown();
  } catch (error) {
    await browser.close();
    throw error;
  }
};

const scrapTownscript = async (allPostIDsFromDump: Set<string>): Promise<SocialMediaUpdate[]> => {
  const result = await data();
  const browser = await puppeteer.launch();
  const resultToProcess: string[] = result.slice(2);
  const allEventsData: any[] = [];
  const successFullyScrapedIDs: string[] = [];
  const skippedScrapingIDs: string[] = [];
  const failedScrapingIDs: string[] = [];
  try {
    for (const link of resultToProcess) {
      console.log('Scraping ', link);
      const page = await browser.newPage();
      try {
        await page.goto(link, { timeout: NAVIGATION_TIMEOUT });
        await sleep(5000);
        let retries = 0;

        while (retries < MAX_RETRIES) {
          const loadMoreButton = await page.$('.loadMoreBtn');
          if (!loadMoreButton) {
            break;
          }

          await page.$eval('.loadMoreBtn', (btn) => {
            (btn as HTMLButtonElement).click();
          });

          await sleep(5000);
          retries++;
        }

        if (retries === MAX_RETRIES) {
          console.log('Reached maximum retries, exiting loader loop.');
        }

        await page.waitForSelector('.flex.flex-wrap.-mx-3.ng-star-inserted');

        const cardLinks: string[] = await page.$$eval(
          '.flex.flex-wrap.-mx-3.ng-star-inserted > div a',
          (links) => links.map((link) => link.href)
        );
        for (const cardLink of cardLinks) {
          const cardPage = await browser.newPage();
          let uniqueIdentifier: string = '';
          if (allPostIDsFromDump.has(cardLink.split('/e/')[1])) {
            console.log('Skipping this Item since it has already been scrapped');
            skippedScrapingIDs.push(cardLink);
            continue;
          }
          try {
            await cardPage.goto(cardLink, {
              waitUntil: 'domcontentloaded',
              timeout: NAVIGATION_TIMEOUT
            });
            await sleep(4000);
            let eventImage: string | null = '';
            for (let i = 0; i < 5; i++) {
              try {
                eventImage = await cardPage.$eval(
                  '.image-container img',
                  (img: HTMLImageElement) => {
                    return img.getAttribute('src');
                  }
                );
              } catch (e) {
                console.log(e);
              }
            }

            const eventName: string = await cardPage.$eval(
              '.event-name h1',
              (div: HTMLHeadingElement) => div.textContent!.trim()
            );

            let dateInfo: any = await cardPage.$eval('.date-time span', (span: HTMLSpanElement) => {
              const dateText: string = span.textContent!.trim();
              return dateText;
            });
            let starts_at: Date | undefined, expires_at: Date | undefined;

            let flag: number = 1;
            let stexpflag: number = 1;
            if (dateInfo.includes('Daily') || dateInfo.includes('Every')) {
              flag = 0;
            } else {
              dateInfo = dateInfo.split('|');
              let datePart: any = dateInfo[0];
              let timePart: any = dateInfo[1];

              if (datePart.includes("'")) {
                if (datePart.includes('-')) {
                  datePart = datePart.split('-');

                  const stmonth: string = datePart[0][0] + datePart[0][1] + datePart[0][2];
                  const expmonth: string = datePart[1][1] + datePart[1][2] + datePart[1][3];
                  const stday: string = datePart[0][4] + datePart[0][5];
                  const expday: string = datePart[1][5] + datePart[1][6];
                  const styear: string = '20' + datePart[0][7] + datePart[0][8];
                  const expyear: string = '20' + datePart[1][8] + datePart[1][9];
                  const stdatetimeString: string =
                    stmonth + ' ' + stday + ' ' + styear + ' ' + timePart;
                  const expdatetimeString: string =
                    expmonth + ' ' + expday + ' ' + expyear + ' ' + '11:59 PM';
                  const stFormated = moment(stdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
                  const expFormated = moment(expdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
                  starts_at = stFormated;
                  expires_at = expFormated;
                } else {
                  stexpflag = -1;
                  const stmonth: string = datePart[0] + datePart[1] + datePart[2];
                  const stday: string = datePart[4] + datePart[5];
                  const styear: string = '20' + datePart[7] + datePart[8];
                  const stdatetimeString: string =
                    stmonth + ' ' + stday + ' ' + styear + ' ' + timePart;
                  const stFormated = moment(stdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
                  starts_at = stFormated;
                }
              } else if (datePart.includes('-')) {
                datePart = datePart.split('-');
                const stmonth: string = datePart[0][0] + datePart[0][1] + datePart[0][2];
                const stday: string = datePart[0][4] + datePart[0][5];
                const styear: string = '2024';
                let expyear: string = '2024';
                let expmonth: string, expday: string;
                if (datePart[1].length === 4) {
                  expmonth = stmonth;
                  expday = datePart[1][1] + datePart[1][2];
                  const stdatetimeString: string =
                    stmonth + ' ' + stday + ' ' + styear + ' ' + timePart;
                  const expdatetimeString: string =
                    expmonth + ' ' + expday + ' ' + expyear + ' ' + '11:59 PM';
                  const stFormated = moment(stdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
                  const expFormated = moment(expdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
                  starts_at = stFormated;
                  expires_at = expFormated;
                } else {
                  expmonth = datePart[1][1] + datePart[1][2] + datePart[1][3];
                  expday = datePart[1][5] + datePart[1][6];
                  const stdatetimeString: string =
                    stmonth + ' ' + stday + ' ' + styear + ' ' + timePart;
                  const expdatetimeString: string =
                    expmonth + ' ' + expday + ' ' + expyear + ' ' + '11:59 PM';
                  const stFormated = moment(stdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
                  const expFormated = moment(expdatetimeString, 'MMM DD YYYY hh:mm A').toDate();

                  starts_at = stFormated;
                  expires_at = expFormated;
                }
              } else {
                stexpflag = 0;
                const expmonth: string = datePart[0] + datePart[1] + datePart[2];
                const expday: string = datePart[4] + datePart[5];
                const expyear: string = '2024';
                const expdatetimeString: string =
                  expmonth + ' ' + expday + ' ' + expyear + ' ' + '11:59 PM';
                const expFormated = moment(expdatetimeString, 'MMM DD YYYY hh:mm A').toDate();
                expires_at = expFormated;
              }
            }

            const content: string = await cardPage.evaluate(() => {
              const contentDiv = document.querySelector('.content');

              if (!contentDiv) {
                return ''; // No content div found
              }

              // Collect all text content inside the .content div and concatenate into a single string
              const contentString: string = Array.from(contentDiv.childNodes)
                .map((child) => {
                  if (child.nodeType === 3) {
                    // Filter out text nodes
                    return child.textContent!.trim();
                  } else if (child.nodeType === 1) {
                    // Filter out HTML elements
                    return (child as HTMLElement).innerText.trim();
                  }
                })
                .join(' ');

              return contentString;
            });

            const lengthh: number = cardLink.split('/').length;

            uniqueIdentifier = cardLink.split('/')[lengthh - 1];
            let normLink: any = cardLink;
            normLink = normLink.split('/e');
            const first: string = normLink[0] + '/v2/e';
            const sec: string = normLink[1] + '/booking/tickets';
            const ctaLink: string = first + sec;

            await sleep(3000);
            const res: SocialMediaUpdate = {
              social_media_update_id: uniqueIdentifier,
              social_media_handle: SOCIAL_MEDIA_HANDLE,
              is_relevant: false,
              is_published: false,
              source: SKILLBOX_SOURCE,
              social_media_update_details: {
                caption: content,
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
              source_link: cardLink,

              caption_title: eventName,
              expires_at: expires_at as Date,
              starts_at: starts_at as Date,
              cta_links: [
                {
                  url: ctaLink,
                  source: 'Townscript',
                  text: 'Book'
                }
              ],
              timestamp: new Date()
            };
            allEventsData.push(res);
            successFullyScrapedIDs.push(uniqueIdentifier);
          } catch (error) {
            cronLogger.info('Scrapping failed for ' + uniqueIdentifier);
            failedScrapingIDs.push(uniqueIdentifier);
          } finally {
            await cardPage.close();
          }
        }
      } catch (error) {
        return [];
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
    cronLogger.info('Link processing completed.');
    await browser.close();
  }
};

export const scrapTownscriptAndUpdateDb = async (): Promise<void> => {
  const allPostIDsFromDump = new Set(
    (await SocialMediaUpdatesController.getAllUpdates({ source: 'townscript' })).map(
      (item) => item.social_media_update_id
    )
  );
  const scrapedSocialMediaUpdates: SocialMediaUpdate[] = await scrapTownscript(allPostIDsFromDump);

  await SocialMediaUpdatesController.insertMany(scrapedSocialMediaUpdates);
};
