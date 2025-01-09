import mongoose from 'mongoose';
import { Interests } from './interests.model';
import {
  CtaLinkModel,
  EVENT_MOODS_LIST,
  EVENT_TYPES_LIST,
  GROUP_TYPES_LIST,
  SKILL_LEVEL_TYPE,
  AGE_GROUP_TYPE,
  TIMESTAMPS_MONGOOSE,
  OFFERINGSTYPE,
  CUISINESTYPE,
  HIGHLIGHTSTYPE
} from '../constants/global.constants';
import { AroundlyPlaces } from './aroundly-place.model';

const SocialMediaUpdatesSchema = new mongoose.Schema(
  {
    social_media_update_id: {
      type: String,
      required: true
    },
    social_media_handle: {
      type: String
    },
    is_relevant: {
      type: Boolean
    },
    source: {
      type: String,
      required: true
    },
    related_aroundly_place_ids: [
      {
        type: mongoose.Types.ObjectId,
        ref: AroundlyPlaces
      }
    ],
    is_published: {
      type: Boolean
    },
    social_media_update_details: {
      type: Object
    },
    interest_categories: [
      {
        type: mongoose.Types.ObjectId,
        ref: Interests
      }
    ],
    update_type: {
      type: String // "event" or "offer" or "review" or "general_update"
    },
    event_type: [
      {
        type: String,
        enum: EVENT_TYPES_LIST
      }
    ],
    event_mood: [
      {
        type: String,
        enum: EVENT_MOODS_LIST
      }
    ],
    group_type: [
      {
        type: String,
        enum: GROUP_TYPES_LIST
      }
    ],
    source_link: {
      type: String // Link to the Instagram or Bookmyshow.
    },
    timestamp: {
      type: Date
    },
    starts_at: {
      type: Date
    },
    expires_at: {
      type: Date
    },
    caption_summary: {
      type: String
    },
    caption_title: {
      type: String
    },
    cta_links: [
      {
        ...CtaLinkModel,
        price: { type: Number, required: false }
      }
    ],
    skill_level: [
      {
        type: String,
        enum: SKILL_LEVEL_TYPE
      }
    ],
    age_group: [
      {
        type: String,
        enum: AGE_GROUP_TYPE
      }
    ],
    sub_categories: {
      type: [String]
    },
    dishes: {
      type: [String]
    },
    trends_history: {
      type: [Object]
    },
    is_best: {
      type: Boolean,
      default: false
    },
    offerings: [
      {
        type: String,
        enum: OFFERINGSTYPE
      }
    ],
    cuisines: [
      {
        type: String,
        enum: CUISINESTYPE
      }
    ],
    highlights: [
      {
        type: String,
        enum: HIGHLIGHTSTYPE
      }
    ],
    media_metadata: {
      type: Object
    }
  },
  TIMESTAMPS_MONGOOSE
);

SocialMediaUpdatesSchema.index(
  { social_media_update_id: 1, social_media_handle: 1, source: 1 },
  { unique: true }
);
SocialMediaUpdatesSchema.index({ expires_at: -1 });

export const SocialMediaUpdates = mongoose.model('social-media-updates', SocialMediaUpdatesSchema);
