import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';

// Creation Of Schema
const sourcesSchema = new mongoose.Schema(
  {
    source_label: {
      type: String,
      required: [true, 'Source Label is required']
    },
    source_key: {
      type: String,
      required: [true, 'Source Key is required']
    },
    source_logo: {
      type: String,
      required: [true, 'Source Logo is required for display']
    }
  },
  TIMESTAMPS_MONGOOSE
);

sourcesSchema.index({ source_logo: 1 });

export const Sources = mongoose.model('Sources', sourcesSchema);
