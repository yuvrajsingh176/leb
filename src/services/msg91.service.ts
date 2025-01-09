import axios from 'axios';
import { logger } from '../logger/winston.config';

interface SendOTPProps {
  phone: string;
  otp: string;
}

export const Msg91Api = {
  sendOTP: async function (val: SendOTPProps) {
    console.log(val);
    try {
      const { data } = await axios.get(
        `https://api.msg91.com/api/v5/otp?template_id=${process.env.MSG91_TEMPLATED_ID}&mobile=${val.phone}&authkey=${process.env.MSG91_AUTH_KEY}&otp=${val.otp}`
      );
      // TODO: Need to handle MSG91 OTP error responses.
      logger.info('MSG91 OTP request completed');
      logger.info(data);
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};
