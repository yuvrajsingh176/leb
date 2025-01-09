import { AssistQuery } from '../models/assist-query.model';

// Function to find the most recent three unique queries
const findRecentUniqueQueries = (queries: any): any => {
  const uniqueQueries: Record<string, any> = {};

  // Iterate through sorted queries
  for (const queryObj of queries) {
    // Check if query is unique and not already added to recentUniqueQueries
    if (uniqueQueries[queryObj.query] === undefined) {
      uniqueQueries[queryObj.query] = queryObj;
    }

    // Break loop when we have found three unique recent queries
    if (Object.keys(uniqueQueries).length === 3) {
      break;
    }
  }

  return Object.values(uniqueQueries);
};

export const AssistQueryController = {
  create: async (assistQueryData: any) => {
    try {
      return await AssistQuery.create(assistQueryData);
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getOne: async (props: any) => {
    try {
      const data = await AssistQuery.findOne(props);
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getPrevThreeUnique: async (props: any) => {
    try {
      const data = await AssistQuery.find(props)
        .sort({ created_at: -1 })
        .select({
          query: 1,
          supporting_info: { location: 1 }
        });

      return findRecentUniqueQueries(data);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};
