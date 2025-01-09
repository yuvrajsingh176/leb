import { INSTAGRAM_HANDLES } from '../constants/instagram-handles.constants';
import { SocialMediaUpdatesController } from '../controllers/social-media-updates.controller';
import { cronLogger } from '../logger/winston.config';
import { InstagramGraphApi } from '../services/instagram.service';

export const onSocialMediaDump = async (
  cronName: string
): Promise<{ successCount: number; failedCount: number }> => {
  let successCount = 0;
  let failedCount = 0;
  for (const handleData of INSTAGRAM_HANDLES) {
    try {
      const instaHandleDetails = await InstagramGraphApi.getMediaFromHandles(handleData.handle);
      cronLogger.info(
        'socialMediaPostsDumper->onSocialMediaDump successfully fetched handleDetails: ' +
          instaHandleDetails.data
      );
      if (
        instaHandleDetails?.data.business_discovery !== undefined &&
        instaHandleDetails?.data.business_discovery !== null
      ) {
        const body = {
          updates: instaHandleDetails?.data.business_discovery.media?.data,
          source: 'instagram',
          business_handle: handleData.handle
        };
        cronLogger.info(
          'socialMediaPostsDumper->onSocialMediaDump starting to dump for handle: ' +
            handleData.handle
        );
        const savedPosts = await SocialMediaUpdatesController.create(body);
        cronLogger.info(
          cronName +
            ' succussfully dumped data for handle: ' +
            handleData.handle +
            ' data: ' +
            savedPosts.toString()
        );
        successCount++;
      } else {
        cronLogger.info(
          'socialMediaPostsDumper->onSocialMediaDump failed to dump for handle: ' +
            handleData.handle +
            ' because instaHandleDetails?.business_discovery was' +
            instaHandleDetails?.data.business_discovery
        );
        failedCount++;
      }
    } catch (e: any) {
      cronLogger.error(
        cronName +
          ' Failed to dump data for handle: ' +
          handleData.handle +
          ' becuase of error: ' +
          e.toString()
      );
      console.log(e);
      failedCount++;
    }
  }
  return { successCount, failedCount };
};
