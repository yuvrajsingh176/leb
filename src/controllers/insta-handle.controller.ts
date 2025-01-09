import { InstaHandle } from '../models/insta-handle.model';

export const InstaHandleController = {
  findAndUpdate: async (props: any, update: any) => {
    try {
      const data = await InstaHandle.findOneAndUpdate(props, update, {
        new: true
      });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  create: async (handlesData: any) => {
    try {
      return await InstaHandle.create(handlesData);
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  get: async (props: any) => {
    try {
      const data = await InstaHandle.findOne(props);
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getAll: async (props: any) => {
    try {
      const data = await InstaHandle.find(props).sort({ order: 1 });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};
