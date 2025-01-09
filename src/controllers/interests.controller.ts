import { Interests } from '../models/interests.model';

export const InterestsController = {
  get: async (props: any) => {
    try {
      const data = await Interests.findOne(props);
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getAll: async (props: any) => {
    try {
      const data = await Interests.find(props).sort({ order: 1 });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getAllLite: async (props: any) => {
    try {
      const data = await Interests.find(props)
        .select({ _id: 1, interest_name: 1, display_name: 1, order: 1 })
        .sort({ order: 1 });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};
