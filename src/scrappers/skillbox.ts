/* eslint-disable no-prototype-builtins */
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { SocialMediaUpdate, UpdateSource } from '../types/global.types';
import {
  getMediaFileForS3,
  SocialMediaUpdatesController
} from '../controllers/social-media-updates.controller';
import { cronLogger } from '../logger/winston.config';

const NAVIGATION_TIMEOUT = 60000;
const SCROLL_DELAY = 5000;
const MAX_ATTEMPTS = 3; // Maximum attempts to navigate to an event page
puppeteer.use(StealthPlugin());
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const SOCIAL_MEDIA_HANDLE = 'aroundly-skillbox';
const SKILLBOX_SOURCE: UpdateSource = 'skillbox';

export const scrapSkillbox = async (
  allPostIDsFromDump: Set<string>
): Promise<SocialMediaUpdate[]> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://www.skillboxes.com/events', {
      timeout: NAVIGATION_TIMEOUT
    });
    const filterPanelSelector = '.filter-panel';
    const filterPanelElement = await page.$(filterPanelSelector);

    if (filterPanelElement !== null && filterPanelElement !== undefined) {
      const spanElements = await filterPanelElement.$$('div div span.title');

      for (const spanElement of spanElements) {
        const spanText = await page.evaluate((span: any) => span?.textContent.trim(), spanElement);

        if (spanText === 'Search by your city') {
          await spanElement.click();
        }
      }
    } else {
      console.error('Filter panel element not found');
    }

    const inputSelector = 'input[name="searchCity"]';
    await page.waitForSelector(inputSelector);

    await page.type(inputSelector, 'Bangalore', { delay: 200 });

    const filterItemSelector = '.filter-item';
    await page.waitForSelector(filterItemSelector);

    await page.click(filterItemSelector);

    await sleep(10000);

    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => {
        const element: any = document.querySelector('.footer'); // Replace with a selector for an element near the bottom
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      });

      await sleep(10000);
    }

    const contentPanelElement: any = await page.waitForSelector('.row');
    let hasMoreCards = true;
    const extractedEvents = [];
    const successFullyScrapedIDs: string[] = [];
    const failedScrapingIDs: string[] = [];
    const skippedScrapingIDs: string[] = [];
    while (hasMoreCards) {
      const cards = await contentPanelElement.$$('.event-result-box');

      for (const card of cards) {
        const linkHref = await card.$eval('a', (a: any) => a.getAttribute('href'));
      console.log('Scraping ', linkHref);

        const id = linkHref.split('/events/')[1];
        if (allPostIDsFromDump.has(id)) {
          console.log('Skipping this Item since it has already been scrapped');
          skippedScrapingIDs.push(linkHref);
          continue;
        }
        let attempts = 0;
        let navigationSuccess = false;
        let eventData: any = [];
        while (attempts < MAX_ATTEMPTS && !navigationSuccess) {
          try {
            const newPage = await browser.newPage();
            await newPage.goto(`https://www.skillboxes.com${linkHref}`, {
              waitUntil: 'networkidle2'
            });
            await sleep(10000);
            eventData = await newPage.evaluate(() => {
              let flag = 1;
              // eslint-disable-next-line @typescript-eslint/naming-convention
              // eslint-disable-next-line @typescript-eslint/naming-convention
              let expires_at: string | undefined;

              const eventImage =
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                (document.querySelector('.cover-img') as HTMLElement).style.backgroundImage
                  .slice(4, -1)
                  .replace(/"/g, '') || '';
              const eventName =
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                (document.querySelector('.e_title h1') as HTMLElement)?.innerText || '';
              const eventStarttime =
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                (document.querySelector('.info_2') as HTMLElement)?.innerText || '';
              const eventStartdate =
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                (document.querySelector('.info_1') as HTMLElement)?.innerText || '';

              let startDate: string | undefined;
              let eventEnddate: string | undefined;
              function funcCheckday(vari: string): boolean {
                const weekdays: string[] = [
                  'Sunday',
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday'
                ];
                for (let i = 0; i < weekdays.length; i++) {
                  if (vari.includes(weekdays[i])) return true;
                }
                return false;
              }
              const checkDay = funcCheckday(eventStartdate);
              if (eventStartdate.includes('-')) {
                const dateParts = eventStartdate.split('-').map((part) => part.trim());
                if (dateParts[0].includes('2024')) {
                  startDate = dateParts[0];
                } else startDate = dateParts[0] + ' 2024';

                eventEnddate = dateParts[1];
                flag = 0;
              }

              const formattedTime = eventStarttime.replace('Onwards', '');
              let combinedStartDateTimeString: string | undefined;

              const dateRegex =
                /^(\d{1,2}) (?:([A-Za-z]{3})|([A-Za-z]+)) (\d{4}) (\d{1,2}):(\d{2}) (AM|PM)$/;
              // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
              const monthNames: { [key: string]: number } = {
                Jan: 0,
                JAN: 0,
                Feb: 1,
                FEB: 1,
                Mar: 2,
                MAR: 2,
                Apr: 3,
                APR: 3,
                May: 4,
                MAY: 4,
                Jun: 5,
                JUN: 5,
                Jul: 6,
                JUL: 6,
                Aug: 7,
                AUG: 7,
                Sep: 8,
                SEP: 8,
                Oct: 9,
                OCT: 9,
                Nov: 10,
                NOV: 10,
                Dec: 11,
                DEC: 11,
                January: 0,
                February: 1,
                March: 2,
                April: 3,
                June: 5,
                July: 6,
                August: 7,
                September: 8,
                October: 9,
                November: 10,
                December: 11
              };
              function func(vari: string): string | undefined {
                const match = vari.match(dateRegex);

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const day = parseInt(match![1], 10);
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-non-null-assertion
                const monthText = match![2] || match![3];
                const month = monthNames.hasOwnProperty(monthText) ? monthNames[monthText] : NaN;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const year = parseInt(match![4], 10);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                let hours = parseInt(match![5], 10);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const minutes = parseInt(match![6], 10);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const ampm = match![7];

                if (ampm === 'PM' && hours < 12) {
                  hours += 12;
                } else if (ampm === 'AM' && hours === 12) {
                  hours = 0;
                }

                const dateObject = new Date(Date.UTC(year, month, day, hours, minutes));
                const mongoDate = dateObject.toISOString();
                return mongoDate;
              }
              let formattedDateTime: string | undefined;
              if (flag === 0) {
                combinedStartDateTimeString = startDate + ' ' + formattedTime;
                combinedStartDateTimeString = combinedStartDateTimeString.slice(0, -1);

                formattedDateTime = func(combinedStartDateTimeString);
              }
              if (flag === 0) {
                const datetime = eventEnddate + ' 11:59 PM';
                expires_at = func(datetime);
              } else {
                let date;
                if (checkDay) {
                  const curdate = eventStartdate.split(' ');
                  date = curdate[0] + ' ' + curdate[1] + ' 11:59 PM';
                } else {
                  date = eventStartdate + ' 11:59 PM';
                }
                expires_at = func(date);
              }

              const price =
                Boolean((document.querySelector('.price-info-label') as HTMLElement)?.innerText) ||
                '';
              const eventAddress =
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                (document.querySelector('.e_title_body') as HTMLElement)?.innerText || '';
              const stringWithoutNewlines =
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                (document.querySelector('.e_d_element') as HTMLElement)?.innerText || '';
              const description = stringWithoutNewlines.replace(/\n/g, '');

              const uniqueIdentifier = window.location.href.slice(
                34,
                window.location.href.length + 1
              );
              if (flag === 1) {
                return {
                  eventName,
                  price,
                  description,
                  eventAddress,
                  eventImage,
                  uniqueIdentifier,
                  expires_at
                };
              } else {
                return {
                  eventName,
                  starts_at: formattedDateTime,
                  price,
                  description,
                  eventAddress,
                  eventImage,
                  uniqueIdentifier,
                  expires_at
                };
              }
            });

            navigationSuccess = true;
            const res: SocialMediaUpdate = {
              social_media_update_id: eventData.uniqueIdentifier,
              social_media_handle: SOCIAL_MEDIA_HANDLE,
              is_relevant: false,
              is_published: false,
              source: SKILLBOX_SOURCE,
              social_media_update_details: {
                caption: eventData.description,
                media_type: 'IMAGE',
                media_url: await getMediaFileForS3(
                  {
                    id: eventData.uniqueIdentifier,
                    media_type: 'IMAGE',
                    media_url: eventData.eventImage
                  },
                  SOCIAL_MEDIA_HANDLE,
                  SKILLBOX_SOURCE
                ),
                timestamp: new Date()
              },
              source_link: 'https://www.skillboxes.com/events/' + eventData.uniqueIdentifier,

              caption_title: eventData.eventName,
              expires_at: eventData.expires_at,
              starts_at: eventData.expires_at,
              cta_links: [
                {
                  url: 'https://www.skillboxes.com/events/ticket/' + eventData.uniqueIdentifier,
                  source: 'SkillBox',
                  text: 'Book'
                }
              ],
              timestamp: new Date()
            };
            extractedEvents.push(res);
            await newPage.close();
            successFullyScrapedIDs.push(eventData.uniqueIdentifier);
          } catch (error: any) {
            cronLogger.info('Scrapping failed for ' + eventData.uniqueIdentifier);
            failedScrapingIDs.push(eventData.uniqueIdentifier);
            attempts++;
          }
        }
      }

      hasMoreCards = await page.evaluate(() => {
        const loadMoreButton = document.querySelector('.load-more-btn');
        return loadMoreButton !== null;
      });

      if (hasMoreCards) {
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
        await sleep(SCROLL_DELAY);
      }
    }

    cronLogger.info(
      'Scrapping complete with succesfully scrapped IDs - ' +
        successFullyScrapedIDs.toString() +
        ' failed-to-scrape IDs - ' +
        failedScrapingIDs.toString()
    );

    return extractedEvents;
  } catch (error: any) {
    cronLogger.info('Error during initial page navigation:', error.message);
    return [];
  } finally {
    cronLogger.info('Link processing completed.');
    await browser.close();
  }
};

export const scrapSkillboxAndUpdateDb = async (): Promise<void> => {
  const allPostIDsFromDump = new Set(
    (await SocialMediaUpdatesController.getAllUpdates({ source: 'skillbox' })).map(
      (item) => item.social_media_update_id
    )
  );

  const scrapedSocialMediaUpdates: SocialMediaUpdate[] = await scrapSkillbox(allPostIDsFromDump);

  await SocialMediaUpdatesController.insertMany(scrapedSocialMediaUpdates);
};
