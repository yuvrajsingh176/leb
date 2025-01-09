import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';

const InstaHandleSchema = new mongoose.Schema(
  {
    handle: {
      type: String,
      required: true,
      unique: true
    },
    handle_id: {
      type: String
    },
    city: {
      type: String,
      required: true
    },
    status: {
      type: Boolean,
      default: true
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const InstaHandle = mongoose.model('InstaHandle', InstaHandleSchema);
