import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { SocialMediaUpdates } from './social-media-updates.model';

const PostEmbeddingsSchema = new mongoose.Schema(
  {
    update_id: {
      type: mongoose.Types.ObjectId,
      ref: SocialMediaUpdates,
      required: true,
      unique: true
    },
    data_used: {
      type: String,
      required: true
    },
    caption_mix_embeddings: {
      type: [Number],
      required: true
    },
    model: {
      type: String
    },
    token_usage: {
      type: Object
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const PostEmbeddings = mongoose.model('post-embeddings', PostEmbeddingsSchema);
