import express from 'express';
// import { WhatsappMessages } from '../models/whatsapp-message.model';
import { HttpCode } from '../constants/global.constants';
import { UserData } from '../models/user-data.model';
// import { WhatsappApi } from '../services/whatsapp.service';
// import type { SocialMediaUpdate } from '../types/global.types';
// import moment from 'moment';
import mongoose from 'mongoose';
// import { UserSubscriptionsController } from '../controllers/user-subscriptions.controller';
import { WhatsappApi } from '../services/whatsapp.service';
// import type { SocialMediaUpdate, UserSubscriptionWithUser } from '../types/global.types';
// import { getUpdatesForFeedOrAdmin } from '../controllers/social-media-updates.controller';
// import { sendRenewedDailyTemplateMessageWithoutFallback } from '../controllers/whatsapp-messages.controller';
// import { UserSubscriptions } from '../models/user-subscriptions.model';

// const IMAGE_URL = 'https://aroundly-instagram-playground.web.app/aroundly-today.png';
// const ALTERNATE_STRING = ' ';
export const WhatsappMessageDailyUpdatesRouter = express.Router();

// const formatCaption = (data: SocialMediaUpdate, userSubscription: any): string => {
//   const captionTitle = data.caption_title as string;
//   if (data.interest_categories === null || data.interest_categories === undefined) {
//     return '';
//   }

//   const interest = data.interest_categories.filter((item) =>
//     userSubscription.interests.includes(item._id)
//   );
//   const interestName = interest.length > 0 ? interest[0].interest_name : '';

//   return interestName.length > 0 ? interestName + ': ' + captionTitle : captionTitle;
// };

// const sendWhatsAppDailyMessageWithSaved = async (
//   user: any,
//   updatesSent: SocialMediaUpdate[],
//   totalUpdates: number,
//   userSubscription: any
// ): Promise<any> => {
//   const MAX_UPDATES = 4;

//   const updateDetails = {
//     image_url: IMAGE_URL,
//     update_one:
//       updatesSent.length > 0 ? formatCaption(updatesSent[0], userSubscription) : ALTERNATE_STRING,
//     update_two:
//       updatesSent.length > 1 ? formatCaption(updatesSent[1], userSubscription) : ALTERNATE_STRING,
//     update_three:
//       updatesSent.length > 2 ? formatCaption(updatesSent[2], userSubscription) : ALTERNATE_STRING,
//     update_four:
//       updatesSent.length > 3 ? formatCaption(updatesSent[3], userSubscription) : ALTERNATE_STRING,
//     count_of_more_updates:
//       totalUpdates > MAX_UPDATES ? '+' + (totalUpdates - MAX_UPDATES) + ' more' : ' ',
//     saved_update_one: ALTERNATE_STRING,
//     saved_update_two: ALTERNATE_STRING, // TODO: get saved updates data and show them here.
//     date: moment().format('MMM Do YY'),
//     city: userSubscription.city
//   };

//   return await WhatsappApi.sendDailyUpdateWithSaved(user.phone, updateDetails);
// };

// WhatsappMessageDailyUpdatesRouter.post('/new-years-message', (async (req, res, next) => {
//   try {
//     const userId = req.body.user_id;
//     const user = await UserData.findById(userId);

//     if (user === null || user === undefined) {
//       next({ httpCode: HttpCode.BAD_REQUEST, description: 'User not found' });
//       return;
//     }
//     // const userSubscription = await UserSubscriptions.findOne({
//     //   user_id: new mongoose.Types.ObjectId(userId),
//     //   topic_id: new mongoose.Types.ObjectId(WHATSAPP_UPDATES_TOPIC_ID)
//     // });
//     // if (userSubscription === null) {
//     //   next({ httpCode: HttpCode.BAD_REQUEST, description: 'User is not subscribed' });
//     //   return;
//     // }
//     const apiResult = await WhatsappApi.newYearsMessage(user.phone);
//     if (apiResult !== null || apiResult !== undefined) {
//       res.status(HttpCode.OK).json(apiResult);
//     } else {
//       next({
//         httpCode: HttpCode.INTERNAL_SERVER_ERROR,
//         description: 'Failed to send message on whatsapp'
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// }) as express.RequestHandler);

// WhatsappMessageDailyUpdatesRouter.post('/', (async (req, res, next) => {
//   try {
//     const userId = req.body.user_id;
//     const updatesSent: SocialMediaUpdate[] = req.body.updates_sent;
//     const totalUpdates: number = req.body.total_updates;
//     const user = await UserData.findById(userId);

//     if (user === null || user === undefined) {
//       next({ httpCode: HttpCode.BAD_REQUEST, description: 'User not found' });
//       return;
//     }
//     const userSubscription = await UserSubscriptions.findOne({
//       user_id: new mongoose.Types.ObjectId(userId),
//       topic_id: new mongoose.Types.ObjectId(WHATSAPP_UPDATES_TOPIC_ID)
//     });
//     if (userSubscription === null) {
//       next({ httpCode: HttpCode.BAD_REQUEST, description: 'User is not subscribed' });
//       return;
//     }
//     const apiResult = await sendWhatsAppDailyMessageWithSaved(
//       user,
//       updatesSent,
//       totalUpdates,
//       userSubscription
//     );
//     if (apiResult !== null || apiResult !== undefined) {
//       const result = await WhatsappMessages.create(req.body);
//       res.status(HttpCode.OK).json(result);
//     } else {
//       next({
//         httpCode: HttpCode.INTERNAL_SERVER_ERROR,
//         description: 'Failed to send message on whatsapp'
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// }) as express.RequestHandler);

WhatsappMessageDailyUpdatesRouter.get('/wa-notifications', (async (req, res, next) => {
  try {
    console.log('Whatsapp Notifications', req.headers);
    res.status(HttpCode.OK).json({ token: 'from-wa-developers-website' });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

WhatsappMessageDailyUpdatesRouter.post('/wa-notifications', (async (req, res, next) => {
  try {
    console.log('Whatsapp Notifications', req.body);
    res.status(HttpCode.OK).json();
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// const getUserSubscriptions = async (): Promise<any[]> => {
//   return await UserSubscriptionsController.getAll({
//     user_id: {
//       $in: [
//         new mongoose.Types.ObjectId('65411b02273d4ca03794b125'),
//         new mongoose.Types.ObjectId('6533dd5a5d19773e718d0ba6'),
//         new mongoose.Types.ObjectId('653f6770273d4ca0373d7c07')
//       ]
//     },
//     topic_id: new mongoose.Types.ObjectId(WHATSAPP_UPDATES_TOPIC_ID),
//     city: 'Bengaluru',
//     status: 'interested'
//   });
// };

const getActiveIndianUsers = async (): Promise<any[]> => {
  return await UserData.find({
    phone: /\+91/i,
    _id: {
      $in: [
        new mongoose.Types.ObjectId('65411b02273d4ca03794b125'),
        new mongoose.Types.ObjectId('6533dd5a5d19773e718d0ba6'),
        new mongoose.Types.ObjectId('653f6770273d4ca0373d7c07')
      ]
    },
    is_active: true
  });
};

WhatsappMessageDailyUpdatesRouter.post('/launch-template', (async (req, res, next) => {
  try {
    const indianUsers = await getActiveIndianUsers();
    console.log(indianUsers.length);

    const apiResult = await Promise.allSettled(
      indianUsers.map(async (user: any) => {
        return await WhatsappApi.launchTemplate(user.phone);
      })
    );
    res.status(HttpCode.OK).json(apiResult);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// WhatsappMessageDailyUpdatesRouter.post('/trigger-daily-whatsapp-message', (async (
//   req,
//   res,
//   next
// ) => {
//   try {
//     const userSubscriptions = await getUserSubscriptions();

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
//       data?.irrelevantData.filter((d: any) => d._id.toJSON() === '65f9e3b4ffc31865b2f294a1')[0],
//       data?.irrelevantData.filter((d: any) => d._id.toJSON() === '65fdd68affc31865b2f31654')[0],
//       data?.irrelevantData.filter((d: any) => d._id.toJSON() === '66031460bf9ef2f991321e57')[0]
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
//     res.status(HttpCode.OK).json(whatsAppResponse);
//   } catch (error) {
//     next(error);
//   }
// }) as express.RequestHandler);

// WhatsappMessageDailyUpdatesRouter.get('/user', (async (req, res, next) => {
//   try {
//     const result = await UserData.aggregate([
//       // {
//       //   $lookup: {
//       //     from: 'whatsappmessages',
//       //     localField: '_id',
//       //     foreignField: 'user_id',
//       //     as: 'updates',
//       //     pipeline: [
//       //       { $unwind: '$updates_sent' },
//       //       {
//       //         $group: {
//       //           _id: '$user_id',
//       //           updates_sent: { $push: '$updates_sent' }
//       //         }
//       //       }
//       //     ]
//       //   }
//       // },
//       // {
//       //   $unwind: {
//       //     path: '$updates',
//       //     preserveNullAndEmptyArrays: true
//       //   }
//       // },
//       {
//         $lookup: {
//           from: 'usersubscriptions',
//           localField: '_id',
//           foreignField: 'user_id',
//           as: 'subscription',
//           pipeline: [
//             { $match: { topic_id: new mongoose.Types.ObjectId(WHATSAPP_UPDATES_TOPIC_ID) } },
//             { $project: { city: 1, interests: 1 } }
//           ]
//         }
//       },
//       {
//         $unwind: {
//           path: '$subscription',
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       { $sort: { created_at: -1 } }
//     ]);
//     res.status(HttpCode.OK).json(result);
//   } catch (error) {
//     next(error);
//   }
// }) as express.RequestHandler);
