import Axios from 'axios';
import type { LocationObj, PlaceObj } from '../types/global.types';
import { parsePlace } from '../helpers/update-media.helper';

const BACKEND_AI_SERVER_URL = process.env.AI_SERVER;

const commonAxios = Axios.create({
  baseURL: BACKEND_AI_SERVER_URL
});

commonAxios.interceptors.request.use(
  async (config: any) => {
    config.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    return config;
  },
  async (error) => {
    return await Promise.reject(error);
  }
);

const ENDPOINTS = {
  CURATION: 'personalisation_food_and_drinks',
  SEARCH: 'search',
  PERSONALIZATION: 'personalisation',
  PLAN_PERSONALIZATION: 'plans_personalisation'
};

interface SearchResponse {
  result: PlaceObj[];
  additional_info: {
    search_query: string;
    search_type: string;
    generated_keywords: string[];
    generated_dimensions: any;
    location: any;
  };
}

export const placesRagSearch = async (
  query: string,
  location: LocationObj,
  updateType: string
): Promise<SearchResponse> => {
  try {
    const res = await commonAxios.post(ENDPOINTS.SEARCH, {
      query,
      location,
      update_type: updateType
    });
    const results = res.data.result;

    results.forEach(parsePlace);

    return res.data;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const personalisationAPI = async (
  userData: { _id: string; previous_updates: string[] },
  location: LocationObj
): Promise<PlaceObj[]> => {
  try {
    const res = await commonAxios.post(ENDPOINTS.PERSONALIZATION, {
      dimensions: { id: userData._id, previous_updates: userData.previous_updates },
      location
    });

    const results = res.data;

    results.forEach(parsePlace);

    return results;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const planPersonalisationAPI = async (
  wishListId: string,
  location: LocationObj,
  userId: string
): Promise<PlaceObj[]> => {
  try {
    const res = await commonAxios.post(ENDPOINTS.PLAN_PERSONALIZATION, {
      dimensions: { id: wishListId, user_id: userId },
      location
    });

    const results = res.data;

    results.forEach(parsePlace);

    return results;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

interface UserDataObj {
  who: string[] | undefined;
  date_of_birth: Date | undefined;
  interests: string[];
  gender: string | undefined;
}

interface CurationResponse {
  new_addition: PlaceObj[];
  public_favourites: PlaceObj[];
  top_rated: PlaceObj[];
  trending_now: PlaceObj[];
  upcoming_events: PlaceObj[];
}

export const curationAPI = async (
  userData: UserDataObj,
  location: LocationObj
): Promise<CurationResponse> => {
  try {
    const res = await commonAxios.post(ENDPOINTS.CURATION, {
      dimensions: userData,
      location
    });

    const results = res.data;

    const attributes = Object.keys(results);

    attributes.forEach((attribute) => {
      if (attribute !== 'popular_cuisines') results[attribute].forEach(parsePlace);
    });

    return results;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
