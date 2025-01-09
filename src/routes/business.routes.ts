import express from 'express';
import { BusinessController } from '../controllers/business.controller';
import { logger } from '../logger/winston.config';
import mongoose from 'mongoose';
import { AroundlyPlacesController } from '../controllers/aroundly-place.controller';

export const BusinessRouter = express.Router();

BusinessRouter.get('/', (async (req, res, next) => {
  try {
    logger.info('business get api / requested ');
    const { skip, limit, searchText } = req.query;
    let data;

    let props: any = {};

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (searchText) {
      props = {
        name: { $regex: searchText as string, $options: 'i' }
      };
    }

    if (skip !== undefined && limit !== undefined) {
      data = await AroundlyPlacesController.getAll(
        parseInt(skip as string),
        parseInt(limit as string),
        props
      );
    } else {
      data = await AroundlyPlacesController.getAll(0, 0, props);
    }
    logger.info('business get api / responded with response : ', data);
    return res.status(200).json(data);
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);

BusinessRouter.get('/count', (async (req, res, next) => {
  try {
    const { searchText } = req.query;

    let props: any = {};

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (searchText) {
      props = {
        name: { $regex: searchText as string, $options: 'i' }
      };
    }

    logger.info('business get api / requested ');
    const count = await BusinessController.count(props);
    logger.info(`Count of businesses ${count}`);
    return res.status(200).json({ total: count });
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);

BusinessRouter.get('/:aroundlyPlaceId', (async (req, res, next) => {
  try {
    const aroundlyPlaceId = req.params.aroundlyPlaceId;
    logger.info(`business get api / requested for id: ${aroundlyPlaceId}`);
    const data = await BusinessController.get({
      locations: { $in: [new mongoose.Types.ObjectId(aroundlyPlaceId)] }
    });
    logger.info('business get api / responded with response : ', data);
    return res.status(200).json(data);
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);

BusinessRouter.post('/around', (async (req, res, next) => {
  try {
    const { latitude, longitude, radius } = req.body;
    logger.info(`fetching business around ${radius} from Lat: ${latitude}, Long: ${longitude}`);
    const data = await BusinessController.getBusinessesAround(latitude, longitude, radius);
    logger.info('business get api / responded with response : ', data);
    return res.status(200).json(data);
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);

BusinessRouter.post('/', (async (req, res, next) => {
  try {
    const body = req.body;
    logger.info('business post api / requested with body: ', body);
    const existingBusiness = await BusinessController.get({
      name: body.name,
      locations: { $in: body.locations }
    });

    if (existingBusiness !== null) {
      logger.info(
        `Business post api / responed with 200 as a business already existed with data : ${existingBusiness._id.toJSON()} ${
          existingBusiness.name
        }`
      );
      return res.status(200).json(existingBusiness);
    }

    const data = await BusinessController.create(body);
    logger.info('business post api / responded with created document: ', data);
    return res.status(200).json(data);
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);

BusinessRouter.patch('/:id', (async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = req.body;
    logger.info('business patch api /:id requested with id: ', id, ' and body: ', body);
    const data = await BusinessController.update(id, body);
    logger.info('business patch api /:id responded with updated document: ', data);
    return res.status(200).json(data);
  } catch (e) {
    next(e);
  }
}) as express.RequestHandler);
