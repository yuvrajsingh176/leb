import mongoose from 'mongoose';
import { Favorites } from '../models/favorites.model';

export const FavoriteServices = {
  remove: async (props: any) => {
    try {
      await Favorites.updateOne(
        props,
        {
          $set: {
            status: false
          }
        },
        { upsert: true }
      );
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  update: async (props: any, data: any) => {
    try {
      const updatedData = await Favorites.updateOne(
        props,
        {
          $set: data
        },
        { upsert: true, new: true }
      );
      return updatedData;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  add: async (data: any) => {
    try {
      await Favorites.create(data);
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  get: async (props: any) => {
    try {
      const data = await Favorites.findOne(props).populate('update_id');
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getAll: async (props: any) => {
    try {
      const data = await Favorites.find(props).populate('update_id');
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getFeedData: async (userId: string) => {
    try {
      const data = await Favorites.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'social-media-updates',
            let: { id: '$update_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
              {
                $lookup: {
                  from: 'businesses',
                  let: { id: '$business_id' },
                  pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$id'] } } }],
                  as: 'business_id'
                }
              },
              {
                $unwind: {
                  path: '$business_id',
                  preserveNullAndEmptyArrays: true
                }
              },
              {
                $lookup: {
                  from: 'interests',
                  let: { ids: '$interest_categories' },
                  pipeline: [{ $match: { $expr: { $in: ['$_id', '$$ids'] } } }],
                  as: 'interest_categories'
                }
              },
              {
                $lookup: {
                  from: 'aroundlyplaces',
                  let: { place_ids: '$related_aroundly_place_ids' },
                  pipeline: [{ $match: { $expr: { $in: ['$_id', '$$place_ids'] } } }],
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
            as: 'update_id'
          }
        },
        {
          $unwind: {
            path: '$update_id',
            preserveNullAndEmptyArrays: true
          }
        }
      ]);
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getExpiringSavedUpdates: async (userId: string) => {
    try {
      const data = await Favorites.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'social-media-updates',
            let: { id: '$update_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $lte: ['$expires_at', new Date(Date.now() + 24 * 60 * 60 * 1000)] },
                      {
                        $eq: ['$_id', '$$id']
                      }
                    ]
                  }
                }
              }
            ],
            as: 'update_id'
          }
        },
        {
          $unwind: {
            path: '$update_id',
            preserveNullAndEmptyArrays: true
          }
        }
      ]);
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};
