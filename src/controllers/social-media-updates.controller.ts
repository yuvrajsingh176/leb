import mongoose from 'mongoose';
import { SocialMediaUpdates } from '../models/social-media-updates.model';
import type {
  InstagramMediaType,
  InstagramUpdate,
  PlaceObj,
  S3ContentType,
  SocialMediaUpdate,
  UpdateDetails,
  UpdateSource,
  S3MediaUploadable
} from '../types/global.types';
import {
  // createPresignedUrlWithClient,
  getAnduploadToS3
  // getPresignedUrlViaPromise
} from '../services/aws-s3.service';
import { getBoundsOfDistance } from 'geolib';
import { AroundlyPlaces } from '../models/aroundly-place.model';
import { redisClient } from '../services/redis-connection.service';
import { parseUpdate } from '../helpers/update-media.helper';
// import { UserSubscriptions } from '../models/user-subscriptions.model';
// import { HttpCode, WHATSAPP_UPDATES_TOPIC_ID } from '../constants/global.constants';
// import { Interests } from '../models/interests.model';

const getFileExtension = (mediaType: InstagramMediaType): '.jpg' | '.mp4' => {
  switch (mediaType) {
    case 'IMAGE': {
      return '.jpg';
    }
    case 'VIDEO': {
      return '.mp4';
    }
    default: {
      return '.jpg';
    }
  }
};

const getContentType = (mediaType: InstagramMediaType): S3ContentType => {
  switch (mediaType) {
    case 'IMAGE': {
      return 'image/jpeg';
    }
    case 'VIDEO': {
      return 'video/mp4';
    }
    default: {
      return 'image/jpeg';
    }
  }
};

export const getMediaFileForS3 = async (
  eachUpdate: S3MediaUploadable,
  businessHandle: string,
  source: UpdateSource
): Promise<string> => {
  const { media_type: mediaType } = eachUpdate;

  const fileName = `${source}-${businessHandle}-${eachUpdate.id}${getFileExtension(mediaType)}`;

  await getAnduploadToS3(eachUpdate.media_url, getContentType(mediaType), fileName);

  return fileName;
};

export const getThumnailFileForS3 = async (
  eachUpdate: InstagramUpdate,
  businessHandle: string,
  source: UpdateSource
): Promise<string> => {
  const fileName = `${source}-${businessHandle}-${eachUpdate.id}-thumbnail${'.jpg'}`;

  await getAnduploadToS3(eachUpdate.thumbnail_url, 'image/jpeg', fileName);

  return fileName;
};

const updateDetails = async (
  eachUpdate: InstagramUpdate,
  businessHandle: string,
  source: UpdateSource
): Promise<SocialMediaUpdate> => ({
  social_media_update_id: eachUpdate.id,
  social_media_handle: businessHandle,
  source,
  social_media_update_details: {
    ...eachUpdate,
    // eslint-disable-next-line no-extra-boolean-cast
    media_url: Boolean(eachUpdate.media_url)
      ? await getMediaFileForS3(eachUpdate, businessHandle, source)
      : '',
    thumbnail_url:
      // eslint-disable-next-line no-extra-boolean-cast
      Boolean(eachUpdate.thumbnail_url)
        ? await getThumnailFileForS3(eachUpdate, businessHandle, source)
        : ''
  },
  source_link: eachUpdate.permalink,
  trends_history: [
    {
      timestamp: new Date(),
      like_count: eachUpdate.like_count,
      comments_count: eachUpdate.comments_count
    }
  ],
  timestamp: eachUpdate.timestamp
});

const parseInstagramData = async (
  instagramUpdatesData: InstagramUpdate[],
  businessHandle: string,
  source: UpdateSource
): Promise<SocialMediaUpdate[]> => {
  const parsedUpdates = await Promise.all(
    instagramUpdatesData.map(
      async (eachUpdate) => await updateDetails(eachUpdate, businessHandle, source)
    )
  );
  return parsedUpdates;
};

const parseUpdatesData = async (updatesData: UpdateDetails): Promise<SocialMediaUpdate[]> => {
  try {
    if (updatesData.source === 'instagram') {
      // Gets all the updates from the database and filters out the ones which are already present in the database.
      const allPostIDsFromDump = (
        await SocialMediaUpdatesController.getAllUpdates({ source: 'instagram' })
      ).map((item) => item.social_media_update_id);
      // TODO: In the future, we need to update the Instagram data.
      const filteredUpdates = updatesData.updates.filter(
        (update) => !allPostIDsFromDump.includes(update.id)
      );

      const alreadyScrapedUpdates: any[] = updatesData.updates.filter((update) =>
        allPostIDsFromDump.includes(update.id)
      );

      for (const update of alreadyScrapedUpdates) {
        await SocialMediaUpdates.findOneAndUpdate(
          { social_media_update_id: update?.id, source: 'instagram' },
          {
            $push: {
              trends_history: {
                timestamp: new Date(),
                like_count: update.like_count,
                comments_count: update.comments_count
              }
            }
          }
        );
      }

      // eslint-disable-next-line no-extra-boolean-cast
      return Boolean(filteredUpdates.length)
        ? await parseInstagramData(filteredUpdates, updatesData.business_handle, updatesData.source)
        : await Promise.resolve([]);
    } else if (updatesData.source === 'aroundly') {
      return await parseInstagramData(
        updatesData.updates,
        updatesData.business_handle,
        updatesData.source
      );
    } // TODO: else if bookmyshow, skillbox etc.
  } catch (e) {
    console.log(e);
  }

  return [];
};

export const SocialMediaUpdatesController = {
  remove: async (props: any) => {
    try {
      await SocialMediaUpdates.deleteOne(props);
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  update: async (updateId: string, updatesData: any) => {
    try {
      return await SocialMediaUpdates.updateOne(
        { _id: new mongoose.Types.ObjectId(updateId) },
        {
          $set: updatesData
        },
        { upsert: true }
      );
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  create: async (updatesData: any) => {
    try {
      const updates = await parseUpdatesData(updatesData);

      return await SocialMediaUpdates.create(updates);
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  insertMany: async (updatesData: any) => {
    try {
      return await SocialMediaUpdates.insertMany(updatesData);
    } catch (e) {
      console.log('Error while creating a new scrapped resource: ', e);
    }
  },
  count: async () => {
    try {
      const totalCount = await SocialMediaUpdates.count();
      return totalCount;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  createWithoutUpload: async (update: any) => {
    try {
      return await SocialMediaUpdates.create(update);
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getOne: async (props: any) => {
    try {
      const data = await SocialMediaUpdates.findOne(props)
        .populate('related_aroundly_place_ids')
        .populate('interest_categories');
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getAllUpdates: async (props: any) => {
    try {
      const data = await SocialMediaUpdates.find(props).select({
        _id: 1,
        social_media_update_id: 1
      });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  findOneAndUpdate: async (props: any = {}, updateDetails: any) => {
    try {
      const data = await SocialMediaUpdates.findOneAndUpdate(props, updateDetails, {
        new: true
      });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getAll: async (skip = 0, limit = 0, props?: any) => {
    try {
      const data = await SocialMediaUpdates.find(props)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('related_aroundly_place_ids', {
          _id: 1,
          name: 1,
          rating: 1,
          google_maps_details: { formatted_address: 1, types: 1 }
        })
        .populate('interest_categories');
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  leanGet: async (props?: any, selectItems?: any) => {
    try {
      const data = await SocialMediaUpdates.find(props).select(selectItems);
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getPostsOfBusiness: async (props?: any) => {
    try {
      const data = await SocialMediaUpdates.find(props)
        .select({
          expires_at: 1,
          social_media_update_details: { thumnail_url: 1, media_type: 1, media_url: 1 },
          update_type: 1,
          source_link: 1,
          source: 1,
          caption_title: 1,
          caption_summary: 1,
          media_metadata: 1,
          related_aroundly_place_ids: 1,
          _id: 1,
          social_media_handle: 1
        })
        .sort({ expires_at: 1 })
        .populate('related_aroundly_place_ids');
      // .populate('interest_categories');
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getFromArrayOfIds: async (arr: string[]) => {
    try {
      const data = await SocialMediaUpdates.find({ _id: { $in: arr } }).sort({ timestamp: -1 });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getFeedData: async (
    userId?: string | undefined,
    filters?: any,
    shouldFetchAddressComps?: boolean
  ) => {
    try {
      const queries: any = {
        is_published: true,
        is_relevant: true
        // expires_at: { $gte: new Date() }
      };

      if (filters !== 'undefined' && filters !== undefined) {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (filters.update_type?.length) queries.update_type = { $in: filters.update_type };

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (filters.event_mood?.length) queries.event_mood = { $in: filters.event_mood };

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (filters.caption) {
          queries.$or = [
            { caption_title: { $regex: filters.caption, $options: 'i' } },
            { caption_summary: { $regex: filters.caption, $options: 'i' } }
            // { social_media_update_details: { caption: { $regex: filters.caption, $options: 'i' } } }
          ];
        }

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (filters.interest_categories?.length)
          queries.interest_categories = {
            $in: filters.interest_categories.map((i: string) => new mongoose.Types.ObjectId(i))
          };

        const currentDateStart = new Date();
        currentDateStart.setHours(0);
        currentDateStart.setMinutes(0);
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (filters.expires_at) {
          queries.expires_at = {
            $gte: currentDateStart
          };
          if (filters.expires_at.greater_than !== undefined) {
            queries.expires_at.$gte = new Date(filters.expires_at.greater_than);
          }
          if (filters.expires_at.less_than !== undefined) {
            queries.expires_at.$lte = new Date(filters.expires_at.less_than);
          }
        } else {
          queries.expires_at = { $gte: currentDateStart };
        }
      }

      const aroundlyPlaceFilter =
        shouldFetchAddressComps === true
          ? {
              _id: 1,
              name: 1,
              place_id: 1,
              google_maps_details: {
                rating: 1,
                formatted_address: 1,
                address_components: 1
              }
            }
          : {
              _id: 1,
              name: 1,
              place_id: 1,
              google_maps_details: {
                rating: 1,
                formatted_address: 1
              }
            };

      const data = await AroundlyPlaces.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [filters.location.longitude, filters.location.latitude]
            },
            distanceField: 'distance',
            maxDistance: filters.location.radius,
            includeLocs: 'location',
            spherical: false
          }
        },
        { $project: { _id: 1, distance: 1 } },
        {
          $lookup: {
            from: 'social-media-updates',
            localField: '_id',
            foreignField: 'related_aroundly_place_ids',
            pipeline: [
              {
                $match: queries
              },
              {
                $project: {
                  social_media_update_details: {
                    id: 0,
                    comments_count: 0,
                    like_count: 0,
                    media_product_type: 0,
                    timestamp: 0
                  }
                }
              },
              {
                $lookup: {
                  from: 'interests',
                  let: { ids: '$interest_categories' },
                  pipeline: [
                    { $match: { $expr: { $in: ['$_id', '$$ids'] } } },
                    { $project: { interest_name: 1, _id: 1 } }
                  ],
                  as: 'interest_categories'
                }
              },
              {
                $lookup: {
                  from: 'aroundlyplaces',
                  let: { place_ids: '$related_aroundly_place_ids' },
                  pipeline: [
                    { $match: { $expr: { $in: ['$_id', '$$place_ids'] } } },
                    {
                      $project: aroundlyPlaceFilter
                    }
                  ],
                  as: 'related_aroundly_place_ids'
                }
              },
              {
                $lookup: {
                  from: 'favorites',
                  let: { id: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$update_id', '$$id'] },
                            {
                              $eq: [
                                '$user_id',
                                userId !== undefined ? new mongoose.Types.ObjectId(userId) : ''
                              ]
                            }
                          ]
                        }
                      }
                    },
                    {
                      $project: {
                        _id: 0,
                        status: 1
                      }
                    }
                  ],
                  as: 'save'
                }
              },
              {
                $unwind: {
                  path: '$save',
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                $lookup: {
                  from: 'favorites',
                  let: { id: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$update_id', '$$id'] },
                            {
                              $eq: ['$status', true]
                            }
                          ]
                        }
                      }
                    }
                  ],
                  as: 'saves'
                }
              }
            ],
            as: 'updates'
          }
        }
      ]);

      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getPlaceFeed: async (filters?: any): Promise<SocialMediaUpdate[]> => {
    try {
      const currentDateStart = new Date();
      currentDateStart.setHours(0);
      currentDateStart.setMinutes(0);

      // const queries: any = {
      //   is_published: true,
      //   is_relevant: true,
      //   expires_at: { $gte: currentDateStart }
      // };

      // const data = await AroundlyPlaces.aggregate([
      //   {
      //     $geoNear: {
      //       near: {
      //         type: 'Point',
      //         coordinates: [filters.location.longitude, filters.location.latitude]
      //       },
      //       distanceField: 'distance',
      //       maxDistance: filters.location.radius,
      //       includeLocs: 'location',
      //       spherical: false
      //     }
      //   },
      //   {
      //     $project: {
      //       _id: 1,
      //       name: 1,
      //       place_id: 1,
      //       google_maps_details: {
      //         rating: 1,
      //         formatted_address: 1
      //       },
      //       swiggy_dine_out_details: {
      //         cuisine: 1
      //       },
      //       geo_location: 1
      //     }
      //   },
      //   {
      //     $lookup: {
      //       from: 'social-media-updates',
      //       localField: '_id',
      //       foreignField: 'related_aroundly_place_ids',
      //       pipeline: [
      //         {
      //           $match: {
      //             is_published: true,
      //             is_relevant: true,
      //             expires_at: { $gte: currentDateStart }
      //           }
      //         },
      //         {
      //           $project: {
      //             _id: 1,
      //             caption_summary: 1,
      //             caption_title: 1,
      //             expires_at: 1,
      //             social_media_handle: 1,
      //             cta_links: 1,
      //             interest_categories: 1,
      //             is_best: 1,
      //             media_metadata: 1,
      //             modified_at: 1,
      //             related_aroundly_place_ids: 1,
      //             source: 1,
      //             source_link: 1,
      //             starts_at: 1,
      //             update_type: 1
      //           }
      //         }
      //       ],
      //       as: 'updates'
      //     }
      //   }
      // ]);

      const centerPoint = {
        latitude: filters.location.latitude,
        longitude: filters.location.longitude
      };
      const distanceInMeters = filters.location.radius;

      // Calculate the bounding box
      const boundingBox = getBoundsOfDistance(centerPoint, distanceInMeters);

      // Bounding box coordinates
      const southwest = boundingBox[0]; // { latitude, longitude }
      const northeast = boundingBox[1]; // { latitude, longitude }

      // MongoDB Bounding Box
      const mongoBoundingBox = [
        [southwest.longitude, southwest.latitude], // [longitude, latitude] for southwest corner
        [northeast.longitude, northeast.latitude] // [longitude, latitude] for northeast corner
      ];

      const updates = await SocialMediaUpdates.aggregate([
        {
          $match: {
            is_published: true,
            is_relevant: true,
            expires_at: { $gte: currentDateStart }
          }
        },
        {
          $lookup: {
            from: 'interests',
            let: { ids: '$interest_categories' },
            pipeline: [
              { $match: { $expr: { $in: ['$_id', '$$ids'] } } },
              { $project: { interest_name: 1, _id: 1 } }
            ],
            as: 'interest_categories'
          }
        },
        {
          $lookup: {
            from: 'aroundlyplaces',
            localField: 'related_aroundly_place_ids',
            foreignField: '_id',
            as: 'related_aroundly_place_ids',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  place_id: 1,
                  google_maps_details: {
                    rating: 1,
                    formatted_address: 1
                  },
                  swiggy_dine_out_details: {
                    cuisine: 1
                  },
                  known_for: 1,
                  geo_location: 1
                }
              }
            ]
          }
        },
        {
          $project: {
            _id: 1,
            caption_summary: 1,
            caption_title: 1,
            expires_at: 1,
            social_media_handle: 1,
            cta_links: 1,
            interest_categories: 1,
            is_best: 1,
            media_metadata: 1,
            modified_at: 1,
            created_at: 1,
            related_aroundly_place_ids: 1,
            source: 1,
            source_link: 1,
            starts_at: 1,
            update_type: 1
          }
        },
        {
          $match: {
            related_aroundly_place_ids: {
              $elemMatch: {
                geo_location: {
                  // $near: {
                  //   $geometry: {
                  //     type: 'Point',
                  //     coordinates: [filters.location.longitude, filters.location.latitude]
                  //   },
                  //   $maxDistance: 50000
                  // }
                  $geoWithin: {
                    $box: mongoBoundingBox
                  }
                }
              }
            }
          }
        }
      ]);

      return updates;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};

export const getPlaceFeedData = async (filters?: any): Promise<PlaceObj[]> => {
  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
  const updates = await SocialMediaUpdatesController.getPlaceFeed(filters);

  const parsedUpdates: SocialMediaUpdate[] = JSON.parse(JSON.stringify(updates)).map(parseUpdate);

  const places: PlaceObj[] = [];

  parsedUpdates.forEach((update) => {
    update.related_aroundly_place_ids?.forEach((place) => {
      const placeIndex = places.findIndex((p) => p._id === place._id);

      if (placeIndex === -1) {
        places.push({
          ...place,
          updates: [update]
        });
      } else {
        places[placeIndex].updates.push(update);
      }
    });
  });

  places.forEach((p) => {
    p.updates.sort((a: any, b: any) => {
      return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
    });
  });

  places.sort((a: any, b: any) => {
    return (
      new Date(a.updates[0].expires_at).getTime() - new Date(b.updates[0].expires_at).getTime()
    );
  });

  // places.forEach((p) => {
  //   if (p.updates.length !== 0) {
  //     p.updates = p.updates.map((u: SocialMediaUpdate) => ({
  //       ...u,
  //       social_media_update_details: {
  //         ...u.social_media_update_details,
  //         media_url:
  //           u.social_media_update_details.media_url !== '' &&
  //           u.social_media_update_details.media_url !== null &&
  //           u.social_media_update_details.media_url !== undefined &&
  //           u.social_media_update_details.media_url !== false &&
  //           u.social_media_update_details.media_url !== true
  //             ? createPresignedUrlWithClient(
  //                 u.social_media_update_details.media_type !== 'VIDEO'
  //                   ? 'compressed-' + u.social_media_update_details.media_url
  //                   : 'updated-' + u.social_media_update_details.media_url
  //               )
  //             : null,
  //         thumbnail_url:
  //           u.social_media_update_details.thumbnail_url !== '' &&
  //           u.social_media_update_details.thumbnail_url !== null &&
  //           u.social_media_update_details.thumbnail_url !== undefined &&
  //           u.social_media_update_details.thumbnail_url !== false &&
  //           u.social_media_update_details.thumbnail_url !== true
  //             ? createPresignedUrlWithClient(u.social_media_update_details.thumbnail_url)
  //             : null
  //       }
  //     }));
  //     p.updates = p.updates.map((u: SocialMediaUpdate) => ({
  //       ...u,
  //       media_metadata: {
  //         media_compressed: {
  //           ...u.media_metadata?.media_compressed,
  //           url: createPresignedUrlWithClient(u.media_metadata?.media_compressed.key as string)
  //         },
  //         media_original: {
  //           ...u.media_metadata?.media_original,
  //           url: createPresignedUrlWithClient(u.media_metadata?.media_original.key as string)
  //         }
  //       }
  //     }));
  //   }
  // });

  // if (filters.location.location_id !== 'around_me') {
  //   await redisClient.setEx(
  //     `places_${filters.location.location_id}`,
  //     60 * 30,
  //     JSON.stringify(responseData)
  //   );
  // }
  if (filters.location.location_id !== 'around_me') {
    await redisClient.setEx(
      'places_' + filters.location.location_id,
      60 * 30,
      JSON.stringify(places)
    );
  }

  return places;
};

// export const getUpdatesForFeedOrAdmin = async (
//   userId: string | undefined,
//   filters?: any,
//   shouldFetchAddressComps?: boolean
// ): Promise<
//   { relevantData: SocialMediaUpdate[]; irrelevantData: SocialMediaUpdate[] } | undefined
// > => {
//   // let interests: any[] = [];
//   // if (userId !== undefined) {
//   //   const UserSubscription = await UserSubscriptions.findOne({
//   //     user_id: new mongoose.Types.ObjectId(userId),
//   //     topic_id: new mongoose.Types.ObjectId(WHATSAPP_UPDATES_TOPIC_ID)
//   //   });

//   //   if (UserSubscription === null) {
//   //     next({ httpCode: HttpCode.BAD_REQUEST, description: 'User is not subscribed' });
//   //     return;
//   //   }

//   //   interests = UserSubscription.interests;
//   // } else {
//   // interests = await Interests.find({}).distinct('_id');
//   // }

//   // let coordinates;

//   // if (
//   //   UserSubscription.coordinates?.latitude !== undefined &&
//   //   UserSubscription.coordinates?.latitude !== null
//   // ) {
//   //   coordinates = UserSubscription.coordinates;
//   // } else {
//   //   const city = CITIES.filter(function (item) {
//   //     return item.name === UserSubscription.city;
//   //   });
//   //   if (city.length === 0) {
//   //     next({ httpCode: HttpCode.BAD_REQUEST, description: "Selected city isn't available" });
//   //     return;
//   //   }
//   //   coordinates = city[0].coordinates;
//   // }

//   // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
//   const updates = await SocialMediaUpdatesController.getFeedData(
//     userId,
//     filters,
//     shouldFetchAddressComps
//   );
//   const distance = updates.map((item) => item.distance);
//   // const allData: SocialMediaUpdate[] = [];
//   let relevantData: SocialMediaUpdate[] = [];
//   let irrelevantData: SocialMediaUpdate[] = [];
//   const updatesMap = new Map<string, boolean>();

//   updates.forEach((item) => {
//     item.updates.forEach((update: any) => {
//       // const exists = update.interest_categories?.filter(function (item) {
//       //   if (interests.includes(item._id)) {
//       //     return true;
//       //   }
//       //   return false;
//       // });

//       // if (exists !== null && exists !== undefined && exists.length > 0) {
//       //   // Note: Below change is made to ensure the response has only the interest categories that the user is subscribed to.
//       //   update.interest_categories = exists; // Remove this line if the above note is not required.
//       //   relevantData.push(update);
//       // } else {
//       if (updatesMap.get(update._id.toJSON() as string) !== true) {
//         irrelevantData.push(update);
//         updatesMap.set(update._id.toJSON() as string, true);
//       }
//       // }

//       // allData.push(update);
//     });
//   });

//   // TODO: We need to combine both and show them as one feed and then make the filtering as per expires_at
//   relevantData = relevantData.sort((a: any, b: any) => a.expires_at - b.expires_at);
//   irrelevantData = irrelevantData.sort((a: any, b: any) => a.expires_at - b.expires_at);

//   const newIrrelevantData = await Promise.all(
//     irrelevantData.map(async (u) => ({
//       ...u,
//       social_media_update_details: {
//         ...u.social_media_update_details,
//         media_url:
//           u.social_media_update_details.media_url !== '' &&
//           u.social_media_update_details.media_url !== null &&
//           u.social_media_update_details.media_url !== undefined &&
//           u.social_media_update_details.media_url !== false &&
//           u.social_media_update_details.media_url !== true
//             ? await getPresignedUrlViaPromise(u.social_media_update_details.media_url)
//             : null,
//         thumbnail_url:
//           u.social_media_update_details.thumbnail_url !== '' &&
//           u.social_media_update_details.thumbnail_url !== null &&
//           u.social_media_update_details.thumbnail_url !== undefined &&
//           u.social_media_update_details.thumbnail_url !== false &&
//           u.social_media_update_details.thumbnail_url !== true
//             ? await getPresignedUrlViaPromise(u.social_media_update_details.thumbnail_url)
//             : null
//       }
//     }))
//   );

//   const newRelevantData = await Promise.all(
//     relevantData.map(async (u) => ({
//       ...u,
//       social_media_update_details: {
//         ...u.social_media_update_details,
//         media_url:
//           u.social_media_update_details.media_url !== '' &&
//           u.social_media_update_details.media_url !== null &&
//           u.social_media_update_details.media_url !== undefined &&
//           u.social_media_update_details.media_url !== false &&
//           u.social_media_update_details.media_url !== true
//             ? await getPresignedUrlViaPromise(u.social_media_update_details.media_url)
//             : null,
//         thumbnail_url:
//           u.social_media_update_details.thumbnail_url !== '' &&
//           u.social_media_update_details.thumbnail_url !== null &&
//           u.social_media_update_details.thumbnail_url !== undefined &&
//           u.social_media_update_details.thumbnail_url !== false &&
//           u.social_media_update_details.thumbnail_url !== true
//             ? await getPresignedUrlViaPromise(u.social_media_update_details.thumbnail_url)
//             : null
//       }
//     }))
//   );

//   // console.log(
//   //   'relevantData',
//   //   relevantData.map((item) => ({
//   //     timestamp: item.timestamp,
//   //     interest_categories: item.interest_categories?.map((item) => item.interest_name)
//   //   }))
//   // );
//   // console.log(
//   //   'irrelevantData',
//   //   irrelevantData.map((item) => ({
//   //     timestamp: item.timestamp,
//   //     interest_categories: item.interest_categories?.map((item) => item.interest_name)
//   //   }))
//   // );
//   const relevantDataWithDistance = newRelevantData.map((update, index) => ({
//     ...update,
//     distance: distance[index]
//   }));

//   const irrelevantDataWithDistance = newIrrelevantData.map((update, index) => ({
//     ...update,
//     distance: distance[index]
//   }));

//   const responseData = {
//     relevantData: relevantDataWithDistance,
//     irrelevantData: irrelevantDataWithDistance
//   };

//   if (filters.location.location_id !== 'around_me') {
//     await redisClient.setEx(filters.location.location_id, 60 * 30, JSON.stringify(responseData));
//   }

//   return responseData;
// };
