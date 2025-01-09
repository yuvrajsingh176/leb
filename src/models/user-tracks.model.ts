import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { UserData } from './user-data.model';
import { SocialMediaUpdates } from './social-media-updates.model';

const userTrackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: UserData
    },
    shares: [
      {
        created_at: { type: Date },
        update_id: { type: mongoose.Types.ObjectId, ref: SocialMediaUpdates },
        views: [
          {
            viewed_at: { type: Date },
            user_id: { type: mongoose.Types.ObjectId, ref: UserData }
          }
        ]
      }
    ],
    created_at: {
      type: Date,
      required: false
    },
    modified_at: {
      type: Date,
      required: false
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

export const UserTracks = mongoose.model('UserTracks', userTrackSchema);
