import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';

// Creation Of Schema
const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      required: [true, 'otp is required']
    },
    phone: {
      type: String,
      required: [true, 'phone is required']
    },
    expire: {
      type: Date,
      required: [true, 'expire is required']
    }
  },
  TIMESTAMPS_MONGOOSE
);
export const Otps = mongoose.model('Otps', otpSchema);
