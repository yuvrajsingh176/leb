import express from 'express';
import type { Response } from 'express';
import { HttpCode } from '../constants/global.constants';
import { getPresignedUrl } from '../services/aws-s3.service';
import { logger } from '../logger/winston.config';

export const UploadRouter = express.Router();

UploadRouter.post('/get-presigned-url', (async (req: any, res: Response, next) => {
  try {
    const { file_key: fileKey } = req.body;
    logger.info('upload post api /get-presigned-url requested with body: ', req.body);
    if (fileKey === undefined || fileKey === null) {
      logger.info(
        'upload post api /get-presigned-url responed 400 because filekey was undefined | null: ',
        fileKey
      );
      next({ httpCode: HttpCode.BAD_REQUEST, description: 'File Key is missing' });
      return;
    }

    getPresignedUrl(res, fileKey);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
