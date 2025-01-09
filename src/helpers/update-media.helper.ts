import { createPresignedUrlWithClient } from '../services/aws-s3.service';
import type { SocialMediaUpdate } from '../types/global.types';

export const parseUpdate = (u: SocialMediaUpdate): SocialMediaUpdate => ({
  // ...u,
  // social_media_update_details: {
  //   ...u.social_media_update_details,
  //   media_url:
  //     u.social_media_update_details.media_url !== '' &&
  //     u.social_media_update_details.media_url !== null &&
  //     u.social_media_update_details.media_url !== undefined &&
  //     u.social_media_update_details.media_url !== false &&
  //     u.social_media_update_details.media_url !== true
  //       ? createPresignedUrlWithClient(u.social_media_update_details.media_url)
  //       : null,
  //   thumbnail_url:
  //     u.social_media_update_details.thumbnail_url !== '' &&
  //     u.social_media_update_details.thumbnail_url !== null &&
  //     u.social_media_update_details.thumbnail_url !== undefined &&
  //     u.social_media_update_details.thumbnail_url !== false &&
  //     u.social_media_update_details.thumbnail_url !== true
  //       ? createPresignedUrlWithClient(u.social_media_update_details.thumbnail_url)
  //       : null
  // }

  ...u,
  media_metadata: {
    media_compressed: {
      ...u.media_metadata?.media_compressed,
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      url: u.media_metadata?.media_compressed?.key
        ? createPresignedUrlWithClient(u.media_metadata?.media_compressed.key)
        : ''
    },
    media_original: {
      ...u.media_metadata?.media_original,
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      url: u.media_metadata?.media_original?.key
        ? createPresignedUrlWithClient(u.media_metadata?.media_original.key)
        : ''
    }
  }
});

export const parsePlace = (p: any): void => {
  if (p.updates?.length !== 0) {
    p.updates = p.updates.map(parseUpdate);
  }
};
