import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { UserData } from './user-data.model';
import { SocialMediaUpdates } from './social-media-updates.model';

const userActionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.ObjectId,
      ref: UserData,
      required: true,
      unique: true
    },
    wishlist: [
      {
        update_id: {
          type: mongoose.Schema.ObjectId,
          required: true,
          ref: SocialMediaUpdates,
        },
        timestamp: {
          type: Date
        }
      }
    ],
    not_interested: [
      {
        update_id: {
          type: mongoose.Schema.ObjectId,
          required: true,
          ref: SocialMediaUpdates,
        },
        timestamp: {
          type: Date
        },
        additional_info: {
          type: Object
        }
      }
    ]
  },
  TIMESTAMPS_MONGOOSE
);

export default mongoose.model('UserAction', userActionSchema);
