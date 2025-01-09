import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';

const AvatarSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const Avatars = mongoose.model('Avatars', AvatarSchema);
