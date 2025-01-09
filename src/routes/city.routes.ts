import express from 'express';
// import { City } from '../models/city.model';
import { CITIES, HttpCode, SUPPORTED_LOCATIONS_LIST } from '../constants/global.constants';
export const CityRouter = express.Router();

// POST API method
// CityRouter.post('/', (async (req, res, next) => {
//   try {
//     await City.create(req.body);
//     res.status(HttpCode.OK).json({ msg: 'City successfully saved' });
//   } catch (error) {
//     next(error);
//   }
// }) as express.RequestHandler);

// CityRouter.patch('/:id', (async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     await City.findByIdAndUpdate(id, req.body);
//     res.status(HttpCode.OK).json({ msg: 'City successfully updated' });
//   } catch (error) {
//     next(error);
//   }
// }) as express.RequestHandler);

CityRouter.get('/', (async (req, res, next) => {
  try {
    res.status(HttpCode.OK).json(CITIES);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

CityRouter.get('/locations', (async (req, res, next) => {
  try {
    res.status(HttpCode.OK).json(SUPPORTED_LOCATIONS_LIST);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
