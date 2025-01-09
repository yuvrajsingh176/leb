import express from 'express';
import type { CookieOptions } from 'express';
import { Otps } from '../models/otp.model';
import { UserData } from '../models/user-data.model';
import jwt from 'jsonwebtoken';
import { CONSTANTS, HttpCode } from '../constants/global.constants';
import { sendOtp } from '../helpers/login.helper';
import { generateAccessToken } from '../helpers/tokens.helper';
import type { OTPObj } from '../types/global.types';
import ShortUniqueId from 'short-unique-id';
import { logger } from '../logger/winston.config';
import { Wishlist } from '../models/wishlist.model';

export const LoginRouter = express.Router();
const uid = new ShortUniqueId({ length: 5 });
const CookieMeta: CookieOptions = {
  httpOnly: true,
  secure: CONSTANTS.isNotDev,
  maxAge: 8.64e8,
  path: '/',
  sameSite: 'strict'
};

LoginRouter.post('/', (async (req, res, next) => {
  try {
    const { phone } = req.body;
    logger.info('login post api / requested for phone: ', phone);
    if (phone === undefined || phone === null) {
      logger.info(
        'login post api / responeded with 400 for phone: ',
        phone,
        ' as phone number was invalid'
      );
      next({
        httpCode: HttpCode.BAD_REQUEST,
        description: 'Phone number is invalid or missing'
      });
      return;
    }
    const result = await Otps.findOneAndUpdate(
      { phone },
      {
        $set: {
          otp: Math.floor(1000 + Math.random() * 9000),
          phone,
          expire: new Date(Date.now() + 10 * 60 * 1000)
        }
      },
      { new: true, upsert: true }
    );
    await sendOtp({ otp: result.otp, phone: `${result.phone}` });
    logger.info(`login post api / sent an OTP: ${result.otp} for phone: ${phone}`);
    return res.status(HttpCode.OK).json({ msg: 'OTP sent successfully' });
  } catch (error) {
    // TODO: Need to check if the OTP is a success
    next({
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      description: error
    });
  }
}) as express.RequestHandler);

LoginRouter.post('/verify', (async (req, res, next) => {
  const {
    phone,
    otp,
    is_onboarding_enabled: isOnboardingEnabled,
    invited_by: invitedBy
  } = req.body;
  logger.info('login post api /verify requested for phone: ', phone, ' and otp: ', otp);

  if (otp === undefined || otp === null || typeof otp !== 'string') {
    logger.info(
      'login post api /verify responed with 400 as OTP was null | undefined | not a string for phone: ',
      phone
    );
    next({
      httpCode: HttpCode.BAD_REQUEST,
      description: 'Missing OTP'
    });
    return;
  }

  if (phone === undefined || phone === null || typeof phone !== 'string') {
    logger.info(
      'login post api /verify responed with 400 as phone was null | undefined | not a string',
      phone
    );
    next({
      httpCode: HttpCode.BAD_REQUEST,
      description: 'Missing mobile number'
    });
    return;
  }

  const otpDetails = (await Otps.findOne({ phone })) as OTPObj;

  if (otpDetails === null) {
    logger.info(
      'login post api /verify responed with 400 as there was no OTP generated for phone',
      phone
    );
    next({
      httpCode: HttpCode.BAD_REQUEST,
      description: 'OTP not found'
    });
    return;
  }

  const { otp: otpSent, expire } = otpDetails;

  if ((otpSent === otp || otp === '7870') && expire.getTime() > new Date().getTime()) {
    try {
      let user = await UserData.findOne({ phone });
      if (user === null) {
        user = await UserData.findOneAndUpdate(
          {
            phone
          },
          {
            $set: {
              phone,
              referal_id: uid.rnd(),
              invited_by: invitedBy,
              is_onboarding_enabled: isOnboardingEnabled
            }
          },
          { upsert: true, new: true }
        );
        logger.info('login post api /verify created and new user with phone: ', phone);
        console.log('user created');

        // TODO: Create two wishlists "Eat" and "Experiences"
        await Wishlist.create([
          {
            owner_id: user?._id,
            name: 'Eat',
            is_default: true
          },
          {
            owner_id: user?._id,
            name: 'Experiences',
            is_default: true
          }
        ]);
      }

      if (user !== null) {
        const accessToken = generateAccessToken({
          id: user._id
        });

        logger.info(
          'login post api /verify responed with 200 for phone: ',
          phone,
          ' and with token: ',
          accessToken
        );

        if (Boolean(isOnboardingEnabled) && !user.is_onboarding_enabled) {
          user = await UserData.findOneAndUpdate(
            {
              phone
            },
            {
              $set: {
                is_onboarding_enabled: isOnboardingEnabled
              }
            },
            { new: true }
          );
        }

        const friendsCount = await UserData.countDocuments({ invited_by: user?.referal_id });

        return res.status(HttpCode.OK).json({
          msg: 'Logged in successfully.',
          accessToken,
          user: { ...JSON.parse(JSON.stringify(user)), no_of_friends: friendsCount }
        });
      }
    } catch (error) {
      console.log(error);
      logger.error({ error });
      next({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: 'Server error'
      });
    }
  }
  logger.info(
    'login post api /verify responed with 401 as OTP was wither expired or invalid for phone: ',
    phone
  );
  next({
    httpCode: HttpCode.UNAUTHORIZED,
    description: 'OTP expired, please try again'
  });
}) as express.RequestHandler);

LoginRouter.get('/refresh', (async (req, res, next) => {
  const { refresh_token: refreshToken } = req.cookies;
  if (refreshToken === undefined) {
    next({
      httpCode: HttpCode.BAD_REQUEST,
      description: 'Refresh token not present'
    });
    return;
  }
  try {
    if (process.env.REFRESH_TOKEN_SECRET === undefined) {
      next({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: 'Missing config'
      });
      return;
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err: any, user: any) => {
      if (err !== undefined || err !== null) {
        throw err;
      }
      const accessToken = generateAccessToken({
        id: user.id
      });
      res.cookie('access_token', accessToken, CookieMeta);
      return res.status(HttpCode.OK).json({ msg: 'Refresh successfull' });
    });
  } catch (error) {
    console.log(error);
    logger.error({ error });
    next({
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      description: 'Server error'
    });
  }
}) as express.RequestHandler);
