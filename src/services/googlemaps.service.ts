import axios from 'axios';

interface FindPlaceFromTextProps {
  name: string;
  address: string;
  longitude: number;
  latitude: number;
}

interface TextSearchProps {
  query: string;
}

export const GoogleMapsApi = {
  findPlaceFromText: async function (val: FindPlaceFromTextProps) {
    try {
      const { data } = await axios.get(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?fields=formatted_address,name,rating,opening_hours,geometry,place_id,photos&input=${
          val.name + ', ' + val.address
        }&inputtype=textquery&key=${process.env.MAPS_API_KEY}&locationbias=circle%3A500%40${
          val.latitude
        },${val.longitude}`
      );
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
  textSearch: async function (val: TextSearchProps) {
    try {
      const { data } = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${val.query}&key=${process.env.MAPS_API_KEY}`
      );
      return data;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};
