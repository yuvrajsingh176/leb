import express from 'express';
import { requireAuthenticationToken } from '../middlewares/auth.middleware';
import { FavoriteServices } from '../controllers/favorites.controller';
import { HttpCode } from '../constants/global.constants';
import { logger } from '../logger/winston.config';
import type { SocialMediaUpdate } from '../types/global.types';
import { SocialMediaUpdates } from '../models/social-media-updates.model';
// import mixpanel from '../services/mixpanel.service';
export const FavoriteRouter = express.Router();

FavoriteRouter.post('/', requireAuthenticationToken, (async (req, res, next) => {
  try {
    const { update_id: updateId } = req.body;
    const userId = req.user?.id;
    logger.info('favourites post api / requested by user: ', userId, ' and with body ', req.body);
    const update = await SocialMediaUpdates.findOne({ _id: updateId });
    if (update === null) {
      logger.info(
        'favourites post api / responed with bad request for user: ',
        userId,
        ' as there was no update with the requested id: ',
        updateId
      );
      next({ httpCode: HttpCode.BAD_REQUEST, description: 'Updates not found' });
      return;
    }
    const isExist = await FavoriteServices.get({
      update_id: updateId,
      user_id: userId,
      status: true
    });
    if (isExist !== null) {
      const updatedData = await FavoriteServices.update(
        { update_id: updateId, user_id: userId },
        { status: false }
      );
      logger.info(
        'favourites post api / returned ok for user: ',
        userId,
        ' and with updated data: ',
        updatedData
      );
      // mixpanel.track('Post Unsaved', { distinct_id: userId, updateId });
      return res
        .status(HttpCode.OK)
        .json({ msg: 'Removed from favorite', result: updatedData, status: false });
    }
    const updatedData = await FavoriteServices.update(
      { update_id: updateId, user_id: userId },
      { status: true }
    );
    logger.info(
      'favourites post api / returned ok for user: ',
      userId,
      ' and with updated data: ',
      updatedData
    );
    // mixpanel.track('Post Saved', { distinct_id: userId, updateId });
    return res
      .status(HttpCode.OK)
      .json({ msg: 'Added to favorite', result: updatedData, status: true });
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);

FavoriteRouter.get('/', requireAuthenticationToken, (async (req, res, next) => {
  const userId = req.user?.id;
  logger.info('favourites get api / requested by user: ', userId, ', with body ', req.body);
  try {
    const result = await FavoriteServices.getFeedData(userId);
    logger.info('favourites get api / responded to user: ', userId, ', with data ', result);
    return res.status(HttpCode.OK).json({ msg: 'Success', result });
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);

FavoriteRouter.get('/expiring/:id', (async (req, res, next) => {
  const userId = req.params?.id;
  logger.info('favourites get api /expiring requested with body ', req.body);
  try {
    const result = await FavoriteServices.getExpiringSavedUpdates(userId);
    const arr: SocialMediaUpdate[] = [];
    result.forEach((item) => {
      if (item.update_id !== undefined) {
        arr.push(item.update_id);
      }
    });
    logger.info('favourites get api /expiring responded with data ', arr);
    return res.status(HttpCode.OK).json(arr);
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);
