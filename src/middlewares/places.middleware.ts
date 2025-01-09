// import { RequestResponseLog } from '../logger/request';
// import { logger } from '../logger/winston.config';
// import type { PlaceArrProps } from '../types/place';
// import { gMapsTextQuery, getMapsDataFromResponse, saveToDb } from '../helpers/places.helper';
// import type { NextFunction, Response } from 'express';
// import {
//   getExtractedPrompt,
//   getPromptForPlaces,
//   getPromptResponseForPlaces
// } from '../services/openai.services';

// export async function getPlaces(
//   req: any,
//   res: any,
//   next: NextFunction
// ): Promise<Response | undefined> {
//   try {
//     const {
//       location,
//       activities,
//       people,
//       prompt_response: promptResponse,
//       only_google: onlyGoogle,
//       prompt: userPrompt
//     } = req.body;

//     if (userPrompt === undefined || userPrompt === null) {
//       if (location === undefined || typeof location !== 'string') {
//         RequestResponseLog(
//           req,
//           {
//             status: 422,
//             msg: 'Location field is missing or invalid'
//           },
//           'middlewares/places.js'
//         );
//         return res.status(422).json({ msg: 'Location field is missing or invalid' });
//       }
//       if (activities === undefined) {
//         RequestResponseLog(
//           req,
//           {
//             status: 422,
//             msg: 'Activities field is missing or invalid'
//           },
//           'middlewares/places.js'
//         );
//         return res.status(422).json({ msg: 'Activities field is missing or invalid' });
//       }
//       if (people === undefined || typeof people !== 'string') {
//         RequestResponseLog(
//           req,
//           {
//             status: 422,
//             msg: 'People field is missing or invalid'
//           },
//           'middlewares/places.js'
//         );
//         return res.status(422).json({ msg: 'People field is missing or invalid' });
//       }
//     }
//     let prompt = userPrompt;
//     if (userPrompt === undefined || userPrompt === null) {
//       prompt = getPromptForPlaces(req.body);
//     }
//     logger.info({ message: 'Prompt Created: ' + prompt });
//     if (onlyGoogle !== null && onlyGoogle !== undefined) {
//       const gMapsData: PlaceArrProps[] = await gMapsTextQuery(prompt);
//       const id = await saveToDb(gMapsData, prompt, req.body, req.user.id);
//       req.result = {
//         id
//       };
//       req.prompt_response = gMapsData;
//       req.prompt = prompt;
//       next();
//       return;
//     }
//     const result = await getPromptResponseForPlaces(prompt, promptResponse);
//     if (result === undefined || result === null) {
//       RequestResponseLog(
//         req,
//         {
//           status: 500,
//           msg: 'Result not receive from getPromptResponse with prompt ' + prompt
//         },
//         'middlewares/places.js'
//       );
//       return res.status(500).json({ msg: 'Server error' });
//     }
//     const getGmapAndSave = async (content: any): Promise<void> => {
//       const places = await getMapsDataFromResponse(content);
//       if (places === undefined || places === null) {
//         RequestResponseLog(
//           req,
//           {
//             status: 500,
//             msg: 'Result not receive from getMapsDataFromResponse with content ' + content
//           },
//           'middlewares/places.js'
//         );
//         return res.status(500).json({ msg: 'Server error' });
//       }
//       const id = await saveToDb(places, prompt, req.body, req.user.id);
//       req.result = {
//         id
//       };
//       req.prompt_response = result;
//       req.prompt = prompt;
//       next();
//     };
//     const { extracted, content } = getExtractedPrompt(result);
//     if (extracted) {
//       await getGmapAndSave(content);
//     } else {
//       req.result = {
//         id: null
//       };
//       req.prompt_response = result;
//       req.prompt = prompt;
//       next();
//     }
//   } catch (e) {
//     console.log(e);
//     RequestResponseLog(
//       req,
//       {
//         status: 500,
//         msg: 'Server error',
//         error: e
//       },
//       'middlewares/places.js'
//     );
//     return res.status(500).json({ msg: 'Server error' });
//   }
// }
