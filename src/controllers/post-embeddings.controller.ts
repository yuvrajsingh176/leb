import mongoose from 'mongoose';
import { PostEmbeddings } from '../models/post-embeddings.model';

export const PostEmbeddingsController = {
  create: async (postEmbeddingsData: any) => {
    try {
      return await PostEmbeddings.create(postEmbeddingsData);
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getAll: async (props: any) => {
    try {
      const data = await PostEmbeddings.find(props).select({ _id: 1, update_id: 1 });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  search: async (inputEmbeddings: number[], updatesList: string[]) => {
    try {
      const queries =
        updatesList.length > 0
          ? { update_id: { $in: updatesList.map((u) => new mongoose.Types.ObjectId(u)) } }
          : {};

      const captionMixAggregate = await (PostEmbeddings.aggregate as any)([
        {
          $vectorSearch: {
            index: 'post_embeddings_index',
            path: 'caption_mix_embeddings',
            queryVector: inputEmbeddings,
            numCandidates: 1000,
            limit: 1000
          }
        },
        {
          $match: queries
        },
        {
          $project: {
            update_id: 1,
            data_used: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        },
        {
          $limit: 100
        }
      ]);

      return {
        caption_mix: captionMixAggregate
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};
