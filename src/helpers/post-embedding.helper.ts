import { SocialMediaUpdatesController } from '../controllers/social-media-updates.controller';
import type { SocialMediaUpdate } from '../types/global.types';
import { createEmbeddingsForInputText } from '../services/openai.service';
import { PostEmbeddingsController } from '../controllers/post-embeddings.controller';

export const createOpenAIEmbeddingForPost = async (update: SocialMediaUpdate): Promise<any> => {
  try {
    const captionMixEmbeddingResp = await createEmbeddingsForInputText(
      update.caption_title +
        ' ' +
        update.caption_summary +
        ' ' +
        update.social_media_update_details?.caption
    );

    return await PostEmbeddingsController.create({
      update_id: update._id,
      data_used:
        update.caption_title +
        ' ' +
        update.caption_summary +
        ' ' +
        (update.social_media_update_details?.caption === undefined
          ? ''
          : update.social_media_update_details?.caption),
      caption_mix_embeddings: captionMixEmbeddingResp.data.filter(
        (d) => d.object === 'embedding'
      )[0].embedding,
      model: captionMixEmbeddingResp.model,
      token_usage: captionMixEmbeddingResp.usage
    });
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const createEmbeddingsForAllPosts = async (): Promise<any> => {
  try {
    // Get all social media updates
    console.log('Fetching all social media updates');
    const updates = await SocialMediaUpdatesController.leanGet(
      {
        is_published: true,
        is_relevant: true
      },
      { _id: 1, caption_title: 1, caption_summary: 1, social_media_update_details: { caption: 1 } }
    );
    console.log('Fetched all social media updates');
    const existingPostEmbeddings = await PostEmbeddingsController.getAll({});
    console.log('Fetched all post embeddings');

    const existingPostEmbeddingsMap: any = {};

    const embeddingsMap = existingPostEmbeddings.reduce((acc, u: any) => {
      acc[u.toJSON().update_id.toJSON()] = true;
      return acc;
    }, existingPostEmbeddingsMap);

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const filteredUpdates = updates.filter((u) => !embeddingsMap[u.toJSON()._id.toJSON()]);

    console.log('updates', updates.length);
    console.log('existingPostEmbeddings', existingPostEmbeddings.length);
    console.log('Filtered Updates', filteredUpdates.length);
    console.log(
      'is matching',
      filteredUpdates.length === updates.length - existingPostEmbeddings.length
    );

    return await Promise.allSettled(
      filteredUpdates.map(async (u) => await createOpenAIEmbeddingForPost(u.toJSON()))
    );
  } catch (e) {
    console.log(e);
    throw e;
  }
};
