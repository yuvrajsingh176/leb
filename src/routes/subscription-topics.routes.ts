import express from 'express';
import { Subscriptions } from '../models/subscription-topics.model';
import { HttpCode } from '../constants/global.constants';
export const SubscriptionTopicsRouter = express.Router();

SubscriptionTopicsRouter.post('/', (async (req, res, next) => {
  try {
    const result = await Subscriptions.create(req.body);
    return res.status(HttpCode.OK).json({ msg: 'Data successfully saved', result });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

SubscriptionTopicsRouter.get('/', (async (req, res, next) => {
  try {
    const result = await Subscriptions.find();
    return res.status(HttpCode.OK).json({ result });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

SubscriptionTopicsRouter.put('/:id', (async (req, res, next) => {
  try {
    const Id = req.params.id;
    const updateTopic = req.body;
    const result = await Subscriptions.findOneAndUpdate({ _id: Id }, updateTopic, {
      new: true
    });
    res.status(HttpCode.OK).json({
      msg: 'Data updated successfully',
      result
    });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
