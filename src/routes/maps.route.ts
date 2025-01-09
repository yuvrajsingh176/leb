import express from 'express';
import axios from 'axios';
import { HttpCode } from '../constants/global.constants';
import { logger } from '../logger/winston.config';

export const MapsRouter = express.Router();

MapsRouter.get('/auto-complete', (async (req, res, next) => {
  try {
    const { q, session } = req.query;
    logger.info(
      'maps get api /auto-complete requested with query and session: ',
      q,
      ' & ',
      session
    );
    if (q === null) {
      next({ httpCode: HttpCode.BAD_REQUEST, description: 'Query is missing' });
      logger.info('maps get api /auto-complete responed with 400 as query was null: ', q);
      return;
    }
    const { data } = await axios.post(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${
        q as string
      }&types=establishment&key=${process.env.MAPS_API_KEY}&sessiontoken=${session as string}`
    );
    logger.info('maps get api /auto-complete responed with 200 with data: ', data.predictions);
    return res.status(200).json(data.predictions);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

MapsRouter.get('/place-detail', (async (req, res, next) => {
  try {
    const { id, session } = req.query;
    logger.info(
      'maps get api /place-detail requested with place_id and session: ',
      id,
      ' & ',
      session
    );
    const { data } = await axios.post(
      `https://maps.googleapis.com/maps/api/place/details/json?fields=name,rating,opening_hours,geometry,icon,formatted_address,vicinity,types,formatted_phone_number,photo,reviews,price_level,address_components&place_id=${
        id as string
      }&key=${process.env.MAPS_API_KEY}&sessiontoken=${session as string}`
    );
    if (data.status === 'OK') {
      logger.info('maps get api /place-detail responed with 200 with data: ', data.result);
      return res.status(200).json(data.result);
    } else {
      logger.info(
        'maps get api /place-detail responed with 400 because of a error from google side, data: ',
        data
      );
      return res.status(400).json(data);
    }
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
