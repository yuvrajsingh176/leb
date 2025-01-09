import express from 'express';
import { HttpCode } from '../constants/global.constants';
import { requireAuthenticationToken } from '../middlewares/auth.middleware';
import { RegisterNotificationsModel } from '../models/register-notifications.model';
import mongoose from 'mongoose';

export const RegisterNotificationsRouter = express.Router();

RegisterNotificationsRouter.get('/:device_id', requireAuthenticationToken, (async (
  req,
  res: express.Response
) => {
  // For the given userId and deviceId, get the registered notification document from the database
  // and return it in the response

  const registerNotification = await RegisterNotificationsModel.findOne({
    device_id: req.params.device_id,
    user_id: new mongoose.Types.ObjectId(req.user.id)
  });

  return res.status(HttpCode.OK).json(registerNotification);
}) as express.RequestHandler);

RegisterNotificationsRouter.post('/', requireAuthenticationToken, (async (
  req,
  res: express.Response
) => {
  // Create a new register notification document in the database and return it in the response
  try {
    const registerNotification = await RegisterNotificationsModel.findOneAndUpdate(
      { user_id: new mongoose.Types.ObjectId(req.user.id), device_id: req.body.device_id },
      {
        ...req.body,
        user_id: new mongoose.Types.ObjectId(req.user.id)
      },
      { upsert: true, new: true }
    );

    return res.status(HttpCode.OK).json(registerNotification);
  } catch (error) {
    return res.status(HttpCode.BAD_REQUEST).json(error);
  }
}) as express.RequestHandler);

RegisterNotificationsRouter.patch('/:notificationId', requireAuthenticationToken, (async (
  req,
  res: express.Response
) => {
  // Update the register notification document in the database and return it in the response
  try {
    const registerNotification = await RegisterNotificationsModel.findByIdAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.notificationId)
      },
      {
        ...req.body
      }
    );

    return res.status(HttpCode.OK).json(registerNotification);
  } catch (error) {
    return res.status(HttpCode.BAD_REQUEST).json(error);
  }
}) as express.RequestHandler);
