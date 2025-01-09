import express from 'express';
import { HttpCode } from '../constants/global.constants';
import UserActionsModel from '../models/user-actions.model';
import { UserActionHistory } from '../models/user-action-history.model';
import { verifyToken } from '../helpers/tokens.helper';
import mongoose from 'mongoose';
// import { getUpdatesForFeedOrAdmin } from '../controllers/social-media-updates.controller';
// import type { SocialMediaUpdate } from '../types/global.types';
// import { redisClient } from '../services/redis-connection.service';
// import { getPresignedUrlViaPromise } from '../services/aws-s3.service';

export const UserActionsRouter = express.Router();

enum SupportedActions {
  WISHLIST = 'wishlist-add',
  NOT_INTERESTED = 'not-interested',
  NOT_INTERESTED_UNDO = 'not-interested-undo',
  WISHLIST_REMOVE = 'wishlist-remove',
  SHARE = 'share'
}

const getPopulatedUserActionObj = async (userId: string): Promise<any> => {
  const userAction = await UserActionsModel.findOne({
    user_id: new mongoose.Types.ObjectId(userId)
  }).populate({
    path: 'wishlist',
    populate: {
      path: 'update_id',
      model: 'social-media-updates',
      populate: [
        { path: 'interest_categories', model: 'Interests' },
        { path: 'related_aroundly_place_ids', model: 'AroundlyPlaces' }
      ]
    }
  });

  const userActionData = JSON.parse(JSON.stringify(userAction));

  // if (userActionData?.wishlist !== undefined && userActionData?.wishlist.length > 0) {
  //   userActionData.wishlist = (await Promise.all(
  //     userActionData?.wishlist.map(async (wishlist: any) => ({
  //       ...wishlist,
  //       update_id: {
  //         ...wishlist.update_id,
  //         social_media_update_details: {
  //           ...wishlist.update_id.social_media_update_details,
  //           media_url:
  //             wishlist.update_id.social_media_update_details.media_url !== '' &&
  //             wishlist.update_id.social_media_update_details.media_url !== null &&
  //             wishlist.update_id.social_media_update_details.media_url !== undefined &&
  //             wishlist.update_id.social_media_update_details.media_url !== false &&
  //             wishlist.update_id.social_media_update_details.media_url !== true
  //               ? await getPresignedUrlViaPromise(
  //                   wishlist.update_id.social_media_update_details.media_url
  //                 )
  //               : null,
  //           thumbnail_url:
  //             wishlist.update_id.social_media_update_details.thumbnail_url !== '' &&
  //             wishlist.update_id.social_media_update_details.thumbnail_url !== null &&
  //             wishlist.update_id.social_media_update_details.thumbnail_url !== undefined &&
  //             wishlist.update_id.social_media_update_details.thumbnail_url !== false &&
  //             wishlist.update_id.social_media_update_details.thumbnail_url !== true
  //               ? await getPresignedUrlViaPromise(
  //                   wishlist.update_id.social_media_update_details.thumbnail_url
  //                 )
  //               : null
  //         }
  //       }
  //     }))
  //   )) as any;
  // }

  return userActionData;
};

UserActionsRouter.post('/', (async (req, res, next) => {
  const deviceId = req.headers['device-id'] as string;
  const userId = verifyToken(req);

  if (userId === '' && deviceId === '') {
    next({
      httpCode: HttpCode.UNAUTHORIZED,
      description: 'User is not logged in and device ID is not provided'
    });
  }

  const {
    updateId,
    action,
    reason
  }: { updateId: string; action: SupportedActions; reason?: string } = req.body;

  if (!Object.values(SupportedActions).includes(action)) {
    next({
      httpCode: HttpCode.BAD_REQUEST,
      description: `Invalid action, supported actions are: ${Object.values(SupportedActions).join(
        ', '
      )}`
    });
  }

  const updateObjectId = new mongoose.Types.ObjectId(updateId);

  const userObjectId = userId !== undefined ? new mongoose.Types.ObjectId(userId) : null;
  const additionalInfo = reason !== undefined ? { reasons: [reason] } : null;
  try {
    await UserActionHistory.create({
      action_taken: action,
      update_id: updateObjectId,
      device_id: deviceId,
      user_id: userObjectId,
      additional_info: additionalInfo
    });

    if (userId === undefined) {
      return res.status(HttpCode.OK).json({ msg: 'User is not logged in' });
    }

    if (action === SupportedActions.SHARE) {
      return res.status(HttpCode.OK).json({ msg: 'Done' });
    }

    switch (action) {
      case SupportedActions.WISHLIST: {
        let result = await UserActionsModel.findOne({ user_id: userObjectId });

        if (result !== null) {
          const existingUpdate = result.wishlist.filter(
            (u) => u.update_id.toJSON() === updateObjectId.toJSON()
          );

          if (existingUpdate.length > 0) {
            existingUpdate[0].timestamp = new Date();
          } else {
            const obj = { update_id: updateObjectId, timestamp: new Date() };
            result.wishlist.push(obj);
          }
        } else {
          result = new UserActionsModel({
            user_id: userObjectId,
            wishlist: [{ update_id: updateObjectId, timestamp: new Date() }]
          });
        }

        await result.save();
        const wishlistCount = await UserActionsModel.countDocuments({
          'wishlist.update_id': updateObjectId
        });

        const newResult = await getPopulatedUserActionObj(userId);

        return res
          .status(HttpCode.OK)
          .json({ msg: 'Added to wishlist.', userActions: newResult, wishlistCount });
      }
      case SupportedActions.WISHLIST_REMOVE: {
        const result = await UserActionsModel.findOne({ user_id: userObjectId });

        if (result !== null) {
          const index = result.wishlist.findIndex((item) => item.update_id.equals(updateObjectId));
          if (index !== -1) {
            result.wishlist.splice(index, 1);
          } else {
            return res.status(HttpCode.OK).json({ msg: 'No wishlist entry found for updateId' });
          }
        } else {
          return res.status(HttpCode.OK).json({ msg: 'No user actions document found' });
        }

        await result.save();

        const wishlistCount = await UserActionsModel.countDocuments({
          'wishlist.update_id': updateObjectId
        });

        const newResult = await getPopulatedUserActionObj(userId);

        return res.status(HttpCode.OK).json({
          msg: 'removed from wishlist successfully',
          userActions: newResult,
          wishlistCount
        });
      }
      case SupportedActions.NOT_INTERESTED: {
        let result = await UserActionsModel.findOne({ user_id: userObjectId });

        if (result !== null) {
          const existingEntry = result.not_interested.find((item) =>
            item.update_id.equals(updateObjectId)
          );

          if (existingEntry !== null && existingEntry !== undefined) {
            if (
              existingEntry.additional_info === undefined ||
              existingEntry.additional_info === null
            ) {
              existingEntry.additional_info = { reasons: [] };
            }

            if (reason !== null && reason !== undefined) {
              existingEntry.additional_info.reasons.push(reason);
            }
            result.markModified('not_interested');
            await result.save(); // Save the updated result
          } else {
            // Create new entry if updateId not found
            result.not_interested.push({
              update_id: updateObjectId,
              timestamp: new Date(),
              additional_info: additionalInfo
            });
          }

          // Save the changes made to result
          await result.save(); // Saving the updated result
        } else {
          // Create new user entry if user not found
          result = new UserActionsModel({
            user_id: userObjectId,
            not_interested: [
              {
                update_id: updateObjectId,
                timestamp: new Date(),
                additional_info: additionalInfo
              }
            ]
          });

          // Save the newly created result
          await result.save();
        }

        // Save the result
        return res.status(HttpCode.OK).json({ result, msg: 'added to notInterested successfully' });
      }
      case SupportedActions.NOT_INTERESTED_UNDO: {
        const result = await UserActionsModel.findOne({ user_id: userObjectId });

        if (result !== null) {
          if (reason !== undefined) {
            // Remove the particular string from the reasons array
            result.not_interested.forEach((item) => {
              item.additional_info.reasons = item.additional_info.reasons.filter(
                (r: string) => r !== reason
              );
            });
          } else {
            // Remove the whole object if reason is undefined
            const index = result.not_interested.findIndex((item) =>
              item.update_id.equals(updateObjectId)
            );
            if (index !== -1) {
              result.not_interested.splice(index, 1);
            } else {
              return res
                .status(HttpCode.OK)
                .json({ msg: 'No not interested entry found for updateId' });
            }
          }
          result.markModified('not_interested');

          await result.save();
        } else {
          return res.status(HttpCode.OK).json({ msg: 'No user actions document found' });
        }

        await result.save();

        return res
          .status(HttpCode.OK)
          .json({ result, msg: 'removed from notinterested successfully' });
      }
    }
  } catch (e) {
    console.log(e);
  }
}) as express.RequestHandler);

UserActionsRouter.get('/userdata', (async (req, res, next) => {
  try {
    const userId = verifyToken(req);

    if (userId === '') {
      return res.status(HttpCode.UNAUTHORIZED).json({ msg: 'User is not logged in' });
    }

    const userActionData = await getPopulatedUserActionObj(userId as string);

    return res.status(HttpCode.OK).json({ userAction: userActionData });
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    next(error);
  }
}) as express.RequestHandler);

// const getWishlistCounts = async (data: SocialMediaUpdate[]): Promise<any> => {
//   const updateIds = data.map((obj) => new mongoose.Types.ObjectId(obj._id));
//   const results = await UserActionsModel.aggregate([
//     {
//       $match: {
//         'wishlist.update_id': { $in: updateIds }
//       }
//     },
//     {
//       $unwind: '$wishlist' // Deconstruct the wishlist array
//     },
//     {
//       $match: {
//         'wishlist.update_id': { $in: updateIds }
//       }
//     },
//     {
//       $group: {
//         _id: '$wishlist.update_id', // Group by update_id
//         count: { $sum: 1 } // Count occurrences of each update_id
//       }
//     }
//   ]);

//   const formattedResults = results.map((result) => ({
//     id: result._id,
//     count: result.count
//   }));

//   // Return the array of formatted results
//   return formattedResults;
// };

// UserActionsRouter.post('/wishCount', (async (req, res, next) => {
//   const userId = verifyToken(req);

//   const filters = req.body;
//   let data = [];
//   try {
//     if (filters.location.location_id !== undefined && filters.location.location_id !== null) {
//       // TODO: Fix the search results bug here. This doesn't work for Around Me.
//       if (filters.location.location_id !== 'around_me') {
//         const locationData = await redisClient.get(filters.location.location_id);

//         if (locationData !== null && locationData !== undefined) {
//           data = JSON.parse(locationData).irrelevantData;
//         }
//       } else {
//         data = (await getUpdatesForFeedOrAdmin(userId, filters, false))
//           ?.irrelevantData as SocialMediaUpdate[];
//       }
//     }

//     if (data === undefined || data === null) {
//       console.log(
//         `Error while fetching updates for feed for the user: ${userId}. Returned null or undefined data`
//       );

//       next({
//         httpCode: HttpCode.INTERNAL_SERVER_ERROR,
//         description: `An error occured while fetching feed for user: ${userId}`
//       });
//       return;
//     }
//     const response = await getWishlistCounts(data);
//     // mixpanel.track('Feed accessed');
//     return res.status(HttpCode.OK).json(response);
//   } catch (error) {
//     next(error);
//   }
// }) as express.RequestHandler);
