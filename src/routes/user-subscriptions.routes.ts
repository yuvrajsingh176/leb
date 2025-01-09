import express from 'express';
import { requireAuthenticationToken } from '../middlewares/auth.middleware';
import { UserSubscriptions } from '../models/user-subscriptions.model';
import mongoose from 'mongoose';
import { HttpCode } from '../constants/global.constants';
import { logger } from '../logger/winston.config';
import { UserData } from '../models/user-data.model';
export const UserSubscriptionRouter = express.Router();

UserSubscriptionRouter.post('/', requireAuthenticationToken, (async (req, res, next) => {
  const _id = req.user?.id;
  logger.info('user-subscription post api / requested by user: ', _id, ' with body: ', req.body);
  try {
    const { topic_id: topicId, interests, city } = req.body;
    const user = new mongoose.Types.ObjectId(_id);
    const result = await UserSubscriptions.create({
      user_id: user,
      city,
      topic_id: new mongoose.Types.ObjectId(topicId),
      status: 'interested',
      created_by: user,
      modified_by: user,
      interests: interests.map((item: string) => new mongoose.Types.ObjectId(item))
    });
    logger.info(
      'user-subscription post api / responed with 200 for user: ',
      _id,
      ' with document created ',
      result
    );
    res.status(HttpCode.OK).json({ msg: 'Data successfully saved', result });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

UserSubscriptionRouter.patch('/:id', requireAuthenticationToken, (async (req, res, next) => {
  const _id = req.user?.id;
  const subscriptionId = req.params.id;
  logger.info('user-subscription patch api / requested by user: ', _id, ' with body: ', req.body);
  try {
    const { interests, city } = req.body;

    const user = new mongoose.Types.ObjectId(_id);

    const result = await UserSubscriptions.findByIdAndUpdate(
      subscriptionId,
      {
        city,
        modified_by: user,
        interests: interests.map((item: string) => new mongoose.Types.ObjectId(item))
      },
      { new: true }
    );
    logger.info(
      'user-subscription patch api / responed with 200 for user: ',
      _id,
      ' with document updated ',
      result
    );
    res.status(HttpCode.OK).json({ msg: 'Data successfully saved', result });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

UserSubscriptionRouter.get('/:topic_id', requireAuthenticationToken, (async (req, res, next) => {
  const userId = req.user?.id;
  const topicId = req.params.topic_id;
  logger.info(
    'user-subscription get api /:topic-id requested by user: ',
    userId,
    ' with topic id : ',
    topicId
  );
  try {
    const data = await UserSubscriptions.findOne({ topic_id: topicId, user_id: userId });
    if (data !== null && data !== undefined) {
      logger.info(
        'user-subscription get api /:topic-id responed with 200 for user: ',
        userId,
        ' with data ',
        data
      );
      return res.status(HttpCode.OK).json({ msg: 'Success', result: data });
    } else {
      logger.info(
        'user-subscription get api /:topic-id responed with 404 for user: ',
        userId,
        ' because there was no document for topicId: ',
        topicId
      );
      next({ httpCode: HttpCode.NOT_FOUND, description: 'Data not found' });
    }
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

UserSubscriptionRouter.get('/whatsapp-update/:user_id', (async (req, res, next) => {
  const userId = req.params?.user_id;
  logger.info('user-subscription get api /:topic-id requested: ', userId);
  try {
    const data = await UserData.findOne({
      _id: new mongoose.Types.ObjectId(userId)
    });
    if (data !== null && data !== undefined) {
      logger.info('user-subscription get api /:topic-id responed with 200');
      return res.status(HttpCode.OK).json(data);
    } else {
      logger.info('user-subscription get api /:topic-id responed with 404');
      next({ httpCode: HttpCode.NOT_FOUND, description: 'Data not found' });
    }
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
