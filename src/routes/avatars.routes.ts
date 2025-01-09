import express from 'express';
import { Avatars } from '../models/avatars.model';
import { HttpCode } from '../constants/global.constants';
export const AvatarRouter = express.Router();

// POST API method
AvatarRouter.post('/', (async (req, res, next) => {
  try {
    await Avatars.create(req.body);
    res.status(HttpCode.OK).json({ msg: 'City successfully saved' });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// GET API method
AvatarRouter.get('/', (async (req, res, next) => {
  try {
    const allAvatars = await Avatars.find({});
    res.status(HttpCode.OK).json({ result: allAvatars });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
