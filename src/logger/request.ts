import type { Request } from 'express';
import { logger } from './winston.config';
import { HttpCode } from '../constants/global.constants';

export const RequestResponseLog = (
  req: Request,
  res: { status: number; msg?: string; error?: any; data?: any },
  file: string
): void => {
  if (res.status !== HttpCode.OK) {
    logger.error({
      message: 'Api call error',
      request: { url: req.url, body: req.body },
      file,
      response: {
        message: res.msg,
        statusCode: res.status,
        error: res.error
      }
    });
    return;
  }
  logger.info({
    message: 'Api call success',
    file,
    request: { url: req.url, body: req.body },
    response: {
      data: res.data,
      message: res.msg,
      statusCode: res.status
    }
  });
};
