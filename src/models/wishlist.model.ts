import mongoose from 'mongoose';
import { UserData } from './user-data.model';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { SocialMediaUpdates } from './social-media-updates.model';
import { AroundlyPlaces } from './aroundly-place.model';

const WishlistSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: UserData
    },
    name: {
      type: String,
      required: true
    },
    is_name_searchable: {
      type: Boolean,
      default: false
    },
    is_default: {
      type: Boolean,
      default: false
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    collaborators: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: UserData
        },
        added_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: UserData
        },
        added_at: {
          type: Date
        }
      }
    ],
    places: [
      {
        place_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: AroundlyPlaces
        },
        updates: [
          {
            update_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: SocialMediaUpdates
            },
            added_by: {
              type: mongoose.Schema.Types.ObjectId,
              ref: UserData
            },
            added_at: {
              type: Date
            }
          }
        ],
        added_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: UserData
        },
        added_at: {
          type: Date
        }
      }
    ]
  },
  TIMESTAMPS_MONGOOSE
);

export const Wishlist = mongoose.model('wishlists', WishlistSchema);
