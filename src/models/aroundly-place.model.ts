import mongoose from 'mongoose';
import { UserData } from './user-data.model';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';

const AroundlyPlacesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    place_id: {
      type: String,
      required: true,
      unique: true
    },
    place_type: {
      type: String,
      required: true
    },
    place_category: {
      type: String,
      required: true
    },
    known_for: {
      type: [String],
      default: []
    },
    geo_location: {
      type: { type: String },
      coordinates: [Number]
    },
    google_maps_details: Object,
    swiggy_dine_out_details: Object,
    zomato_details: Object,
    created_by: {
      type: mongoose.Types.ObjectId,
      required: false,
      ref: UserData
    },
    modified_by: {
      type: mongoose.Types.ObjectId,
      required: false,
      ref: UserData
    }
  },
  TIMESTAMPS_MONGOOSE
);

AroundlyPlacesSchema.index({ geo_location: '2dsphere' });

export const AroundlyPlaces = mongoose.model('AroundlyPlaces', AroundlyPlacesSchema);
