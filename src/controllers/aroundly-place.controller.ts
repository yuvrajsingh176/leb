import mongoose from 'mongoose';
import { AroundlyPlaces } from '../models/aroundly-place.model';

export const AroundlyPlacesController = {
  remove: async (props: any) => {
    try {
      await AroundlyPlaces.deleteOne(props);
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  update: async (updateId: string, placesData: any) => {
    try {
      return await AroundlyPlaces.updateOne(
        { _id: new mongoose.Types.ObjectId(updateId) },
        {
          $set: placesData
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
      return await AroundlyPlaces.create(updatesData);
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  get: async (props: any) => {
    try {
      const data = await AroundlyPlaces.findOne(props).select({
        _id: 1,
        place_id: 1,
        name: 1,
        place_category: 1,
        geo_location: 1,
        google_maps_details: {
          formatted_address: 1,
          formatted_phone_number: 1,
          rating: 1,
          additional_details: 1,
          types: 1,
          address_components: 1,
          reviews: 1,
          opening_hours: 1
        },
        swiggy_dine_out_details: {
          cuisine: 1,
          url: 1,
          best_selling_items: 1,
          price_for_two: 1,
          reviews_count: 1,
          rating: 1
        }
      });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getAll: async (skip = 0, limit = 0, props: any = {}) => {
    try {
      const data = await AroundlyPlaces.find(props)
        .skip(skip)
        .limit(limit)
        .select({
          _id: 1,
          name: 1,
          google_maps_details: { formatted_address: 1 }
        });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};
