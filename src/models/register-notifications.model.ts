import mongoose from 'mongoose';
import { UserData } from './user-data.model';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';

const RegisterNotificationsSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      unique: true
    },
    notification_token: {
      type: String,
      required: true
    },
    user_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: UserData
    },
    platform: {
      type: String,
      required: true
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const RegisterNotificationsModel = mongoose.model(
  'register-notifications',
  RegisterNotificationsSchema
);
