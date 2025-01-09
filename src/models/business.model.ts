import mongoose from 'mongoose';
import { UserData } from './user-data.model';
import { CtaLinkModel, TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { AroundlyPlaces } from './aroundly-place.model';

const BusinessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    locations: {
      type: [mongoose.Types.ObjectId],
      required: true,
      ref: AroundlyPlaces
    },
    icon: {
      type: String,
      required: true
    },
    ratings: {
      type: Number,
      required: true
    },
    reviews: {
      type: Array,
      reuired: false
    },
    quality_score: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false
    },
    events: {
      type: Array,
      required: false
    },
    offers: {
      type: Array,
      required: false
    },
    images: {
      type: Array,
      required: false
    },
    category: {
      type: String,
      required: false
    },
    business_type: {
      type: String,
      required: false
    },
    guide: {
      type: String,
      required: false
    },
    avg_spend: {
      type: String,
      required: false
    },
    Vibe: {
      type: String,
      required: false
    },
    match_score: {
      type: String,
      required: false
    },
    phone: {
      type: String,
      required: false
    },
    email: {
      type: String,
      required: false
    },
    socials: [CtaLinkModel],
    rush_hours: {
      type: Array,
      required: false
    },
    timings: {
      type: Array,
      required: false
    },
    safety: {
      type: String,
      required: false
    },
    safety_industry_rating: {
      type: String,
      required: false
    },
    branches: {
      type: Array,
      required: false
    },
    is_verified_by_aroundly: {
      type: Boolean,
      required: false,
      default: false
    },
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

BusinessSchema.index({ name: 1 }, { unique: true });

export const Business = mongoose.model('Business', BusinessSchema);
