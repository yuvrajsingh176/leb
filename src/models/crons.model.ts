import mongoose from 'mongoose';
import cron from 'node-cron';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';

const CronsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    function_name: {
      type: String,
      required: true
    },
    schedule_expression: {
      type: String, // cron schedule
      required: true,
      validate: {
        validator: function (v: string) {
          return cron.validate(v);
        },
        message: (props: any): string => `${props.value} is not a valid cron schedule expression`
      }
    },
    description: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      required: true
    },
    status: {
      type: String,
      required: false,
      enum: ['running', 'not-running'],
      default: 'not-running'
    },
    lastStoppedByAPIAt: {
      type: Date,
      required: false
    },
    lastStartedByAPIAt: {
      type: Date,
      required: false
    },
    lastStoppingReason: {
      type: String,
      required: false
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const Crons = mongoose.model('Crons', CronsSchema);
