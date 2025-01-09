import express from 'express';
import { City } from '../models/city.model';
import { HttpCode } from '../constants/global.constants';
import { Crons } from '../models/crons.model';
import { CRON_MAP } from '../cron';
export const CronRouter = express.Router();

// POST API method
CronRouter.post('/', (async (req, res, next) => {
  try {
    await Crons.create(req.body);
    res.status(HttpCode.OK).json({ msg: 'Cron successfully saved' });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

CronRouter.patch('/:id', (async (req, res, next) => {
  try {
    const id = req.params.id;
    const cron = await Crons.findByIdAndUpdate(id, req.body);
    res.status(HttpCode.OK).json(cron);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

CronRouter.patch('/stop/:id', (async (req, res, next) => {
  try {
    const id = req.params.id;
    const cronJob = CRON_MAP.get(id);
    if (cronJob !== undefined && cronJob !== null) {
      cronJob?.stop();
      const cron = await Crons.findByIdAndUpdate(
        id,
        {
          active: false,
          lastStoppedByAPIAt: new Date(),
          lastStoppingReason: 'MANUAL_STOP'
        },
        { new: true }
      );
      res.status(HttpCode.OK).json({ msg: 'Cron stopped successfully', result: cron });
    } else {
      next({ httpCode: HttpCode.BAD_REQUEST, description: 'No cron scheduled with this id' });
    }
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

CronRouter.patch('/start/:id', (async (req, res, next) => {
  try {
    const id = req.params.id;
    const cronJob = CRON_MAP.get(id);
    if (cronJob !== undefined && cronJob !== null) {
      cronJob?.start();
      const cron = await Crons.findByIdAndUpdate(
        id,
        {
          active: true,
          lastStartedByAPIAt: new Date()
        },
        { new: true }
      );
      res.status(HttpCode.OK).json({ msg: 'Cron started successfully', result: cron });
    } else {
      next({ httpCode: HttpCode.BAD_REQUEST, description: 'No cron scheduled with this id' });
    }
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

CronRouter.get('/', (async (req, res, next) => {
  try {
    const Crons = await City.find({});
    res.status(HttpCode.OK).json(Crons);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
