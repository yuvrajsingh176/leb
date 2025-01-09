import express from 'express';
import { HttpCode } from '../constants/global.constants';
import { logger } from '../logger/winston.config';
import { InstaHandleController } from '../controllers/insta-handle.controller';
export const InstaHandleRouter = express.Router();

// POST API method
InstaHandleRouter.post('/', (async (req, res, next) => {
  try {
    logger.info('instahandle / post api requested with body : ', req.body);
    const data = await InstaHandleController.create(req.body);
    logger.info('instahandle db saved: ', data);
    res.status(HttpCode.OK).json(data);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// GET API
InstaHandleRouter.get('/', (async (req, res, next) => {
  try {
    const result = await InstaHandleController.getAll({});
    res.status(HttpCode.OK).json(result);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// GET By Id API
InstaHandleRouter.get('/:id', (async (req, res, next) => {
  try {
    const Id = req.params.id;
    const result = await InstaHandleController.get({ _id: Id });
    res.status(HttpCode.OK).json(result);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Update API
// InstaHandleRouter.patch('/:id', (async (req, res, next) => {
//   try {
//     const Id = req.params.id;
//     const updatedInstaHandle = req.body;
//     if (Id !== undefined) {
//       const result = await InstaHandleController.update(Id, updatedInstaHandle);
//       res.status(HttpCode.OK).json(result);
//     }
//   } catch (error) {
//     next(error);
//   }
// }) as express.RequestHandler);
