import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';

// Creation Of Schema
const interestSchema = new mongoose.Schema(
  {
    interest_name: {
      type: String,
      required: [true, 'Interest Name is required']
    },
    interest_icon: {
      type: String,
      required: [true, 'Interest icon is required']
    },
    display_name: {
      type: String
    },
    updates_subinterests: {
      type: Array,
      required: false
    },
    places_subinterests: {
      type: Array,
      required: false
    },
    moods: {
      type: Array,
      required: false
    },
    order: {
      type: Number,
      required: false
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const Interests = mongoose.model('Interests', interestSchema);
