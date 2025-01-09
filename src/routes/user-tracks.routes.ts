import express from 'express';
import { requireAuthenticationToken } from '../middlewares/auth.middleware';
import { UserTracks } from '../models/user-tracks.model';
import mongoose from 'mongoose';
import { HttpCode } from '../constants/global.constants';
export const UserTrackRouter = express.Router();

UserTrackRouter.post('/', requireAuthenticationToken, (async (req, res, next) => {
  const userId = req.user?.id;
  const { id, action }: { id: string; action: string } = req.body;
  const supportedActions = ['share', 'search'];
  if (!supportedActions.includes(action)) {
    next({
      httpCode: HttpCode.BAD_REQUEST,
      description: "Invalid action, supported actions 'seacrh' & 'share'"
    });
    return;
  }
  try {
    let result;
    if (action === 'share') {
      result = await UserTracks.findOneAndUpdate(
        { user_id: userId },
        {
          $push: {
            shares: {
              update_id: id,
              created_at: new Date(),
              id: new mongoose.Types.ObjectId()
            }
          }
        },
        { new: true, upsert: true }
      );
    }
    if (action === 'search') {
      result = await UserTracks.findOneAndUpdate(
        { user_id: userId },
        {
          $push: {
            shares: {
              search_id: id,
              created_at: new Date()
            }
          }
        },
        { new: true, upsert: true }
      );
    }
    return res.status(HttpCode.OK).json({ msg: 'successfull', result });
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);
