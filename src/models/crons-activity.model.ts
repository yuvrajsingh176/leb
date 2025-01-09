import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { Crons } from './crons.model';

const CronActivitySchema = new mongoose.Schema(
  {
    cron_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: Crons
    },
    status: {
      type: String,
      enum: ['passed', 'failed'],
      required: true
    },
    successfully_processed_data_length: {
      type: Number,
      required: false
    },
    unprocessable_data_length: {
      type: Number,
      required: false
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const CronActivity = mongoose.model('CronActivity', CronActivitySchema);
