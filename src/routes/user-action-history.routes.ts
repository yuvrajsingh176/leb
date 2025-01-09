import express from 'express';
import { HttpCode } from '../constants/global.constants';
import { UserActionHistory } from '../models/user-action-history.model';
import { verifyToken } from '../helpers/tokens.helper';
import mongoose from 'mongoose';
import { logger } from '../logger/winston.config';

export const UserActionsHistoryRouter = express.Router();

// Create a new user action history
UserActionsHistoryRouter.post('/', (async (req, res, next) => {
  try {
    const deviceId = req.headers['device-id'] as string;
    const userId = verifyToken(req);

    if (userId === '' && deviceId === '') {
      next({
        httpCode: HttpCode.UNAUTHORIZED,
        description: 'User is not logged in and device ID is not provided'
      });
    }

    const userActionHistory = new UserActionHistory({
      user_id:
        userId !== '' && userId !== undefined && userId !== null
          ? new mongoose.Types.ObjectId(userId)
          : null,
      device_id: deviceId !== '' && deviceId !== undefined && deviceId !== null ? deviceId : null,
      action_taken: req.body.action_taken,
      additional_info: req.body.additional_info
    });

    await userActionHistory.save();
    res.status(201).send(userActionHistory);
  } catch (error) {
    logger.error('Error creating new source:', error);
    next(error);
  }
}) as express.RequestHandler);
