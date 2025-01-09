import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { UserData } from './user-data.model';

const userActionHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.ObjectId,
      ref: UserData,
      required: true
    },
    device_id: {
      type: String
    },
    action_taken: {
      type: String, // directions | view-post | view-store | book-post | book-store | share-post | share-store | share-results | wishlist-add | wishlist-remove | not-interested-add | not-interested-remove
      required: true
    },
    additional_info: {
      type: Object // { update_id: "", place_id: "", location_slug: "<selectedLocation.location_id>", is_recommended: <true if masonry grid> }
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const UserActionHistory = mongoose.model('UserActionHistory', userActionHistorySchema);
