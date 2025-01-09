import axios from 'axios';
import { logger } from '../logger/winston.config';
import dotenv from 'dotenv';
dotenv.config();
const GRAPH_API_ENDPOINT = 'https://graph.facebook.com/v18.0';
const AROUNDLY_INSTAGRAM_ID = '17841448821233654';
const LONG_LIVED_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export const InstagramGraphApi = {
  getMediaFromHandles: async function (instaHandle: string) {
    try {
      const { data } = await axios.get(
        GRAPH_API_ENDPOINT +
          `/${AROUNDLY_INSTAGRAM_ID}/?fields=business_discovery.username(${instaHandle}){id,followers_count,media_count,media{id,comments_count,like_count,caption,media_product_type,media_type,media_url,permalink,timestamp,thumbnail_url,children{id,media_url,media_type}}}&access_token=${LONG_LIVED_ACCESS_TOKEN}`
      );
      logger.info(
        'FETCHED data from instagram graph api for handle: ' + instaHandle + ' data: ' + data
      );
      return { handle: instaHandle, data };
    } catch (e) {
      console.log(`${instaHandle} ${(e as any).response.data.error.message}`);
      return { handle: instaHandle, data: [], error: (e as any).response.data.error.message };
    }
  },
  checkHandleId: async function (instaHandle: string) {
    try {
      const { data } = await axios.get(
        GRAPH_API_ENDPOINT +
          `/${AROUNDLY_INSTAGRAM_ID}/?fields=business_discovery.username(${instaHandle}){id,followers_count,media_count}&access_token=${LONG_LIVED_ACCESS_TOKEN}`
      );
      logger.info(
        'FETCHED data from instagram graph api for handle: ' + instaHandle + ' data: ' + data
      );
      return { handle: instaHandle, data };
    } catch (e) {
      console.log(`${instaHandle} ${(e as any).response.data.error.message}`);
      return { handle: instaHandle, data: [], error: (e as any).response.data.error.message };
    }
  }
};
