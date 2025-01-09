import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';

const AppVersionSchema = new mongoose.Schema(
  {
    android_build_number: {
      type: Number,
      required: true
    },
    android_app_version: {
      type: String,
      required: true
    },
    ios_build_number: {
      type: Number,
      required: true
    },
    ios_app_version: {
      type: String,
      required: true
    },
    app_name_slug: {
      type: String,
      required: true,
      unique: true
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const AppVersionModel = mongoose.model('app-version', AppVersionSchema);
