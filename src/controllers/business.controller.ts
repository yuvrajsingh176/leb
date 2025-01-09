import mongoose from 'mongoose';
import { Business } from '../models/business.model';
import { AroundlyPlaces } from '../models/aroundly-place.model';

export const BusinessController = {
  remove: async (props: any) => {
    try {
      await Business.deleteOne(props);
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  count: async (props: any = {}) => {
    try {
      return await Business.find(props).count();
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  update: async (updateId: string, data: any) => {
    try {
      return await Business.updateOne(
        { _id: new mongoose.Types.ObjectId(updateId) },
        {
          $set: data
        }
      );
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  create: async (data: any) => {
    try {
      return await Business.create(data);
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  get: async (props: any) => {
    try {
      const data = await Business.findOne(props)
        .select({ _id: 1, locations: 1, name: 1, category: 1, ratings: 1, phone: 1, socials: 1 })
        .populate('locations', {
          _id: 1,
          google_maps_details: { formatted_address: 1 },
          place_id: 1
        });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getBusinessesAround: async (latitude: number, longitude: number, radius: number) => {
    try {
      const filteredAroundlyPlaces = await AroundlyPlaces.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            distanceField: 'distance',
            maxDistance: radius,
            includeLocs: 'location',
            spherical: true
          }
        },
        { $project: { _id: 1 } }
      ]);
      return await Business.find({
        locations: { $in: filteredAroundlyPlaces.map((d) => d._id) }
      }).populate('locations');
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getAll: async (skip = 0, limit = 0, props: any = {}) => {
    try {
      const data = await Business.find(props)
        .skip(skip)
        .limit(limit)
        .populate('locations')
        .sort({ created_at: -1 });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};
