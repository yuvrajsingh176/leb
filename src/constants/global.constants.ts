import type {
  AgeGroup,
  EventMood,
  EventType,
  GroupType,
  SkillLevel,
  LocationObj,
  OfferingType,
  CuisineType,
  HighlightTYPE
} from '../types/global.types';

export const CONSTANTS = {
  email_regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  num_regex: /^[0-9]+$/g,
  isNotDev: process.env.NODE_ENV !== 'development'
};

// export const WHATSAPP_UPDATES_TOPIC_ID = '65322b928943200e4195b904';

export const TIMESTAMPS_MONGOOSE = {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'modified_at'
  }
};

export const EVENT_TYPES_LIST: EventType[] = [
  'Cultural Events',
  'Dining Experiences',
  'Family-Friendly Events',
  'Outdoor & Adventure',
  'Parties & Celebrations',
  'Relaxing Retreats'
];

export const EVENT_MOODS_LIST: EventMood[] = [
  'Adventurous & Exciting',
  'Cultural & Traditional',
  'Festive & Lively',
  'Relaxed & Casual',
  'Romantic & Intimate'
];

export const GROUP_TYPES_LIST: GroupType[] = [
  'Friends',
  'Couples',
  'Family',
  'Individuals',
  'Professionals',
  'Kids'
];

export const SKILL_LEVEL_TYPE: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'All'];

export const OFFERINGSTYPE: OfferingType[] = [
  'Alcohol',
  'Beer',
  'Cocktails',
  'Coffee',
  'Comfort food',
  'Dancing',
  'Food at bar',
  'Halal food',
  'Happy-hour drinks',
  'Healthy options',
  'Late-night food',
  'Organic dishes',
  'Quick bite',
  'Salad bar',
  'Vegan options',
  'Vegetarian options',
  'Vegetarian options only',
  'Wine'
];

export const CUISINESTYPE: CuisineType[] = [
  'Burmese',
  'Modern Indian',
  'Tamil',
  'Indonesian',
  'Turkish',
  'Moroccan',
  'Portuguese',
  'Fusion',
  'Street Food',
  'Malaysian',
  'Awadhi',
  'Mexican',
  'Parsi',
  'Malvani',
  'Singaporean',
  'Fast Food',
  'Lebanese',
  'Japanese',
  'Bengali',
  'Mughlai',
  'Konkani',
  'Iranian',
  'Finger Food',
  'North Eastern',
  'Middle Eastern',
  'Andhra',
  'Tibetan',
  'Goan',
  'Hyderabadi',
  'Mediterranean',
  'French',
  'Kerala',
  'Chettinad',
  'Tea',
  'American',
  'Odia',
  'Naga',
  'North Indian',
  'Sri Lankan',
  'Chinese',
  'Sushi',
  'Seafood',
  'Arabian',
  'Greek',
  'Continental',
  'Nepalese',
  'European',
  'Desserts',
  'Thai',
  'Bihari',
  'Maharashtrian',
  'Asian',
  'Tex Mex',
  'Korean',
  'Rajasthani',
  'Gujarati',
  'Health Food',
  'South Indian',
  'Cantonese',
  'Assamese',
  'Burger',
  'Mangalorean',
  'Kashmiri',
  'Italian',
  'Vietnamese',
  'Spanish',
  'World Cuisine'
];

export const HIGHLIGHTSTYPE: HighlightTYPE[] = [
  'Quiz night',
  'Rooftop seating',
  'Great dessert',
  'Bar games',
  'Fireplace',
  'Fast service',
  'Great bar food',
  'Great tea selection',
  'Great cocktails',
  'Live music',
  'Karaoke',
  'Live performances',
  'Great coffee'
];

export const AGE_GROUP_TYPE: AgeGroup[] = ['Kids', 'Teenagers', 'Adults', 'Seniors'];

export const CTASourceList = [
  'Instagram',
  'Bookmyshow',
  'Zomato',
  'PayTM Insider',
  'Swiggy',
  'Facebook',
  'Aroundly',
  'SkillBox',
  'Clubr',
  'Allevents',
  'High Ape',
  'Things2Do',
  'Eatwith',
  'LBB',
  "What'sHot",
  'Facebook Events',
  'Townscript',
  'Trove experiences',
  'Meetup',
  'Events'
];

export const CtaLinkModel = {
  url: { type: String, required: false },
  source: { type: String, required: false },
  type: { type: String, required: false },
  text: { type: String, required: false }
};

export enum HttpCode {
  OK = 200,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

export const CITIES = [
  {
    name: 'Bengaluru',
    coordinates: {
      latitude: 12.9716,
      longitude: 77.5946
    }
  },
  {
    name: 'Chennai',
    coordinates: {
      latitude: 13.0827,
      longitude: 80.2707
    }
  },
  {
    name: 'Mumbai',
    coordinates: {
      latitude: 19.076,
      longitude: 72.8777
    }
  },
  {
    name: 'Hyderabad',
    coordinates: {
      latitude: 17.385,
      longitude: 78.4867
    }
  },
  {
    name: 'Kolkata',
    coordinates: {
      latitude: 22.5726,
      longitude: 88.3639
    }
  },
  {
    name: 'Pune',
    coordinates: {
      latitude: 18.5246164,
      longitude: 73.8629674
    }
  }
  // {
  //   _id: '652cd320d7c8775ac4cf2907',
  //   name: 'Singapore',
  //   coordinates: {
  //     latitude: 1.3521,
  //     longitude: 103.8198
  //   }
  // }
];

export const SUPPORTED_LOCATIONS_LIST: LocationObj[] = [
  {
    location_name: 'All of Bengaluru',
    location_id: 'bengaluru',
    radius: 50000,
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Indiranagar',
    location_id: 'indiranagar',
    radius: 3000,
    latitude: 12.970249,
    longitude: 77.641228,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Church Street',
    location_id: 'church_street',
    radius: 3000,
    latitude: 12.974703,
    longitude: 77.606361,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'HSR Layout',
    location_id: 'hsr_layout',
    radius: 3000,
    latitude: 12.912266,
    longitude: 77.643076,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Koramangala',
    location_id: 'koramangala',
    radius: 3000,
    latitude: 12.937835,
    longitude: 77.618631,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Jayanagar',
    location_id: 'jayanagar',
    radius: 3000,
    latitude: 12.929459,
    longitude: 77.580239,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Whitefield',
    location_id: 'whitefield',
    radius: 3000,
    latitude: 12.969885,
    longitude: 77.750014,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Marathahalli',
    location_id: 'marathahalli',
    radius: 3000,
    latitude: 12.956981,
    longitude: 77.701244,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'BTM Layout',
    location_id: 'btm_layout',
    radius: 3000,
    latitude: 12.916804,
    longitude: 77.610137,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Electronic City',
    location_id: 'electronic_city',
    radius: 3000,
    latitude: 12.844946,
    longitude: 77.660115,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Bannerghatta Road',
    location_id: 'bannerghatta_road',
    radius: 5000,
    latitude: 12.8137008,
    longitude: 77.5779165,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'MG Road',
    location_id: 'mg_road',
    radius: 3000,
    latitude: 12.975036,
    longitude: 77.608277,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Hebbal',
    location_id: 'hebbal',
    radius: 3000,
    latitude: 13.035798,
    longitude: 77.597247,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Malleswaram',
    location_id: 'malleswaram',
    radius: 3000,
    latitude: 13.005354,
    longitude: 77.569297,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Basavanagudi',
    location_id: 'basavanagudi',
    radius: 3000,
    latitude: 12.940975,
    longitude: 77.573772,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Yelahanka',
    location_id: 'yelahanka',
    radius: 3000,
    latitude: 13.101027,
    longitude: 77.587938,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Bellandur',
    location_id: 'bellandur',
    radius: 3000,
    latitude: 12.930021,
    longitude: 77.678889,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'Rajajinagar',
    location_id: 'rajajinagar',
    radius: 3000,
    latitude: 12.99817,
    longitude: 77.553096,
    timezone: 'Asia/Kolkata'
  },
  {
    location_name: 'JP Nagar',
    location_id: 'jp_nagar',
    radius: 3000,
    latitude: 12.906498,
    longitude: 77.585661,
    timezone: 'Asia/Kolkata'
  }
];
