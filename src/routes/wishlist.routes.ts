import express from 'express';
import { HttpCode } from '../constants/global.constants';
import { WishlistController } from '../controllers/wishlist.controller';
import mongoose from 'mongoose';
import { verifyToken } from '../helpers/tokens.helper';
import { Wishlist } from '../models/wishlist.model';
// import { createPresignedUrlWithClient } from '../services/aws-s3.service';
import { parseUpdate } from '../helpers/update-media.helper';
import { requireAuthenticationToken } from '../middlewares/auth.middleware';
export const WishlistRouter = express.Router();

const constructWishlistData = async (wishlistId: mongoose.Types.ObjectId): Promise<any> => {
  // TODO: No need to get the wishlist data again from DB for each wishlist.
  const populatedWishlist = await WishlistController.get({ _id: wishlistId });

  const parsedWishlist = JSON.parse(JSON.stringify(populatedWishlist));

  parsedWishlist?.places.forEach((place: any) => {
    place.updates.forEach((update: any) => {
      const updateData = JSON.parse(JSON.stringify(update));
      update.update_id = parseUpdate(updateData.update_id);
      // update.update_id.social_media_update_details.media_url =
      //   update.update_id.social_media_update_details.media_url !== '' &&
      //   update.update_id.social_media_update_details.media_url !== null &&
      //   update.update_id.social_media_update_details.media_url !== undefined &&
      //   update.update_id.social_media_update_details.media_url !== false &&
      //   update.update_id.social_media_update_details.media_url !== true
      //     ? createPresignedUrlWithClient(update.update_id.social_media_update_details.media_url)
      //     : null;
      // update.update_id.social_media_update_details.thumbnail_url =
      //   update.update_id.social_media_update_details.thumbnail_url !== '' &&
      //   update.update_id.social_media_update_details.thumbnail_url !== null &&
      //   update.update_id.social_media_update_details.thumbnail_url !== undefined &&
      //   update.update_id.social_media_update_details.thumbnail_url !== false &&
      //   update.update_id.social_media_update_details.thumbnail_url !== true
      //     ? createPresignedUrlWithClient(update.update_id.social_media_update_details.thumbnail_url)
      //     : null;
    });
  });

  return parsedWishlist;
};

const getWishlistsOfAUser = async (userId: string): Promise<any> => {
  return await WishlistController.getAll({
    is_deleted: false,
    $or: [
      {
        owner_id: userId !== '' ? new mongoose.Types.ObjectId(userId) : ''
      },
      {
        'collaborators.user_id': userId !== '' ? new mongoose.Types.ObjectId(userId) : ''
      }
    ]
  });
};

const getAllParsedWishlistsOfUser = async (userId: string): Promise<any> => {
  const wishlists = await getWishlistsOfAUser(userId);

  return await Promise.all([
    ...wishlists.map(async (w: any) => await constructWishlistData(w._id))
  ]);
};

WishlistRouter.post('/', (async (req, res, next) => {
  try {
    const userId = verifyToken(req);
    const { name, update_id: updateId, place_id: placeId } = req.body;

    if (userId === '') {
      return res.status(HttpCode.UNAUTHORIZED).json({ msg: 'User is not logged in' });
    }
    const wishlistData: any = {
      owner_id: new mongoose.Types.ObjectId(userId),
      name
    };

    let updates: any = [];
    if (updateId !== '' && updateId !== undefined && updateId !== null) {
      updates = [
        {
          update_id: new mongoose.Types.ObjectId(updateId),
          added_by: new mongoose.Types.ObjectId(userId as string),
          added_at: new Date()
        }
      ];
    }

    if (placeId !== '' && placeId !== undefined && placeId !== null) {
      wishlistData.places = [
        {
          place_id: new mongoose.Types.ObjectId(placeId),
          updates,
          added_by: new mongoose.Types.ObjectId(userId as string),
          added_at: new Date()
        }
      ];
    }

    const newWishlist = await WishlistController.create(wishlistData);

    const wishlists = await getAllParsedWishlistsOfUser(userId as string);

    res.status(HttpCode.OK).json({ all: wishlists, new: newWishlist });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

WishlistRouter.get('/', (async (req, res, next) => {
  try {
    const userId = verifyToken(req);

    const wishlists = await getAllParsedWishlistsOfUser(userId as string);

    res.status(HttpCode.OK).json(wishlists);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

WishlistRouter.post('/update-lists', (async (req, res, next) => {
  try {
    const userId = verifyToken(req);
    const {
      place_id: placeId = null,
      update_id: updateId = null,
      selected_wishlists: selectedWishlists
    } = req.body;

    const selectedWishlistMap = selectedWishlists.reduce((acc: any, curr: any) => {
      acc[curr] = true;
      return acc;
    }, {});

    // TODO: replace this with the function getWishlistsOfAUser.
    const wishlistsOfUser = await WishlistController.getAll({
      is_deleted: false,
      $or: [
        {
          owner_id: userId !== '' ? new mongoose.Types.ObjectId(userId) : ''
        },
        {
          'collaborators.user_id': userId !== '' ? new mongoose.Types.ObjectId(userId) : ''
        }
      ]
    });
    // await getWishlistsOfAUser(userId as string);

    const updatedDataPromises: any[] = [];

    wishlistsOfUser.map(async (wishlist) => {
      const jsonWishlist = JSON.parse(JSON.stringify(wishlist));

      if (jsonWishlist._id in selectedWishlistMap) {
        // For an wishlist in selected wishlist
        // If the place does not exist, then add the place and update.
        // Else, if the update does not exist, then add the update. else do nothing as place and update already exists.
        if (jsonWishlist.places.filter((item: any) => item.place_id === placeId).length === 0) {
          let updates: any = [];
          if (updateId !== null) {
            updates = [
              {
                update_id: new mongoose.Types.ObjectId(updateId),
                added_by: new mongoose.Types.ObjectId(userId),
                added_at: new Date()
              }
            ];
          }
          updatedDataPromises.push(
            await Wishlist.findOneAndUpdate(
              { _id: new mongoose.Types.ObjectId(jsonWishlist._id) },
              {
                $push: {
                  places: {
                    place_id: new mongoose.Types.ObjectId(placeId),
                    updates,
                    added_by: new mongoose.Types.ObjectId(userId),
                    added_at: new Date()
                  }
                }
              }
            )
          );
        } else {
          if (
            jsonWishlist.places
              .filter((item: any) => item.place_id === placeId)[0]
              .updates.filter((item: any) => item.update_id === updateId).length === 0 &&
            updateId !== null
          ) {
            updatedDataPromises.push(
              await Wishlist.findOneAndUpdate(
                {
                  _id: new mongoose.Types.ObjectId(jsonWishlist._id),
                  'places.place_id': new mongoose.Types.ObjectId(placeId)
                },
                {
                  $push: {
                    'places.$.updates': {
                      update_id: new mongoose.Types.ObjectId(updateId),
                      added_by: new mongoose.Types.ObjectId(userId),
                      added_at: new Date()
                    }
                  }
                }
              )
            );
          }
        }
      } else {
        // For a wishlist not in selected wishlist

        // If the place exists, then if update exists, remove the update, else remove the place.
        // else do nothing as place does not exist.
        if (jsonWishlist.places.filter((item: any) => item.place_id === placeId).length !== 0) {
          if (
            jsonWishlist.places
              .filter((item: any) => item.place_id === placeId)[0]
              .updates.filter((item: any) => item.update_id === updateId).length !== 0
          ) {
            // Update exists in the place, so, remove the update only.
            updatedDataPromises.push(
              await Wishlist.findOneAndUpdate(
                {
                  _id: new mongoose.Types.ObjectId(jsonWishlist._id),
                  'places.place_id': new mongoose.Types.ObjectId(placeId)
                },
                {
                  $pull: {
                    'places.$.updates': {
                      update_id: new mongoose.Types.ObjectId(updateId)
                    }
                  }
                }
              )
            );
          } else {
            // Update doesn't exist in the place, so, remove the place.
            updatedDataPromises.push(
              await Wishlist.findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(jsonWishlist._id) },
                {
                  $pull: {
                    places: {
                      place_id: new mongoose.Types.ObjectId(placeId)
                    }
                  }
                }
              )
            );
          }
        }
      }
    });

    await Promise.all(updatedDataPromises);

    const wishlists = await getAllParsedWishlistsOfUser(userId as string);

    res.status(HttpCode.OK).json(wishlists);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

WishlistRouter.patch('/:id/update', (async (req, res, next) => {
  try {
    const userId = verifyToken(req);
    // Types: "add", "remove"
    const wishlistId = req.params.id;
    const {
      type,
      // update_id: updateId,
      // place_id: placeId,
      collaborator_id: collaboratorId
    } = req.body;

    const result = await Wishlist.findOne({ _id: new mongoose.Types.ObjectId(wishlistId) });

    if (result !== null) {
      if (type === 'remove') {
        // if (updateId !== undefined) {
        //   const index = result.updates.findIndex((item) => item.update_id?.equals(updateId));
        //   if (index !== -1) {
        //     result.updates.splice(index, 1);
        //   }
        // }

        // if (placeId !== undefined) {
        //   const index = result.places.findIndex((item) => item.place_id?.equals(placeId));
        //   if (index !== -1) {
        //     result.places.splice(index, 1);
        //   }
        // }

        if (collaboratorId !== undefined) {
          const index = result.collaborators.findIndex((item) =>
            item.user_id?.equals(collaboratorId)
          );
          if (index !== -1) {
            result.collaborators.splice(index, 1);
          }
        }
      } else if (type === 'add') {
        // if (updateId !== undefined) {
        //   const obj = {
        //     update_id: new mongoose.Types.ObjectId(updateId as string),
        //     added_by: new mongoose.Types.ObjectId(userId as string),
        //     added_at: new Date()
        //   };
        //   result.updates.push(obj);
        // }

        // if (placeId !== undefined) {
        //   const obj = {
        //     place_id: new mongoose.Types.ObjectId(placeId as string),
        //     added_by: new mongoose.Types.ObjectId(userId as string),
        //     added_at: new Date()
        //   };
        //   result.places.push(obj);
        // }

        if (
          collaboratorId !== undefined &&
          result.collaborators.filter((item) => item.user_id?.equals(collaboratorId)).length === 0
        ) {
          const obj = {
            user_id: new mongoose.Types.ObjectId(userId as string),
            added_by: new mongoose.Types.ObjectId(JSON.parse(JSON.stringify(result.owner_id))),
            added_at: new Date()
          };
          result.collaborators.push(obj);
        }
      }
    } else {
      return res.status(HttpCode.BAD_REQUEST).json({ msg: 'No wishlist found' });
    }

    const updatedWishlist = await result.save();

    // const updatedWishlist = await getAllUserWishlists(userId as string);

    res.status(HttpCode.OK).json(await constructWishlistData(updatedWishlist._id));
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

WishlistRouter.get('/:id', (async (req, res, next) => {
  try {
    const wishlistId = req.params.id;

    // const wishlist = await Wishlist.findOne({ _id: new mongoose.Types.ObjectId(wishlistId) });

    res
      .status(HttpCode.OK)
      .json(await constructWishlistData(new mongoose.Types.ObjectId(wishlistId)));
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

WishlistRouter.patch('/:id', (async (req, res, next) => {
  try {
    const wishlistId = req.params.id;
    const userId = verifyToken(req);

    const { name } = req.body;

    if (name === undefined) {
      return res.status(HttpCode.BAD_REQUEST).json({ message: 'Name is required' });
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(wishlistId) },
      { name },
      { new: true }
    );

    if (wishlist === null) {
      return res.status(HttpCode.NOT_FOUND).json({ message: 'Wishlist not found' });
    }

    const wishlists = await getAllParsedWishlistsOfUser(userId as string);

    res.status(HttpCode.OK).json(wishlists);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

WishlistRouter.delete('/:wishlist_id', requireAuthenticationToken, (async (req, res, next) => {
  try {
    const wishlistId = req.params.wishlist_id;
    const userId = req.user?.id;

    const wishlist = await Wishlist.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(wishlistId)
      },
      { is_deleted: true },
      { new: true }
    );

    if (wishlist === null) {
      return res.status(HttpCode.NOT_FOUND).json({ message: 'Wishlist not found' });
    }

    const wishlists = await getAllParsedWishlistsOfUser(userId);

    res.status(HttpCode.OK).json(wishlists);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
