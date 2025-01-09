import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { UserData } from './user-data.model';

const SubscriptionSchema = new mongoose.Schema(
  {
    topic_name: {
      type: String,
      required: true
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

export const Subscriptions = mongoose.model('Subscription', SubscriptionSchema);
