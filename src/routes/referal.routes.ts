import express from 'express';
import { requireAuthenticationToken } from '../middlewares/auth.middleware';
import { UserData } from '../models/user-data.model';
import { Referals } from '../models/referal.model';
import mongoose from 'mongoose';
import { HttpCode } from '../constants/global.constants';
import { logger } from '../logger/winston.config';

export const ReferalRouter = express.Router();

ReferalRouter.post('/', requireAuthenticationToken, (async (req, res, next) => {
  const { referal_id: referalId } = req.body;
  const id = req.user.id;
  logger.info('referal post api / requested by user: ', id, ' with body: ', req.body);
  try {
    if (referalId === null || referalId === undefined || referalId.length === 0) {
      next({ httpCode: HttpCode.BAD_REQUEST, description: 'Referal id is missing' });
      logger.info(
        'referal post api / responed with 400 for user: ',
        id,
        ' because referalId was null | undefined | length == 0: ',
        referalId
      );
      return;
    }
    const referrerData = await UserData.findOne({ referalId });
    if (referrerData === null || referrerData === undefined) {
      next({ httpCode: HttpCode.BAD_REQUEST, description: 'Invalid referal id' });
      logger.info(
        'referal post api / responed with 400 for user: ',
        id,
        ' because referalId data was null | undefined',
        referalId
      );
      return;
    }
    if (referrerData._id.toString() === id) {
      next({ httpCode: HttpCode.BAD_REQUEST, description: "User can't refer himself" });
      logger.info(
        'referal post api / responed with 400 for user: ',
        id,
        ' because user was trying to refer himself 😒, referrerData: ',
        referrerData
      );
      return;
    }
    const result = await Referals.create({
      refered_to: new mongoose.Types.ObjectId(id),
      referer: referrerData._id
    });
    logger.info(
      'referal post api / responed with 200 for user: ',
      id,
      ' with document created ',
      result
    );
    return res.status(HttpCode.OK).json({ msg: 'Referal successfully done', result });
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);

ReferalRouter.post('/:id', (async (req, res, next) => {
  const id = req.params.id;
  logger.info('referal post api /:id requested with body: ', req.body);
  try {
    const referrerData = await UserData.findOneAndUpdate(
      { referal_id: id },
      {
        $inc: {
          referrals: 1
        }
      },
      { new: true }
    );
    logger.info('referal post api /:id responed 200 with data: ', referrerData);
    return res.status(HttpCode.OK).json({ msg: 'Referal successfully done', referrerData });
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);
