import { UserData } from '../models/user-data.model';
import { Msg91Api } from '../services/msg91.service';
import { logger } from '../logger/winston.config';
import { WhatsappApi } from '../services/whatsapp.service';
import type { TokenObj } from '../types/global.types';
import { generateAccessToken, generateRefreshToken } from './tokens.helper';

const OTP_SERVICE_TO_USE: 'MSG91' | 'WhatsApp' = 'MSG91';

export const login = async (phone: string): Promise<TokenObj> => {
  try {
    const data = await UserData.findOne({ phone });
    let userData = data;

    if (data === null) {
      const newUser = new UserData({ phone, role: 'customer' });
      userData = await newUser.save();
    }

    const accessToken = generateAccessToken({ id: userData?._id });
    const refreshToken = generateRefreshToken({ id: userData?._id });

    return { access_token: accessToken as string, refresh_token: refreshToken as string };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const sendOtp = async (val: { phone: string; otp: string }): Promise<void> => {
  try {
    const data =
      OTP_SERVICE_TO_USE === 'MSG91' ? await Msg91Api.sendOTP(val) : await WhatsappApi.sendOTP(val);

    return data;
  } catch (e) {
    logger.error(`Error occured while sending OTP to ${OTP_SERVICE_TO_USE}`, e);
    console.log(e);
  }
};
