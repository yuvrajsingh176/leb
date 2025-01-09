import type mongoose from 'mongoose';

export interface PlaceArrProps {
  place_name: string;
  place_latitude: number;
  place_longitude: number;
  place_photos: string[];
  place_address: string;
  place_id: string;
  place_rating: number;
  id?: string | mongoose.Types.ObjectId;
}
