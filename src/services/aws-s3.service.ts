import AWS from 'aws-sdk';
import axios from 'axios';
import stream from 'stream';
import type { S3ContentType } from '../types/global.types';
import type { Response } from 'express';
import { HttpCode } from '../constants/global.constants';
import { logger } from '../logger/winston.config';

import dotenv from 'dotenv';
dotenv.config();

// const IS_PRODUCTION = process.env.SERVER_ENVIRONMENT === 'production';

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRECT_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

export async function getAnduploadToS3(
  url: string,
  contentType: S3ContentType,
  fileName: string
): Promise<string> {
  try {
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream'
    });

    const pass = new stream.PassThrough();

    // Start uploading the stream to S3
    const upload = s3.upload({
      Bucket: S3_BUCKET_NAME,
      Key: fileName,
      Body: pass,
      ContentType: contentType
    });

    response.data.pipe(pass);

    const result = await upload.promise();
    return result.Key;
  } catch (error) {
    console.error('Error uploading file', error);
  }

  return '';
}

export async function uploadToS3(file: any, fileName: string): Promise<string> {
  const upload = s3.upload({
    Bucket: S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype
  });

  const result = await upload.promise();
  return result.Key;
}

const SECONDS = 60;
const MINUTES = 60;
const HOURS = 24;
const DAYS = 1;

export function getPresignedUrl(
  response: Response,
  key: string | boolean,
  expiry = DAYS * HOURS * MINUTES * SECONDS
): void {
  if (key === false) {
    response.status(HttpCode.OK).json({ url: '' });
    return;
  }
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Expires: expiry // Expiry time in seconds
  };

  s3.getSignedUrl('getObject', params, function (err, url) {
    if (err !== null && err !== undefined) {
      console.log('Error', err);
      logger.info(
        'upload post api /get-presigned-url got an error while trying to get preSignedUrl for params: ',
        params
      );
      response.status(HttpCode.INTERNAL_SERVER_ERROR).json({ msg: 'Server error' });
    } else {
      logger.info('upload post api /get-presigned-url responed 200 with url: ', url);
      response.status(HttpCode.OK).json({ url });
    }
  });
}

export async function getPresignedUrlViaPromise(
  key: string | boolean,
  expiry = DAYS * HOURS * MINUTES * SECONDS
): Promise<string | undefined> {
  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Expires: expiry // Expiry time in seconds
  };

  // eslint-disable-next-line @typescript-eslint/return-await
  return new Promise((resolve, reject) => {
    s3.getSignedUrl('getObject', params, function (err, url) {
      if (err !== null && err !== undefined) {
        console.log('Error', err);
        reject(new Error('Server error'));
      } else {
        resolve(url);
      }
    });
  });
}

export const createPresignedUrlWithClient = (key: string): string => {
  return s3.getSignedUrl('getObject', {
    Expires: DAYS * HOURS * MINUTES * SECONDS,
    Bucket: S3_BUCKET_NAME,
    Key: key
  });
};
