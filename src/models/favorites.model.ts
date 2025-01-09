import mongoose from 'mongoose';
import { UserData } from './user-data.model';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { SocialMediaUpdates } from './social-media-updates.model';

const FavoriteSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: UserData
    },
    update_id: {
      type: mongoose.Types.ObjectId,  
      required: true,
      ref: SocialMediaUpdates
    },
    status: { type: Boolean, require: true, default: false },
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

export const Favorites = mongoose.model('Favorites', FavoriteSchema);
