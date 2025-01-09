import express from 'express';
import { Interests } from '../models/interests.model';
import { HttpCode } from '../constants/global.constants';
import { logger } from '../logger/winston.config';
import { InterestsController } from '../controllers/interests.controller';
export const InterestRouter = express.Router();

// POST API method
InterestRouter.post('/', (async (req, res, next) => {
  try {
    logger.info('interest / post api requested with body : ', req.body);
    const data = await Interests.create(req.body);
    logger.info('interest / post api requested with body : ', req.body);
    res.status(HttpCode.OK).json(data);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// GET API
InterestRouter.get('/', (async (req, res, next) => {
  try {
    const result = await InterestsController.getAll({});
    res.status(HttpCode.OK).json({ result });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

InterestRouter.get('/interests-lite', (async (req, res, next) => {
  try {
    const result = await InterestsController.getAllLite({});
    res.status(HttpCode.OK).json({ result });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

InterestRouter.get('/moods', (async (req, res, next) => {
  try {
    const interestsList = await Interests.find().lean();
    const moodsMap = new Map();

    interestsList.forEach((i) => {
      i.moods?.forEach((mood) => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (moodsMap.get(mood)) {
          moodsMap.set(mood, [
            ...moodsMap.get(mood),
            { _id: i._id, interest_name: i.interest_name }
          ]);
        } else {
          moodsMap.set(mood, [{ _id: i._id, interest_name: i.interest_name }]);
        }
      });
    });

    res.status(HttpCode.OK).json(Object.fromEntries(moodsMap));
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// GET By Id API
InterestRouter.get('/:id', (async (req, res, next) => {
  try {
    const Id = req.params.id;
    const result = await Interests.findById(Id);
    res.status(HttpCode.OK).json({ result });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

// Update API
InterestRouter.put('/:id', (async (req, res, next) => {
  try {
    const Id = req.params.id;
    const updateInterest = req.body;
    if (Id !== undefined) {
      const result = await Interests.findOneAndUpdate({ _id: Id }, updateInterest, {
        new: true
      });
      res.status(HttpCode.OK).json({
        msg: 'Interest updated successfully',
        interest: result
      });
    }
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
