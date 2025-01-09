import OpenAI from 'openai';
import type mongoose from 'mongoose';
import dotenv from 'dotenv';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';
import { Interests } from '../models/interests.model';
import type { EmbeddingResponse } from '../types/global.types';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// export const generateCategories = async (caption: string): Promise<string | undefined> => {
//   const prompt = await getPromptForCategoryGeneration(caption);
//   const messages: ChatCompletionMessageParam[] = [
//     {
//       role: 'system',
//       content:
//         'You are a category assigner who assigns category by taking a caption and return results in an array'
//     },
//     {
//       role: 'user',
//       content: prompt
//     }
//   ];
//   try {
//     const chatCompletion = await openai.chat.completions.create({
//       messages,
//       model: 'gpt-4-1106-preview'
//     });
//     if (chatCompletion.choices[0].message.content !== null) {
//       return chatCompletion.choices[0].message.content;
//     }
//   } catch (e) {
//     console.log(e);
//     throw e;
//   }
// };

export const getMappedCategories = async (): Promise<
  Array<{ _id: mongoose.Types.ObjectId; interest_name: string }>
> => {
  const categories = await Interests.find({});
  return categories.map((item) => ({
    _id: item._id,
    interest_name: item.interest_name
  }));
};

// const getPromptForCategoryGeneration = async (caption: string): Promise<string> => {
//   const mappedCategories = getMappedCategories();
//   return `Below is the caption from an instagram post. Can you categorise this post based on the caption into the most probable category that it falls into. Give me your probability from high to low for your top 3 categories that this post might fall into.
// Caption:${caption}
// I have 16 categories. Below are the categories in an array interest_name is the name of the category

// ${JSON.stringify(mappedCategories)}

// Can you give me the result in array`;
// };

export const getPromptForPlaces = ({
  location,
  activities,
  people,
  only_google: onlyGoogle
}: any): string => {
  const _activities = activities.join(', ');
  if (onlyGoogle !== null && onlyGoogle !== undefined) {
    return `Places to ${_activities} with ${people} in ${location}`;
  }
  return `You are my travel agent. You need to give me places in ${location}. I want to ${_activities} with ${people}. Make sure to give me the names of around 5 places which is active and working with their geolocations in an array in this format [{"name":"place name", "latitude":"place latitude", "longitude":"place longitude", "address":"place address"}]`;
};

export const getPromptResponseForPlaces = async (
  prompt: string,
  promptResponse: string
): Promise<string | undefined> => {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'You are a travel agent who always gives data in response as a json'
    },
    {
      role: 'user',
      content: prompt
    }
  ];
  if (promptResponse !== null) {
    messages.push({ role: 'assistant', content: promptResponse });
    messages.push({
      role: 'user',
      content:
        "I want a json response but it's missing in the response can you please share the response with a json data"
    });
  }
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model: 'gpt-4'
    });
    if (chatCompletion.choices[0].message.content !== null) {
      return chatCompletion.choices[0].message.content;
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
};

/* 
  Below are the actual OPEN AI calls for gettings embeddings and chat completions.
*/

// const EMBEDDINGS_MODEL = 'text-embedding-ada-002';
const EMBEDDINGS_MODEL = 'text-embedding-3-small';
// const EMBEDDINGS_MODEL = 'text-embedding-3-large';

export const createEmbeddingsForInputText = async (
  textInput: string
): Promise<EmbeddingResponse> => {
  try {
    const embedding = await openai.embeddings.create({
      model: EMBEDDINGS_MODEL,
      input: textInput
    });

    return embedding as EmbeddingResponse;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

// const GPT_MODEL = 'gpt-4-0125-preview';
const GPT_MODEL = 'gpt-3.5-turbo-0125';

export const chatCompletionsAPICall = async (
  messages: ChatCompletionMessageParam[],
  model = GPT_MODEL,
  temperature = 0
): Promise<string> => {
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model,
      temperature
    });
    // console.log(chatCompletion.usage);
    // console.log(chatCompletion.model);
    if (chatCompletion.choices[0].message.content !== null) {
      return chatCompletion.choices[0].message.content;
    }

    return '';
  } catch (e) {
    console.log(e);
    throw e;
  }
};
