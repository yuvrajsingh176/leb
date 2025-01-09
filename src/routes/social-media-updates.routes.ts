import express from 'express';
import multer from 'multer';
import { HttpCode } from '../constants/global.constants';
import { logger } from '../logger/winston.config';
import {
  SocialMediaUpdatesController,
  getPlaceFeedData
  // getUpdatesForFeedOrAdmin
} from '../controllers/social-media-updates.controller';
import { SocialMediaUpdates } from '../models/social-media-updates.model';
import { chatCompletionsAPICall, getMappedCategories } from '../services/openai.service';
// import mixpanel from '../services/mixpanel.service';
import { uploadToS3 } from '../services/aws-s3.service';
import type { PlaceObj } from '../types/global.types';
import { redisClient } from '../services/redis-connection.service';
import moment from 'moment';
// import { verifyToken } from '../helpers/tokens.helper';
import { extractArrayFromGPTResponse, getPostCategorizationPrompt } from '../constants/gpt-prompts';
import { parseUpdate } from '../helpers/update-media.helper';

export const SocialMediaUpdatesRouter = express.Router();

const upload = multer();

// const parsePreSignedUrl = async (u: any): Promise<SocialMediaUpdate> => ({
//   ...u,
//   social_media_update_details: {
//     ...u.social_media_update_details,
//     media_url:
//       u.social_media_update_details.media_url !== '' &&
//       u.social_media_update_details.media_url !== null &&
//       u.social_media_update_details.media_url !== undefined &&
//       u.social_media_update_details.media_url !== false &&
//       u.social_media_update_details.media_url !== true
//         ? await getPresignedUrlViaPromise(u.social_media_update_details.media_url)
//         : null,
//     thumbnail_url:
//       u.social_media_update_details.thumbnail_url !== '' &&
//       u.social_media_update_details.thumbnail_url !== null &&
//       u.social_media_update_details.thumbnail_url !== undefined &&
//       u.social_media_update_details.thumbnail_url !== false &&
//       u.social_media_update_details.thumbnail_url !== true
//         ? await getPresignedUrlViaPromise(u.social_media_update_details.thumbnail_url)
//         : null
//   }
// });

/**
 * Below route is used for adding social media updates using Dump API call on Aroundly Admin.
 */
// TODO: Add Admin user permission check
SocialMediaUpdatesRouter.post('/', (async (req, res, next) => {
  try {
    logger.info('Social media post api requested for body: ', req.body);
    const savedPosts = await SocialMediaUpdatesController.create(req.body);
    logger.info('Social media post api responded with created document: ', savedPosts);
    return res.status(HttpCode.OK).json(savedPosts); // TODO: Logger should log this request and response.
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

/**
 * Below route is used for adding social media updates using Dump API call on Aroundly Admin.
 */
SocialMediaUpdatesRouter.post('/upload/:fileName', upload.single('file'), (async (
  req,
  res,
  next
) => {
  try {
    logger.info(`Uploading file with file name ${req.params.fileName}`);

    const fileKey = await uploadToS3(req.file, req.params.fileName);
    return res.status(HttpCode.OK).json(fileKey);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

/**
 * Below Route is for adding a custom post using the Aroundly Admin UI.
 */
// TODO: Add Admin user permission check
SocialMediaUpdatesRouter.post('/add-post', (async (req, res, next) => {
  try {
    logger.info('Social media post api requested for body: ', req.body);

    const savedPost = await SocialMediaUpdatesController.createWithoutUpload(req.body);
    return res.status(HttpCode.OK).json(savedPost);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

SocialMediaUpdatesRouter.get('/for-place/:aroundlyPlaceId', (async (req, res, next) => {
  try {
    const aroundlyPlaceId = req.params.aroundlyPlaceId;
    const newDate = new Date();
    newDate.setHours(0);
    newDate.setMinutes(0);

    const queries: any = {
      related_aroundly_place_ids: { $in: [aroundlyPlaceId] },
      expires_at: { $gte: newDate }
    };

    const updates = await SocialMediaUpdatesController.getPostsOfBusiness(queries);

    const updatesWithUrls = updates.map((u) => parseUpdate(u.toJSON()));

    logger.info('Showing results for social media updates where queries are: ', queries);
    logger.info('Update for the queries', updatesWithUrls.length);

    return res.status(HttpCode.OK).json(updatesWithUrls);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

SocialMediaUpdatesRouter.get('/count', (async (req, res, next) => {
  try {
    const updatesCount = await SocialMediaUpdatesController.count();
    return res.status(HttpCode.OK).json(updatesCount);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

/**
 * Used for showing all the posts on Social Media Updates page on the Aroundly Admin UI.
 */
// TODO: Add Admin user permission check
SocialMediaUpdatesRouter.get('/', (async (req, res, next) => {
  try {
    const { dataFrom, dataTo, isRelevant, isPublished, handle, skip, limit } = req.query;

    const queries: any = {};

    if (handle !== null && handle !== undefined && handle !== 'all') {
      queries.social_media_handle = handle;
    }
    if (isPublished === 'true') {
      queries.is_published = true;
    } else if (isPublished === 'false') {
      queries.is_published = false;
    }

    if (isRelevant === 'true') {
      queries.is_relevant = true;
    } else if (isRelevant === 'false') {
      queries.is_relevant = false;
    }

    if (dataFrom !== null && dataFrom !== undefined) {
      queries.created_at = {
        ...queries.created_at,
        $gte: moment(dataFrom as string)
          .hour(0)
          .minute(0)
          .second(0)
          .format()
      };
    }

    if (dataTo !== null && dataTo !== undefined) {
      queries.created_at = {
        ...queries.created_at,
        $lte: moment(dataTo as string)
          .hour(23)
          .minute(59)
          .second(59)
          .format()
      };
    }
    let updates;

    const skipNumber = typeof skip === 'string' ? parseInt(skip, 10) : undefined;
    const limitNumber = typeof limit === 'string' ? parseInt(limit, 10) : undefined;

    if (skipNumber !== undefined && limitNumber !== undefined) {
      updates = await SocialMediaUpdatesController.getAll(skipNumber, limitNumber, queries);
    } else {
      updates = await SocialMediaUpdatesController.getAll(0, 0, queries);
    }

    logger.info('Showing results for social media updates where queries are: ', queries);
    logger.info('Update for the queries', updates);

    return res.status(HttpCode.OK).json(updates);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// SocialMediaUpdatesRouter.post('/feed', (async (req, res, next) => {
//   const userId = verifyToken(req);
//   const filters = req.body;
//   try {
//     if (filters.location.location_id !== undefined && filters.location.location_id !== null) {
//       const locationData = await redisClient.get(filters.location.location_id);

//       if (locationData !== null && locationData !== undefined) {
//         return res.status(HttpCode.OK).json(JSON.parse(locationData));
//       }
//     }

//     const data = await getUpdatesForFeedOrAdmin(userId, filters, false);
//     if (data === undefined || data === null) {
//       logger.error(
//         `Error while fetching updates for feed for the user: ${userId}. Returned null or undefined data`
//       );

//       next({
//         httpCode: HttpCode.INTERNAL_SERVER_ERROR,
//         description: `An error occured while fetching feed for user: ${userId}`
//       });
//       return;
//     }
//     logger.info(`Showing results for user: ${userId}`, data);

//     // mixpanel.track('Feed accessed');
//     return res.status(HttpCode.OK).json(data);
//   } catch (error) {
//     next(error);
//   }
// }) as express.RequestHandler);

SocialMediaUpdatesRouter.post('/places-feed', (async (req, res, next) => {
  const filters = req.body;
  try {
    if (filters.location.location_id !== undefined && filters.location.location_id !== null) {
      const locationData = await redisClient.get('places_' + filters.location.location_id);

      if (locationData !== null && locationData !== undefined) {
        return res
          .status(HttpCode.OK)
          .json(JSON.parse(locationData).filter((p: PlaceObj) => p.updates.length > 0));
      }
    }

    const data = await getPlaceFeedData(filters);
    if (data === undefined || data === null) {
      logger.error(
        `Error while fetching places feed for location: ${filters.location.location_id}. Returned null or undefined data`
      );

      next({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: `An error occured while fetching places feed for location: ${filters.location.location_id}`
      });
      return;
    }

    logger.info(`Showing results for location: ${filters.location.location_id}`, data);

    return res.status(HttpCode.OK).json(data.filter((p: PlaceObj) => p.updates.length > 0));
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

SocialMediaUpdatesRouter.get('/handles', (async (req, res, next) => {
  try {
    const data = await SocialMediaUpdates.distinct('social_media_handle');
    logger.info('Social media handles api responded with response: ', data);
    return res.status(HttpCode.OK).json(data);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// SocialMediaUpdatesRouter.get('/admin', (async (req, res, next) => {
//   const { userId } = req.query;
//   try {
//     const data = await getUpdatesForFeedOrAdmin(userId as string, next);
//     if (data === undefined || data === null) {
//       next({
//         httpCode: HttpCode.INTERNAL_SERVER_ERROR,
//         description: 'An error occured while fetching data'
//       });
//       logger.error(
//         'An error occured while fetching data for sending updates on admin return data either null or undefined '
//       );
//       return;
//     }
//     logger.info('Social media admin api responded with response: ', data);
//     return res.status(HttpCode.OK).json(data.relevantData);
//   } catch (error) {
//     next(error);
//   }
// }) as express.RequestHandler);

SocialMediaUpdatesRouter.put('/:media_id', (async (req, res, next) => {
  try {
    const socialMediaID = req.params.media_id;
    const updateTopic = req.body;
    logger.info(
      'Social media put /:media_id api requested with param: ',
      socialMediaID,
      ' and body ',
      updateTopic
    );
    const result = await SocialMediaUpdatesController.update(socialMediaID, updateTopic);
    logger.info('Social media put /:media_id api responded with updated document: ', result);
    res.status(HttpCode.OK).json({
      msg: 'Data updated successfully',
      result
    });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// SocialMediaUpdatesRouter.post('/generate/ai-categories', (async (req, res, next) => {
//   try {
//     const caption: string = req.body.caption;
//     logger.info('AI interest category generation started for caption : ', caption);
//     const categoriesInString = await generateCategories(caption);
//     logger.info(
//       'AI interest category generated for : ',
//       caption,
//       ' in string is ',
//       categoriesInString
//     );
//     if (typeof categoriesInString === 'string') {
//       const categoriesInArray = getExtractedPrompt(categoriesInString);
//       logger.info(
//         'AI interest category generated for : ',
//         caption,
//         ' in json is ',
//         categoriesInArray
//       );
//       res.status(HttpCode.OK).json(categoriesInArray);
//     } else {
//       logger.info(
//         'AI interest category generation failed becuase there was a bad response from open-ai : '
//       );
//       next({ httpCode: HttpCode.BAD_REQUEST, description: 'Failed to process the string' });
//     }
//   } catch (e) {
//     console.log(e);
//     next(e);
//   }
// }) as express.RequestHandler);

SocialMediaUpdatesRouter.post('/generate/caption-analysis', (async (req, res, next) => {
  try {
    const caption: string = req.body.caption;

    logger.info('AI Caption analysis generation started for caption : ', caption);

    const postCategorizationPromptMessages = getPostCategorizationPrompt(caption);

    const captionAnalysisInString = await chatCompletionsAPICall(
      await postCategorizationPromptMessages,
      'gpt-4-turbo'
    );

    logger.info(
      `AI Caption analysis for caption: ${caption}, in string is ${captionAnalysisInString}`
    );
    if (typeof captionAnalysisInString === 'string') {
      const mappedCategories = await getMappedCategories();
      const categoriesMap = mappedCategories.reduce((acc: any, category: any) => {
        const interestName = category.interest_name;
        acc[interestName] = category._id.toString();
        return acc;
      }, {});

      const captionAnalysisInJSON: { extracted: boolean; content: any } =
        extractArrayFromGPTResponse(captionAnalysisInString, /\{.*\}/s);

      if (captionAnalysisInJSON.extracted) {
        captionAnalysisInJSON.content.interest_categories =
          captionAnalysisInJSON.content.interest_categories.map((category: any) => {
            return categoriesMap[category];
          });
      }
      logger.info(
        `AI Caption analysis for caption: ${caption}, in JSON is ${JSON.stringify(
          captionAnalysisInJSON
        )}`
      );

      res.status(HttpCode.OK).json(captionAnalysisInJSON);
    } else {
      logger.info(
        'AI caption analysis generation failed becuase there was a bad response from open-ai : '
      );
      next({ httpCode: HttpCode.BAD_REQUEST, description: 'Failed to process the string' });
    }
  } catch (e) {
    console.log(e);
    next(e);
  }
}) as express.RequestHandler);

SocialMediaUpdatesRouter.get('/one-update/:id', (async (req, res, next) => {
  try {
    const socialMediaID = req.params.id;

    const update = await SocialMediaUpdatesController.getOne({ _id: socialMediaID });
    const updateWithUrls = update !== null && parseUpdate(update.toJSON());
    logger.info(`Fetched update with id: ${socialMediaID}`);

    return res.status(HttpCode.OK).json(updateWithUrls);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
