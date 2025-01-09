import express from 'express';
import { HttpCode } from '../constants/global.constants';
import { createEmbeddingsForAllPosts } from '../helpers/post-embedding.helper';
// import { chatCompletionsAPICall, createEmbeddingsForInputText } from '../services/openai.service';
// import { PostEmbeddingsController } from '../controllers/post-embeddings.controller';
import { verifyToken } from '../helpers/tokens.helper';
import { AssistQueryController } from '../controllers/assist-query.controller';
// import { redisClient } from '../services/redis-connection.service';
// import type { SocialMediaUpdate } from '../types/global.types';
// import { getUpdatesForFeedOrAdmin } from '../controllers/social-media-updates.controller';
// import {
//   extractArrayFromGPTResponse,
//   getRetrievalLayerPromptForKeywords,
//   getRetrievalPromptForFilters,
//   getRetrievalPromptForFilters,
//   getSubInterestCategoriesPrompt
// } from '../constants/gpt-prompts';
import {
  curationAPI,
  personalisationAPI,
  placesRagSearch,
  planPersonalisationAPI
} from '../services/aroundly-ai-api';
import { UserData } from '../models/user-data.model';
import type { PlaceObj } from '../types/global.types';
// import { computePlanPersonalisation } from '../helpers/plan-personalisation';

export const PostEmbeddingsRouter = express.Router();

PostEmbeddingsRouter.post('/create-for-all-updates', (async (req, res, next) => {
  try {
    const embeddings = await createEmbeddingsForAllPosts();
    return res
      .status(HttpCode.OK)
      .json({ msg: 'Embeddings successfully saved', result: embeddings });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// PostEmbeddingsRouter.post('/search', (async (req, res, next) => {
//   try {
//     const { query, filters } = req.body;
//     const deviceId = req.headers['device-id'] as string;
//     const userId = verifyToken(req);

//     let updatesData: SocialMediaUpdate[] = [];

//     if (filters.location.location_id !== undefined && filters.location.location_id !== null) {
//       // TODO: Fix the search results bug here. This doesn't work for Around Me.
//       if (filters.location.location_id !== 'around_me') {
//         const locationData = await redisClient.get(filters.location.location_id);

//         if (locationData !== null && locationData !== undefined) {
//           updatesData = JSON.parse(locationData).irrelevantData;
//         }
//       } else {
//         const updatesRaw = (await getUpdatesForFeedOrAdmin(userId, filters, false))
//           ?.irrelevantData as SocialMediaUpdate[];

//         updatesData = JSON.parse(JSON.stringify(updatesRaw));
//       }
//     }

//     if (filters.update_type !== undefined && filters.update_type !== null) {
//       updatesData = updatesData.filter(
//         (u: SocialMediaUpdate) => u.update_type === filters.update_type
//       );
//     }

//     const updateMap = new Map();

//     updatesData.forEach((u: SocialMediaUpdate) => {
//       updateMap.set(u._id, u);
//     });

//     // Now the updates data is ready. We start the process of RAG.
//     const retrievalLayerPromptMessages = getRetrievalLayerPromptForKeywords(query);
//     const retrievalLayerKeywordsString = await chatCompletionsAPICall(retrievalLayerPromptMessages);

//     const retrievalLayerPromptForFilters = await getRetrievalPromptForFilters(query);
//     const retrievalLayerResponseForFilters = await chatCompletionsAPICall(
//       retrievalLayerPromptForFilters
//     );

//     const jsonResp: any = extractArrayFromGPTResponse(retrievalLayerResponseForFilters, /\{.*\}/s)
//       .content as string[];

//     jsonResp.who = jsonResp.who.includes(', ') === true ? jsonResp.who.split(', ') : [jsonResp.who];
//     jsonResp.age_group =
//       jsonResp.age_group.includes(', ') === true
//         ? jsonResp.age_group.split(', ')
//         : [jsonResp.age_group];
//     jsonResp.interest_categories =
//       jsonResp.interest_categories.includes(', ') === true
//         ? jsonResp.interest_categories.split(', ')
//         : [jsonResp.interest_categories];

//     const retrievalLayerPromptForSubCategories = await getSubInterestCategoriesPrompt(
//       query,
//       jsonResp.interest_categories
//     );

//     const retrievalLayerRespForSubCategories = await chatCompletionsAPICall(
//       retrievalLayerPromptForSubCategories
//     );

//     console.log(retrievalLayerResponseForFilters);
//     console.log(retrievalLayerRespForSubCategories);

//     // Time to create Embeddings of User Query + Retrieval keywords from GPT.
//     const inputEmbeddingsResp = await createEmbeddingsForInputText(
//       query + ' ' + retrievalLayerKeywordsString
//     );

//     // Results from Embeddings are cleaned and converted to proper JSON objects.
//     const results = await PostEmbeddingsController.search(
//       inputEmbeddingsResp.data[0].embedding,
//       updatesData.map((u: SocialMediaUpdate) => u._id as string)
//     );

//     console.log(results.caption_mix.length);
//     const resultsFromEmbeddings = results.caption_mix
//       .map((e: any) => updateMap.get(e.update_id.toJSON()))
//       .filter((u: any) => Boolean(u));

//     // TODO: Commenting the Augumentation part due to the latency of GPT3.5 API. Uncomment it after figuring out a faster augumentation logic.

//     // Time for Augumentation of results for better ranking.
//     // const augumentationLayerPromptMessages = getAugumentingLayerPromptForPosts(
//     //   query,
//     //   resultsFromEmbeddings
//     // );

//     // const augumentationLayerRespString = await chatCompletionsAPICall(
//     //   augumentationLayerPromptMessages
//     // );

//     // console.log(augumentationLayerRespString);
//     // const parsedAugumentationLayerResp = extractArrayFromGPTResponse(augumentationLayerRespString)
//     //   .content as string[];

//     // console.log(parsedAugumentationLayerResp);

//     // const resultsFromAugumentation = Object.keys(
//     //   parsedAugumentationLayerResp.reduce((acc: Record<string, boolean>, curr: string) => {
//     //     acc[curr] = true;
//     //     return acc;
//     //   }, {})
//     // )
//     //   .map((id: any) => updateMap.get(id))
//     //   .filter((u) => Boolean(u));

//     const assistQueryData = await AssistQueryController.create({
//       user_id: userId,
//       query,
//       device_id: deviceId,
//       supporting_info: {
//         location: filters.location,
//         gpt_retrieval_keywords: retrievalLayerKeywordsString,
//         results: results.caption_mix
//       }
//     });

//     // Return query ID and social media updates.
//     return res.status(HttpCode.OK).json({
//       query_id: assistQueryData.toJSON()._id.toJSON(),
//       results: resultsFromEmbeddings
//     });
//   } catch (error) {
//     next(error);
//   }
// }) as express.RequestHandler);

PostEmbeddingsRouter.post('/places-search', (async (req, res, next) => {
  try {
    const { query, filters } = req.body;
    const deviceId = req.headers['device-id'] as string;
    const userId = verifyToken(req);

    const searchAPIResponse = await placesRagSearch(query, filters.location, filters.update_type);

    searchAPIResponse.result.forEach((r: PlaceObj) => {
      r.updates = r.updates.filter((s) => {
        if (filters.update_type === 'review') {
          return s.update_type !== 'event' && s.update_type !== 'general_update';
        }
        return s.update_type === filters.update_type;
      });
    });

    const assistQueryData = await AssistQueryController.create({
      user_id: userId,
      query,
      device_id: deviceId,
      supporting_info: {
        ...searchAPIResponse.additional_info,
        results: searchAPIResponse.result
      }
    });

    // Return query ID and social media updates.
    return res.status(HttpCode.OK).json({
      query_id: assistQueryData.toJSON()._id.toJSON(),
      results: searchAPIResponse.result
    });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

PostEmbeddingsRouter.post('/curation', (async (req, res, next) => {
  try {
    const { filters } = req.body;
    const userId = verifyToken(req);

    if (userId === undefined || userId === '' || userId === null) {
      return res.status(HttpCode.UNAUTHORIZED).json({ msg: 'User is not logged in' });
    }

    // const UserSubscription = await UserSubscriptions.findOne({
    //   user_id: new mongoose.Types.ObjectId(userId),
    //   topic_id: new mongoose.Types.ObjectId(WHATSAPP_UPDATES_TOPIC_ID)
    // });

    const userData = await UserData.findOne({ _id: userId });

    const curationResp = await curationAPI(
      {
        who: userData?.stepout,
        date_of_birth: userData?.date_of_birth,
        gender: userData?.gender,
        interests: JSON.parse(JSON.stringify(userData !== null ? userData?.interests : []))
      },
      filters.location
    );

    return res.status(HttpCode.OK).json(curationResp);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

PostEmbeddingsRouter.post('/personalisation', (async (req, res, next) => {
  try {
    const { filters, previous_updates: previousUpdates = [] } = req.body;
    const userId = verifyToken(req);

    if (userId === undefined || userId === '' || userId === null) {
      return res.status(HttpCode.UNAUTHORIZED).json({ msg: 'User is not logged in' });
    }

    const personalisationResp = await personalisationAPI(
      {
        _id: userId,
        previous_updates: previousUpdates
      },
      filters.location
    );

    return res.status(HttpCode.OK).json(personalisationResp);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

PostEmbeddingsRouter.post('/plan-personalisation', (async (req, res, next) => {
  try {
    const { wishlist_id: wishlistId, filters } = req.body;
    const userId = verifyToken(req);

    // const wishlistId = '668f955e3584aed5af50dcac';
    // const userId = '653f6770273d4ca0373d7c07';

    if (userId === undefined || userId === null) {
      return res.status(HttpCode.UNAUTHORIZED).json({ msg: 'User is not logged in' });
    }

    const personalisationResp = await planPersonalisationAPI(wishlistId, filters.location, userId);
    // await computePlanPersonalisation(wishlistId, filters.location, userId);

    return res.status(HttpCode.OK).json(personalisationResp);
  } catch (error) {
    // TODO: Notify on slack that the API has failed.
    next(error);
  }
}) as express.RequestHandler);

PostEmbeddingsRouter.get('/recent-queries', (async (req, res, next) => {
  try {
    const userId = verifyToken(req);

    const recentQueries = await AssistQueryController.getPrevThreeUnique({
      user_id: userId
    });

    return res.status(HttpCode.OK).json({
      recent_queries: recentQueries
    });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
