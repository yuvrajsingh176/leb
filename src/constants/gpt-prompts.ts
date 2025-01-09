import type { ChatCompletionMessageParam } from 'openai/resources/chat';
import type { InterestProps, SocialMediaUpdate } from '../types/global.types';
import { AGE_GROUP_TYPE, GROUP_TYPES_LIST } from './global.constants';
import { InterestsController } from '../controllers/interests.controller';

export const getPostCategorizationPrompt: (
  caption: string
) => Promise<ChatCompletionMessageParam[]> = async (caption: string) => {
  const interests = JSON.parse(JSON.stringify(await InterestsController.getAll({})));
  return [
    {
      role: 'system',
      content: `You are an expert on providing precise and concise responses in JSON. You will be given a Caption by the user and you need to return a JSON Object with the following attributes for the given caption:
      
      1) caption_title - This should be an exact 5 word headline summary of the given caption. 
      
      2) caption_summary - Summarize this event in 140 characters without including venue, date, time, cost, tags, or booking information. Use active voice and a third-person point of view. Start the sentence with an engaging verb. 
      
      3) update_type - (pick only 1) The entered caption can be one among the four strings in this array ["Events/Experiences", "Offers", "Reviews", "General Updates"]. 
      
      Events/Experiences: These are posts related to specific, organized activities or gatherings hosted by a business or organization. This category includes concerts, festivals, workshops, webinars, and other scheduled events. Captions in this category should describe activities or events that are experiential in nature. This includes personal or business experiences at events, or any activity where the primary focus is on the immersive, interactive, or personal nature of the event or activity. If an event is inherently experiential (like storytelling, art exhibitions, interactive workshops), it falls under this category.
      
      Offers: Captions specifically highlighting promotions, deals, discounts, or rewards. These should clearly mention a special incentive like a reduced price, cashback, or an additional benefit for the customer. Incase there are offers on used books, categorise them as General Updates.
      
      Reviews: Captions containing personal opinions, feedback, collection of places or evaluations about products, services, experiences, events, or places. This includes user testimonials and critiques.
      
      General Updates: Any posts that do not specifically fit into the other categories. This could include general news, announcements, informational content, musings, or updates that don't pertain to a specific event, experience, offer, or review. 
      
      4) event_date - Fetch the update date, essentially, validity date of whatever event/ experience/offer is being spoken about in the caption. The update date should be in the YYYY-MM-DD format. If there is a specific timestamp, also provide the time stamp. If there's a time range, pick the last date as the Event Date. If there is no date, leave it blank.
      
      5) place_name - Fetch the place name where the event/experience/offer is happening/ valid. Every event/ experience happens at a place and an offer is used at a place. Mention the place where this is happening. If there is no place, leave it blank. 
      
      6) interest_categories - (pick upto 3 out of the 16. Do not create new.) Categorise each caption into the most relevant interest category from the context provided in the caption. Only choose interest category from the below 16 categories in the array: 
      [ ${interests.map((i: InterestProps) => i.interest_name).join(', ')} ]
       
      
      Specifically for 'Community & Volunteering', ensure that you only capture things that deal with not for profit related stuff/ deals with an update related to a social mission.
      
      7) is_relevant - "YES" or "NO"
      Posts that include festive greetings, recipes, personal or couple anniversary posts, and similar type should be marked as Not relevant or NO. Most of these might fall into General Updates. If some general updates include posts that actually excite people to step out for something new, mark them as an exception as YES.
      
      8) event_mood - (pick only 1) Pick the most relevant mood from the below 5 moods in the array. If there is no relevant mood, leave it blank.
      [ "Festive & Lively",
      "Relaxed & Casual",
      "Cultural & Traditional",
      "Romantic & Intimate",
      "Adventurous & Exciting" ]

      9) event_type - (pick only 1) Pick the most relevant event type from the below 6 types in the array. If there is no relevant event type, leave it blank.
      [ "Parties & Celebrations",
      "Family-Friendly Events",
      "Dining Experiences", 
      "Outdoor & Adventure",
      "Cultural Events",
      "Relaxing Retreats" ]

      10) group_type - (pick only 1) Pick the most relevant group type from the below 4 types in the array. If there is no relevant group type, leave it blank.
      [ "Friends",
      "Couples",
      "Family",
      "Individuals",
      "Professionals",
      "Kids" ]
      
      Remember: All of these captions should be categorised into Events/Experiences, Offers and Marked relevant only if people can step out to them and not what are simple online events or website only offers. 
      
      If you understand this, take the user's caption input and be ready to generate the JSON object.`
    },
    {
      role: 'user',
      content: caption
    }
  ] as ChatCompletionMessageParam[];
};

export const getAugumentingLayerPromptForPosts: (
  userQuery: string,
  posts: SocialMediaUpdate[]
) => ChatCompletionMessageParam[] = (userQuery: string, posts: SocialMediaUpdate[]) => [
  {
    role: 'system',
    content: `Below are the list of events and activities that a user can do. Each line contains _id separated by | and then caption_summary
     
    ${posts.map((post) => `${post._id} | ${post.caption_title}`).join('\n')}

    Based on the user's intent, recommend the top 30 activities (do not generate any of your own and do not repeat the same recommendation) from the list of events and activities. Only return the _id for each of the top 30 recommendations in a flat JSON array. `
    // content: `Below are the list of events and activities that a user can do. Each line contains ID separated by | and then caption_summary

    // ${posts.map((post) => `${post._id} | ${post.caption_summary}`).join('\n')}

    // Give me your top 40 recommendations that perfectly fit the context of the user's input. Return exactly 40 recommendation IDs from above and do not create your own IDs. Keep in mind the ambiance, atmosphere and vibe that the user has mentioned. Number of people for the event or activity must match the number of people the user is requesting for.
    // Only return the IDs in a flat JSON array.
    // `
  },
  // Give me your top 40 recommendations that perfectly fit the context of the user's input. Keep in mind the ambiance, atmosphere and vibe that the user has mentioned. Number of people for the event or activity must match the number of people the user is requesting for. Only return the 5 word summary of the activity which includes who the activity is for in a JSON array.
  {
    role: 'user',
    content: userQuery
  }
];

export const getRetrievalLayerPromptForKeywords: (
  userQuery: string
) => ChatCompletionMessageParam[] = (userQuery: string) => [
  {
    role: 'system',
    content:
      'Generate terms or concepts related to activities or interests mentioned by the user query. Only give me the terms or concepts and nothing else. No serial numbers. Just the words. Return as a single string'
  },
  {
    role: 'user',
    content: userQuery
  }
];

export const getRetrievalPromptForFilters: (
  userQuery: string
) => Promise<ChatCompletionMessageParam[]> = async (userQuery: string) => {
  const interests = JSON.parse(JSON.stringify(await InterestsController.getAll({})));

  return [
    {
      role: 'system',
      content: `You are a friendly assistant with expert knowledge about events and activities.
    You will ensure that you stick to the instructions provided in the below.
    Do not add any new categories beyond the ones mentioned or the ones being mapped.`
    },
    {
      role: 'system',
      content: `Infer the following dimensions from the user input.
      who: provide all the matching categories from the following list in a comma separated format. Provide both partial and perfect matches. (categories: ${GROUP_TYPES_LIST.join(
        ', '
      )}).
      age_group: provide all the perfectly matched age_groups from the following list in a comma separated format. Provide multiple if there are multiple matches. (age_groups: ${AGE_GROUP_TYPE.join(
        ', '
      )}).
      interest_categories: provide all the perfectly matched interests from the following list in a comma seperated format (interests: ${interests
        .map((i: InterestProps) => i.interest_name)
        .join(', ')}).
      If you cannot accurately infer, return NA against that dimension. The output should specifically include each dimension name followed by ':' and then the response in a JSON format.`
    },
    {
      role: 'user',
      content: userQuery
    }
  ];
};

export const getSubInterestCategoriesPrompt: (
  userQuery: string,
  selectedInterests: string[]
) => Promise<ChatCompletionMessageParam[]> = async (userQuery, selectedInterests) => {
  const interests: InterestProps[] = JSON.parse(
    JSON.stringify(await InterestsController.getAll({}))
  );

  const subInterests: string[] = [];

  return [
    {
      role: 'system',
      content: `You are a friendly assistant with expert knowledge about events and activities.
    You will ensure that you stick to the instructions provided in the below.
    Do not add any new categories beyond the ones mentioned or the ones being mapped.`
    },
    {
      role: 'system',
      content: `Infer below from the user input.
      sub_interests_categories: provide all the perfectly matched sub_interest_categories from the following list in a comma seperated format
      (categories:   ${interests
        .filter((i: InterestProps) => selectedInterests.includes(i.interest_name))
        .reduce((acc, curr) => [...acc, ...curr.updates_subinterests], subInterests)
        .join(', ')}   )
      If you cannot accurately infer, return NA against that dimension. The output should specifically include each dimension name followed by ':' and then the response in a JSON format.`
    },
    {
      role: 'user',
      content: userQuery
    }
  ];
};

export const extractArrayFromGPTResponse = (
  text: string,
  regex: RegExp = /\[.*\]/s
): { extracted: boolean; content: any } => {
  try {
    const match = text.match(regex);
    if (match !== null) {
      const extractedArray = JSON.parse(match[0]);
      return { extracted: true, content: extractedArray };
    } else {
      return { extracted: false, content: text };
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
};
