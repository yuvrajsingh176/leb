import express from 'express';
import { AroundlyPlacesController } from '../controllers/aroundly-place.controller';
import { logger } from '../logger/winston.config';
import mongoose from 'mongoose';

export const AroundlyPlacesRouter = express.Router();

AroundlyPlacesRouter.get('/', (async (req, res, next) => {
  try {
    const data = await AroundlyPlacesController.getAll(0, 0, {});
    logger.info('aroundly-places get api / ressponsed with data : ', data);
    return res.status(200).json(data);
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);

// TODO: Add a admin user permission check.
AroundlyPlacesRouter.post('/', (async (req, res, next) => {
  try {
    const body = req.body;
    const placeId = body.place_id;
    logger.info(
      'aroundly-places post api / requested with body: ',
      body,
      ' and placeId: ',
      placeId
    );

    // Checks whether a place already exists with the given place_id
    const existingPlace = await AroundlyPlacesController.get({ place_id: placeId });
    if (existingPlace !== null) {
      logger.info(
        'aroundly-places post api / responed with 200 as a place already existed with data : ',
        existingPlace
      );
      return res.status(200).json(existingPlace);
    }

    // Place doesn't exist, so create a new one
    const data = await AroundlyPlacesController.create(body);
    logger.info('aroundly-places post api / responded with created data: ', data);
    return res.status(200).json(data);
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);

AroundlyPlacesRouter.get('/:id', (async (req, res, next) => {
  try {
    const aroundlyPlaceId = req.params.id;
    const data = await AroundlyPlacesController.get({
      _id: new mongoose.Types.ObjectId(aroundlyPlaceId)
    });
    logger.info('aroundly-places get api / ressponsed with data : ', data);
    return res.status(200).json(data);
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);
