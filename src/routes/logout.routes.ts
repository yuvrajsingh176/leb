import express from 'express';
import { CONSTANTS, HttpCode } from '../constants/global.constants';

export const LogoutRouter = express.Router();
LogoutRouter.get('/', (async (req, res: express.Response) => {
  res.cookie('access_token', '', {
    httpOnly: CONSTANTS.isNotDev,
    secure: CONSTANTS.isNotDev,
    maxAge: -1,
    path: '/',
    sameSite: 'strict'
  });
  return res.status(HttpCode.OK).json({ msg: 'Logged out' });
}) as express.RequestHandler);
