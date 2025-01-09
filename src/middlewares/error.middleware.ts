import type { NextFunction, Request, Response } from 'express';
import { RequestResponseLog } from '../logger/request';
import type { HttpCode } from '../constants/global.constants';
interface ErrorProps extends Error {
  httpCode: HttpCode;
  description: any;
}
export const errorHandler = (
  err: ErrorProps,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errStatus = err.httpCode ?? 500;
  const errMsg = err.description ?? 'Something went wrong';
  RequestResponseLog(
    req,
    {
      status: errStatus,
      msg: errMsg,
      data: null
    },
    ''
  );
  console.log(err);
  res.status(errStatus).json({
    success: false,
    status: errStatus,
    message: errMsg,
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
};
