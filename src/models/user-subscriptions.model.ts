import mongoose from 'mongoose';
import { Interests } from './interests.model';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { UserData } from './user-data.model';
import { Subscriptions } from './subscription-topics.model';

const UserSubscriptionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: UserData
    },
    topic_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: Subscriptions
    },
    status: {
      type: String,
      enum: ['interested', 'not-interested']
    },
    interests: [{ type: mongoose.Types.ObjectId, ref: Interests }],
    city: {
      type: String,
      required: false
    },
    coordinates: {
      latitude: {
        type: String
      },
      longitude: {
        type: String
      }
    },
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

UserSubscriptionSchema.index({ user_id: 1, topic_id: 1 }, { unique: true });

export const UserSubscriptions = mongoose.model('UserSubscription', UserSubscriptionSchema);
