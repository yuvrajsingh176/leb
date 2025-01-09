import { Wishlist } from '../models/wishlist.model';

export const WishlistController = {
  get: async (props: any) => {
    try {
      const data = await Wishlist.findOne(props)
        .populate('owner_id', { _id: 1, name: 1 })
        .populate('collaborators.user_id', { _id: 1, name: 1 })
        .populate('places.place_id')
        .populate('places.updates.update_id')
        .populate('places.added_by', { _id: 1, name: 1 });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  getAll: async (props: any) => {
    try {
      const data = await Wishlist.find(props).sort({ created_at: -1 });
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  create: async (wishlistData: any) => {
    try {
      return await Wishlist.create(wishlistData);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};
