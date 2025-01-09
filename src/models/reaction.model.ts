import mongoose from 'mongoose';
import { UserData } from './user-data.model';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { SocialMediaUpdates } from './social-media-updates.model';

const ReactionSchema = new mongoose.Schema(
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
    reaction: { type: String, require: true, default: 'none' }, // like'|'dislike'|'none'
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

export const Reactions = mongoose.model('Reaction', ReactionSchema);
