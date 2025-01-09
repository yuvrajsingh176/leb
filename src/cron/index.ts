// import cron from 'node-cron';
// import { onSocialMediaDump } from '../helpers/instagram.helper';
import { cronLogger } from '../logger/winston.config';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import cron from 'node-cron';
// import { CronActivity } from '../models/crons-activity.model';
// import { Crons } from '../models/crons.model';
import { InstagramGraphApi } from '../services/instagram.service';
// import type {
// CronJobDetails,
// SocialMediaUpdate,
// UserSubscriptionWithUser
// } from '../types/global.types';
import {
  SocialMediaUpdatesController,
  getPlaceFeedData
  // getUpdatesForFeedOrAdmin
} from '../controllers/social-media-updates.controller';
import { InstaHandleController } from '../controllers/insta-handle.controller';
import {
  SUPPORTED_LOCATIONS_LIST
  // WHATSAPP_UPDATES_TOPIC_ID
} from '../constants/global.constants';
// import mongoose from 'mongoose';
// import { UserSubscriptionsController } from '../controllers/user-subscriptions.controller';
// import { sendRenewedDailyTemplateMessageWithoutFallback } from '../controllers/whatsapp-messages.controller';
import { scrapBookMyShowAndUpdateDb } from '../scrappers/bookmyshow';
import { scrapPaytmAndUpdateDb } from '../scrappers/insider';
import { scrapMeetUpsAndUpdateDb } from '../scrappers/meetup';
import { createEmbeddingsForAllPosts } from '../helpers/post-embedding.helper';
import { scrapSkillboxAndUpdateDb } from '../scrappers/skillbox';
import { scrapTownscriptAndUpdateDb } from '../scrappers/townscript';
import { scrapHighapeAndUpdateDb } from '../scrappers/highape';
import { scrapUrbanautAndUpdateDb } from '../scrappers/urbanaut';

export const CRON_MAP = new Map<string, cron.ScheduledTask>();

// const onCronFail = async (id: string): Promise<void> => {
//   await CronActivity.create({
//     cron_id: id,
//     status: 'failed',
//     successfully_processed_data_length: 0,
//     unprocessable_data_length: 0
//   });
// };

// const updateCronStatus = async (id: string, status: 'running' | 'not-running'): Promise<void> => {
//   await Crons.findByIdAndUpdate(id, {
//     status
//   });
// };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cronFunctions: any = {
  // socialMediaPostsDumper: async (id: string) => {
  //   try {
  //     cronLogger.info('socialMediaPostsDumper cron started');
  //     const cronData = (await Crons.findById(id)) as CronJobDetails;
  //     if (cronData?.active && cronData.status !== 'running') {
  //       await updateCronStatus(id, 'running');
  //       const data = await onSocialMediaDump(cronData.name);
  //       await CronActivity.create({
  //         cron_id: cronData._id,
  //         status: 'passed',
  //         successfully_processed_data_length: data.successCount,
  //         unprocessable_data_length: data.failedCount
  //       });
  //       await updateCronStatus(id, 'not-running');
  //       console.log(data);
  //       cronLogger.info(
  //         'socialMediaPostsDumper cron succussfully dumped ' +
  //           data.successCount +
  //           ' and failed to dump ' +
  //           data.failedCount +
  //           ' handles'
  //       );
  //     } else {
  //       cronLogger.error("socialMediaPostsDumper cron didn't performed, because cron was inactive");
  //       await updateCronStatus(id, 'not-running');
  //       await onCronFail(id);
  //     }
  //   } catch (e: any) {
  //     console.log(e);
  //     cronLogger.error(
  //       'An error occured inside socialMediaPostsDumper cron due to ' + e.toString()
  //     );
  //     await updateCronStatus(id, 'not-running');
  //     await onCronFail(id);
  //   }
  // },
  socialMediaUpdatesDump: async (instagramHandles: string[]) => {
    try {
      cronLogger.info(`cron dump started for handles: ${instagramHandles.toString()}`);
      // TODO: A better way to handle this is to use Promise.allSettled() and later filter based on what was success/fail. Log the failed requests.
      const handlesData = await Promise.all(
        instagramHandles.map(async (handle) => await InstagramGraphApi.getMediaFromHandles(handle))
      );
      cronLogger.info(`fetched latest data for the handles of count: ${handlesData.length}`);

      cronLogger.info(`starting to dump the data to S3`);
      // TODO: A better way to handle this is to use Promise.allSettled() and later filter based on what was success/fail. Log the failed requests.
      await Promise.all(
        handlesData
          // eslint-disable-next-line no-extra-boolean-cast
          .filter((handlesData) => !Boolean(handlesData.error))
          .map(async (handleData) => {
            const body = {
              updates: handleData.data.business_discovery.media?.data,
              source: 'instagram',
              business_handle: handleData.handle
            };
            return await SocialMediaUpdatesController.create(body);
          })
      );

      cronLogger.info(
        `cron dump along with s3 completed for handles: ${instagramHandles.toString()}`
      );
    } catch (e: any) {
      cronLogger.error(`Error occurred while dumping data. ${e}`);
      cronLogger.error(`Response Data in the error is ${e.response.data}`);
    }
  },
  // feedCacheUpdater: async () => {
  //   try {
  //     cronLogger.info('feedCacheUpdater cron started');
  //     const updatesList = await Promise.all(
  //       SUPPORTED_LOCATIONS_LIST.map(async (location) => {
  //         await getUpdatesForFeedOrAdmin(
  //           undefined,
  //           {
  //             location
  //           },
  //           false
  //         );
  //       })
  //     );
  //     cronLogger.info(`fetched latest data for the feed ${updatesList.length}`);

  //     cronLogger.info(`fetched latest data for the feed`);
  //   } catch (e: any) {
  //     cronLogger.error('An error occured inside feedCacheUpdater cron due to ' + e.toString());
  //   }
  // },
  placesFeedCacheUpdater: async () => {
    try {
      cronLogger.info('placesFeedCacheUpdater cron started');
      const updatesList = await Promise.all(
        SUPPORTED_LOCATIONS_LIST.map(async (location) => {
          await getPlaceFeedData({
            location
          });
        })
      );
      cronLogger.info(`fetched latest data for the places feed ${updatesList.length}`);

      cronLogger.info(`fetched latest data for the places feed`);
    } catch (e: any) {
      cronLogger.error(
        'An error occured inside placesFeedCacheUpdater cron due to ' + e.toString()
      );
    }
  },
  postEmbeddingsUpdater: async () => {
    try {
      cronLogger.info('cron started for updating post embeddings');
      const updatedPostEmbeddings = await createEmbeddingsForAllPosts();
      cronLogger.info(`Post embeddings updated for ${updatedPostEmbeddings.length} posts`);
    } catch (e: any) {
      cronLogger.error('An error occured inside postEmbeddingsUpdater cron due to ' + e.toString());
    }
  }
  // sendDailyWhatsAppMessage: async () => {
  //   try {
  //     cronLogger.info('sendDailyWhatsAppMessage cron started');
  //     const userSubscriptions = await UserSubscriptionsController.getAll({
  //       user_id: {
  //         $in: [
  //           new mongoose.Types.ObjectId('65411b02273d4ca03794b125'),
  //           new mongoose.Types.ObjectId('6533dd5a5d19773e718d0ba6'),
  //           new mongoose.Types.ObjectId('653a7a2381db4fbd2e39a4eb'),
  //           new mongoose.Types.ObjectId('653f6770273d4ca0373d7c07')
  //         ]
  //       },
  //       topic_id: new mongoose.Types.ObjectId(WHATSAPP_UPDATES_TOPIC_ID),
  //       city: 'Bengaluru',
  //       status: 'interested'
  //     });

  //     const BANGALORE_CENTER_LAT = 12.9716;
  //     const BANGALORE_CENTER_LONG = 77.5946;
  //     // Fetch all updates of bangalore.
  //     const data = await getUpdatesForFeedOrAdmin(
  //       undefined,
  //       {
  //         location: {
  //           location_name: 'Bengaluru',
  //           location_id: 'bengaluru',
  //           radius: 50000,
  //           latitude: BANGALORE_CENTER_LAT,
  //           longitude: BANGALORE_CENTER_LONG
  //         }
  //       },
  //       true
  //     );

  //     const newData = [
  //       data?.irrelevantData.filter((d: any) => d._id.toJSON() === '65cee418829db3c03e2814ac')[0],
  //       data?.irrelevantData.filter((d: any) => d._id.toJSON() === '65cc2caff0e667b076a6d7f9')[0],
  //       data?.irrelevantData.filter((d: any) => d._id.toJSON() === '65cca5b235c854eb18b32285')[0]
  //     ];

  //     const whatsAppResponse = await Promise.allSettled(
  //       userSubscriptions.map(
  //         async (userSubscription: any) =>
  //           await sendRenewedDailyTemplateMessageWithoutFallback(
  //             userSubscription.toJSON() as UserSubscriptionWithUser,
  //             newData as SocialMediaUpdate[]
  //           )
  //       )
  //     );

  //     console.log(whatsAppResponse);
  //     cronLogger.info(
  //       `fetched user subscriptions of count: ${userSubscriptions.length}, successfully sent ${
  //         whatsAppResponse.filter((r) => r.status === 'fulfilled').length
  //       } messages and failed to send ${
  //         whatsAppResponse.filter((r) => r.status === 'rejected').length
  //       } messages`
  //     );
  //   } catch (e: any) {
  //     console.log(e);
  //     cronLogger.error(
  //       'An error occured inside sendDailyWhatsAppMessage cron due to ' + e.toString()
  //     );
  //   }
  // }
};

export async function processCrons(): Promise<void> {
  const isProduction: boolean = process.env.SERVER_ENVIRONMENT === 'production';
  // const isMainInstance: boolean = process.env.NODE_APP_INSTANCE === '0';
  const isMainInstance: boolean = true;

  if (isProduction && isMainInstance) {
    // Cron Setup for Pulling data from Instagram.
    const instagramHandles = (await InstaHandleController.getAll({ city: 'Bengaluru' })).map(
      (handle) => handle.handle
    );

    const COUNT_OF_HANDLES_FOR_CRON = 50;

    for (let i = 0; i < instagramHandles.length; i += COUNT_OF_HANDLES_FOR_CRON) {
      const index = Math.floor(i / COUNT_OF_HANDLES_FOR_CRON);
      const cronExpression = `0 ${0 + index},${12 + index} * * *`;
      const handlesList = instagramHandles.slice(i, i + COUNT_OF_HANDLES_FOR_CRON);
      // const handlesList = instagramHandles.slice(0, 0);

      cron.schedule(cronExpression, () => cronFunctions.socialMediaUpdatesDump(handlesList), {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      });
      cronLogger.info(`cron scheduled for expression: ${cronExpression}`);
      cronLogger.info(`cron scheduled for handles: ${handlesList.toString()}`);
    }

    // BookMyShow Schedule
    cron.schedule(
      '12 1 * * *',
      () => {
        scrapBookMyShowAndUpdateDb()
          .then(() => {
            cronLogger.info('Completed scraping BookMyShow');
          })
          .catch((e) => {
            cronLogger.error('Scraping failed with error:', e);
          });
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      }
    );

    // PayTM Insider Schedule
    cron.schedule(
      '5 1 * * *',
      () => {
        scrapPaytmAndUpdateDb()
          .then(() => {
            cronLogger.info('Completed scraping PayTM insider');
          })
          .catch((e) => {
            cronLogger.error('Scraping failed with error:', e);
          });
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      }
    );

    // Skillbox Insider Schedule
    cron.schedule(
      '21 23 * * *',
      () => {
        scrapSkillboxAndUpdateDb()
          .then(() => {
            cronLogger.info('Completed scraping Skillbox');
          })
          .catch((e) => {
            cronLogger.error('Scraping failed with error:', e);
          });
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      }
    );

    // Townscript Schedule
    cron.schedule(
      '20 10 * * *',
      () => {
        scrapTownscriptAndUpdateDb()
          .then(() => {
            cronLogger.info('Completed scraping Skillbox');
          })
          .catch((e) => {
            cronLogger.error('Scraping failed with error:', e);
          });
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      }
    );
    // MeetUp Schedule
    cron.schedule(
      '58 0 * * *',
      () => {
        cronLogger.info('Starting scraping MeetUp');
        scrapMeetUpsAndUpdateDb()
          .then(() => {
            cronLogger.info('Completed scraping MeetUp');
          })
          .catch((e) => {
            cronLogger.error('Scraping failed with error:', e);
          });
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      }
    );

    // Highape Schedule

    cron.schedule(
      '51 23 * * *',
      () => {
        scrapHighapeAndUpdateDb()
          .then(() => {
            cronLogger.info('Completed scraping Highape');
          })
          .catch((e) => {
            cronLogger.error('Scraping failed with error:', e);
          });
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      }
    );

    // Urbanaut Schedule

    cron.schedule(
      '18 23 * * *',
      () => {
        scrapUrbanautAndUpdateDb()
          .then(() => {
            cronLogger.info('Completed scraping Urbanaut');
          })
          .catch((e) => {
            cronLogger.error('Scraping failed with error:', e);
          });
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata'
      }
    );
    // Cron for updating post embeddings every 6 hours.
    cron.schedule('0 0 */6 * * *', () => cronFunctions.postEmbeddingsUpdater(), {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });
    cronLogger.info(`cron scheduled for updating post embeddings every 6 hours`);
  }

  // cronLogger.info(`cron scheduled for whatsapp message`);
  // cron.schedule('0 30 14 * * *', () => cronFunctions.sendDailyWhatsAppMessage(), {
  //   scheduled: true,
  //   timezone: 'Asia/Kolkata'
  // });
  // cron.schedule('0 * * * * *', () => cronFunctions.sendDailyWhatsAppMessage(), {
  //   scheduled: true,
  //   timezone: 'Asia/Kolkata'
  // });

  // cron.schedule('0 */15 * * * *', () => cronFunctions.feedCacheUpdater(), {
  //   scheduled: true,
  //   timezone: 'Asia/Kolkata'
  // });

  // cronLogger.info(`cron scheduled for updating location posts every 15mins`);

  cron.schedule('0 */15 * * * *', () => cronFunctions.placesFeedCacheUpdater(), {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  cronLogger.info(`cron scheduled for updating places feed cache every 15mins`);
}
