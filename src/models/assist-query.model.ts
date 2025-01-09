import mongoose from 'mongoose';
import { UserData } from './user-data.model';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';

const AssistQuerySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      ref: UserData
    },
    device_id: {
      type: String
    },
    query: {
      type: String,
      required: true
    },
    supporting_info: {
      type: Object
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const AssistQuery = mongoose.model('assist-query', AssistQuerySchema);
