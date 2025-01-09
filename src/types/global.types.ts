import type mongoose from 'mongoose';

export interface TokenObj {
  access_token: string;
  refresh_token: string;
}

export interface OTPObj {
  otp: string;
  phone: string;
  expire: Date;
}

export interface PlaceObj {
  _id: string;
  distance?: number;
  name: string;
  place_id?: string;
  google_maps_details: {
    rating: number;
    formatted_address: string;
  };
  updates: SocialMediaUpdate[];
}

export type UpdateSource =
  | 'instagram'
  | 'tiktok'
  | 'twitter'
  | 'bookmyshow'
  | 'aroundly'
  | 'paytm-insider'
  | 'meetup'
  | 'skillbox'
  | 'townscript'
  | 'highape'
  | 'urbanaut';

type UpdateType = 'offer' | 'event' | 'review' | 'general_update';

export type EventType =
  | 'Parties & Celebrations'
  | 'Family-Friendly Events'
  | 'Dining Experiences'
  | 'Outdoor & Adventure'
  | 'Cultural Events'
  | 'Relaxing Retreats';

export type EventMood =
  | 'Festive & Lively'
  | 'Relaxed & Casual'
  | 'Cultural & Traditional'
  | 'Romantic & Intimate'
  | 'Adventurous & Exciting';

export type GroupType = 'Friends' | 'Couples' | 'Family' | 'Individuals' | 'Professionals' | 'Kids';

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All';

export type AgeGroup = 'Kids' | 'Teenagers' | 'Adults' | 'Seniors';

export interface InterestProps {
  _id: string;
  interest_name: string;
  updates_subinterests: string[];
  places_subinterests: string[];
}

export interface CtaLinksProps {
  source: CTASourceType;
  url: string;
  text: string;
}

export type CuisineType =
  | 'Burmese'
  | 'Modern Indian'
  | 'Tamil'
  | 'Indonesian'
  | 'Turkish'
  | 'Moroccan'
  | 'Portuguese'
  | 'Fusion'
  | 'Street Food'
  | 'Malaysian'
  | 'Awadhi'
  | 'Mexican'
  | 'Parsi'
  | 'Malvani'
  | 'Singaporean'
  | 'Fast Food'
  | 'Lebanese'
  | 'Japanese'
  | 'Bengali'
  | 'Mughlai'
  | 'Konkani'
  | 'Iranian'
  | 'Finger Food'
  | 'North Eastern'
  | 'Middle Eastern'
  | 'Andhra'
  | 'Tibetan'
  | 'Goan'
  | 'Hyderabadi'
  | 'Mediterranean'
  | 'French'
  | 'Kerala'
  | 'Chettinad'
  | 'Tea'
  | 'American'
  | 'Odia'
  | 'Naga'
  | 'North Indian'
  | 'Sri Lankan'
  | 'Chinese'
  | 'Sushi'
  | 'Seafood'
  | 'Arabian'
  | 'Greek'
  | 'Continental'
  | 'Nepalese'
  | 'European'
  | 'Desserts'
  | 'Thai'
  | 'Bihari'
  | 'Maharashtrian'
  | 'Asian'
  | 'Tex Mex'
  | 'Korean'
  | 'Rajasthani'
  | 'Gujarati'
  | 'Health Food'
  | 'South Indian'
  | 'Cantonese'
  | 'Assamese'
  | 'Burger'
  | 'Mangalorean'
  | 'Kashmiri'
  | 'Italian'
  | 'Vietnamese'
  | 'Spanish'
  | 'World Cuisine';

export type OfferingType =
  | 'Organic dishes'
  | 'Alcohol'
  | 'Healthy options'
  | 'Quick bite'
  | 'Cocktails'
  | 'Salad bar'
  | 'Happy-hour drinks'
  | 'Food at bar'
  | 'Vegetarian options'
  | 'Halal food'
  | 'Wine'
  | 'Beer'
  | 'Dancing'
  | 'Vegan options'
  | 'Comfort food'
  | 'Coffee'
  | 'Vegetarian options only'
  | 'Late-night food';

export type CTASourceType =
  | 'Instagram'
  | 'bookmyshow'
  | 'Zomato'
  | 'paytm-insider'
  | 'Swiggy'
  | 'Facebook'
  | 'Aroundly'
  | 'SkillBox'
  | 'Clubr'
  | 'Allevents'
  | 'High Ape'
  | 'Things2Do'
  | 'Eatwith'
  | 'LBB'
  | "What'sHot"
  | 'Facebook Events'
  | 'Townscript'
  | 'Trove experiences'
  | 'meetup'
  | 'Events'
  | 'Urbanaut';

export type HighlightTYPE =
  | 'Quiz night'
  | 'Rooftop seating'
  | 'Great dessert'
  | 'Bar games'
  | 'Fireplace'
  | 'Fast service'
  | 'Great bar food'
  | 'Great tea selection'
  | 'Great cocktails'
  | 'Live music'
  | 'Karaoke'
  | 'Live performances'
  | 'Great coffee';

export interface MediaMeta {
  height?: number;
  key?: string;
  url?: string;
  size?: number;
  type?: 'GIF' | 'VIDEO' | 'IMAGE';
  width?: number;
}

export interface SocialMediaUpdate {
  _id?: string;
  social_media_update_id: string;
  social_media_handle: string;
  caption_summary?: string;
  caption_title?: string;
  is_relevant?: boolean;
  source: UpdateSource;
  related_aroundly_place_ids?: AroundlyPlace[];
  is_published?: boolean;
  social_media_update_details: any;
  interest_categories?: InterestProps[];
  update_type?: UpdateType;
  event_type?: EventType[];
  event_mood?: EventMood[];
  group_type?: GroupType[];
  source_link: string;
  timestamp: Date;
  created_at?: Date;
  modified_at?: Date;
  expires_at?: Date | null;
  starts_at?: Date | null;
  cta_links?: CtaLinksProps[];
  skill_level?: SkillLevel;
  age_group?: AgeGroup[];
  sub_categories?: string[];
  trends_history?: Record<string, any>;
  likes?: number;
  offerings?: OfferingType[];
  media_metadata?: {
    media_compressed: MediaMeta;
    media_original: MediaMeta;
  };
}

export interface S3MediaUploadable {
  id: string;
  media_type: InstagramMediaType;
  media_url: string;
}

export interface UpdateDetails {
  updates: InstagramUpdate[];
  source: UpdateSource;
  business_handle: string;
}

export interface LocationType {
  location_name: string;
  location_id: string;
  radius: number;
  latitude: number;
  longitude: number;
  timezone: string;
}

export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

export interface InstagramUpdate {
  id: string;
  comments_count: number;
  like_count: number;
  media_product_type: string;
  media_type: InstagramMediaType;
  media_url: string;
  permalink: string;
  timestamp: Date;
  thumbnail_url: string;
  children: Array<{ id: string; media_type: InstagramMediaType; media_url: string }>;
}

interface EmbeddingDataObj {
  object: 'embedding';
  index: number;
  embedding: number[];
}

export interface EmbeddingResponse {
  object: string;
  data: EmbeddingDataObj[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface UserVerifiedObj {
  id: string;
  iat: number;
  exp: number;
}

type AroundlyPlaceType = '';

type AroundlyPlaceCategory = '';

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface LocationObj {
  location_name: string;
  location_id: string;
  radius: number;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface WishlistType {
  owner_id: mongoose.Types.ObjectId;
  name: string;
  collaborators: string[];
  places: [
    {
      place_id: string;
      added_by: string;
      added_at: Date;
      updates: [
        {
          update_id: string;
          added_by: string;
          added_at: Date;
        }
      ];
    }
  ];
}

interface GoogleMapPlaceDetails {
  _id: string;
  geolocation: string;
  rating: number;
  address_components: AddressComponent[];
  formatted_address: string;
}

interface ExternalLinkDetails {
  link: string;
  source: UpdateSource;
  link_text: string;
}

export interface AroundlyPlace {
  _id: string;
  name: string;
  place_type: AroundlyPlaceType;
  google_maps_details: GoogleMapPlaceDetails;
  place_category: AroundlyPlaceCategory;
  geolocation: string;
}

export interface Business {
  name: string;
  location: string; // ID pointing to aroundly place.
  ratings: number;
  reviews: any;
  quality_score: number;
  description: string;
  images: string[];
  category: string;
  business_type: string;
  email: string;
  phone: string;
  social_accounts: ExternalLinkDetails[];
  is_verified_by_aroundly: boolean;
}

export type S3ContentType = 'image/jpeg' | 'video/mp4';

export interface CronJobDetails {
  _id: string;
  name: string;
  function_name: string;
  schedule_expression: string;
  description: string;
  active: boolean;
  status: 'running' | 'not-running';
}

export interface FavoriteProps {
  _id: string;
  status: boolean;
  user_id: string;
  update_id: SocialMediaUpdate;
}

export interface UserActionWishlist {
  update_id: string;
  timestamp: Date;
}

export interface UserActionNotInterested {
  update_id: string;
  timestamp: Date;
  additional_info: Record<string, any>;
}

export interface UserActions {
  user_id: string;
  wishlist: UserActionWishlist[];
  not_interested: UserActionNotInterested[];
  created_at: Date;
  modified_at: Date;
}

export interface InstaHandleType {
  _id: string;
  handle: string;
  handle_id: string;
  city: string;
  status: boolean;
}

export interface UserType {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar_id: string;
  referal_id: string;
  referrals: number;
  date_of_birth: string;
  interests: string[];
  city: string;
  role: 'admin' | 'customer';
}
