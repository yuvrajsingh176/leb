import express from 'express';
import { HttpCode } from '../constants/global.constants';
import { AppVersionModel } from '../models/app-version.model';
export const AppVersionRouter = express.Router();

// POST API method
AppVersionRouter.post('/', (async (req, res, next) => {
  try {
    await AppVersionModel.create(req.body);
    res.status(HttpCode.OK).json({ msg: 'App Version entry created successfully' });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// GET API method
AppVersionRouter.get('/', (async (req, res, next) => {
  try {
    const appVersionObj = await AppVersionModel.findOne(
      { app_name_slug: 'aroundly' },
      { _id: 0, __v: 0, created_at: 0, modified_at: 0 }
    );

    res.status(HttpCode.OK).json(appVersionObj);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
