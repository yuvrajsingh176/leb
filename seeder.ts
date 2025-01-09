import dotenv from 'dotenv';
import { connectToDB, disconnectDB } from './src/services/mongodb-connection.service';
// import { UserData } from './src/models/user-data.model';
// import { Wishlist } from './src/models/wishlist.model';
// import mongoose from 'mongoose';
// import { updatedData } from './sample_converted.js';
// import { placesList } from './first100';
// import { AroundlyPlaces } from './src/models/aroundly-place.model';
// import { SocialMediaUpdates } from './src/models/social-media-updates.model';
// import mongoose from 'mongoose';

// import { UserData } from './src/models/user-data.model';
// import { Interests } from './src/models/interests.model';
// import { Subscriptions } from './src/models/subscription-topics.model';
// import { Avatars } from './src/models/avatars.model';

// import UserDataFixture from './src/fixtures/users.fixture.json';
// import InterestData from './src/fixtures/interest.fixture.json';
// import { SocialMediaUpdates } from './src/models/social-media-updates.model';
// import { Interests } from './src/models/interests.model';
// import { UserData } from './src/models/user-data.model';
// import SubscriptionData from './src/fixtures/subscription.fixture.json';
// import AvatarData from './src/fixtures/avatar.fixture.json';

dotenv.config();

const loadFixturesToDB = async (): Promise<void> => {
  try {
    await connectToDB();

    /* Script 1: For each user, create two default wishlists "Eat" and "Experiences".
    
      const users = await UserData.find({});
      console.log(users.length);

      const updatedUsers = JSON.parse(JSON.stringify(users));

      const wishlistUpdates = updatedUsers.map(async (user: any) => {
        return await Wishlist.create([
          {
            owner_id: new mongoose.Types.ObjectId(user._id),
            name: 'Eat',
            is_default: true
          },
          {
            owner_id: new mongoose.Types.ObjectId(user._id),
            name: 'Experiences',
            is_default: true
          }
        ]);
      });

      const res = await Promise.all(wishlistUpdates);
      console.log(res.length);
    
    */

    /* Script 2: Compute KnownFor for all the locations in the database.

      const aroundlyPlaces = await AroundlyPlaces.find({}).select({
        _id: 1,
        place_id: 1,
        'google_maps_details.additional_details': {
          highlights: 1,
          offerings: 1
        },
        swiggy_dine_out_details: { best_selling_items: 1, cuisine: 1 }
      });

      console.log(`Places in the DB: ${aroundlyPlaces.length}`);

      const placesUpdates = aroundlyPlaces.map(async (p: any) => {
        // TODO: For each place, compute the known_for array.
        const knownFor = new Set<string>();

        const highlights =
          p.google_maps_details?.additional_details?.highlights !== undefined &&
          Array.isArray(p.google_maps_details?.additional_details?.highlights)
            ? p.google_maps_details?.additional_details?.highlights
            : [];

        const bestSellingItems =
          p.swiggy_dine_out_details?.best_selling_items !== undefined &&
          Array.isArray(p.swiggy_dine_out_details?.best_selling_items)
            ? p.swiggy_dine_out_details?.best_selling_items
            : [];

        const cuisine =
          p.swiggy_dine_out_details?.cuisine !== undefined &&
          Array.isArray(p.swiggy_dine_out_details?.cuisine)
            ? p.swiggy_dine_out_details?.cuisine
            : [];

        const offerings =
          p.google_maps_details?.additional_details?.offerings !== undefined &&
          Array.isArray(p.google_maps_details?.additional_details?.offerings)
            ? p.google_maps_details?.additional_details?.offerings
            : [];

        highlights.forEach((h: string) => knownFor.add(h));
        bestSellingItems.forEach((b: string) => knownFor.add(b));
        cuisine.forEach((c: string) => knownFor.add(c));
        offerings.forEach((o: string) => knownFor.add(o));

        return await AroundlyPlaces.findOneAndUpdate(
          { _id: p._id },
          {
            known_for: Array.from(knownFor)
          }
        ).catch((e) => {
          console.log(e);
        });
      });

      const res = await Promise.all(placesUpdates);
      console.log(res.length);

    */

    // Script 3: Update the onboarding status for all users.
    // const updatedUsers = users.map(async (user) => {
    //   await UserData.findOneAndUpdate({ _id: user._id }, { is_onboarding_enabled: true }).catch(
    //     (e) => {
    //       console.log(e);
    //     }
    //   );
    // });

    /* Script 4: Update the additional details for an aroundly place
      
      console.log(placesList.length);

      const aroundlyPlaces = await AroundlyPlaces.find({}).select({ _id: 1, place_id: 1 });

      console.log(aroundlyPlaces.length);

      const googlePlaceIDsAroundly = aroundlyPlaces.map((a) => a.place_id);

      const notInDB = placesList.filter((p: any) => !googlePlaceIDsAroundly.includes(p.place_id));

      const inDB = placesList.filter((p: any) => googlePlaceIDsAroundly.includes(p.place_id));

      console.log(notInDB.length);
      console.log(inDB.length);

      const placesUpdates = inDB.map(async (p: any) => {
        const existingDetail = await AroundlyPlaces.findOne({ place_id: p.place_id });

        const prop: any = {};
        const additionalDetailsObj = Object.keys(p.props).reduce((acc, curr) => {
          acc[curr.split(' ').join('_').toLowerCase()] = p.props[curr];
          return acc;
        }, prop);

        return await AroundlyPlaces.findOneAndUpdate(
          { place_id: p.place_id },
          {
            google_maps_details: {
              ...existingDetail?.google_maps_details,
              additional_details: additionalDetailsObj
            }
          }
        ).catch((e) => {
          console.log(e);
        });
      });

      const res = await Promise.all(placesUpdates);
      console.log(res.length);

    */

    // const placesToBeCreated = notInDB.map((p) => {
    //   const JsonLD = JSON.parse(p['JSON-LD Data']);
    //   const type = String(JsonLD['@type']).toLowerCase();

    //   return {
    //     name: p.Name,
    //     place_id: p['Google Place_ID'],
    //     place_type: 'swiggy_place',
    //     place_category: type,
    //     geo_location:
    //       JsonLD.geo !== undefined
    //         ? {
    //             type: 'Point',
    //             coordinates: [JsonLD.geo.longitude, JsonLD.geo.latitude]
    //           }
    //         : null,
    //     google_maps_details: {
    //       formatted_address: JsonLD.address !== undefined ? JsonLD.address.streetAddress : '',
    //       rating: p.Rating
    //     },
    //     swiggy_dine_out_details: {
    //       name: p.Name,
    //       rating: p.Rating,
    //       location: p.Location,
    //       url: p.URL,
    //       price_for_two: p['Price for two (approx)'],
    //       cuisine: p.Cuisine,
    //       best_selling_items: p['Best Selling Items'],
    //       facilities: p['Facilities & Features'],
    //       votes: p.Votes,
    //       reviews_count: p['Number of Reviews'],
    //       menus: p.Menus !== null && p.Menus !== undefined ? p.Menus.split(', ') : [],
    //       type,
    //       geo: JsonLD.geo,
    //       telephone: JsonLD.telephone,
    //       address: JsonLD.address,
    //       additional_data: JsonLD
    //     }
    //   };
    // });

    // const placesCreated = await AroundlyPlaces.create(placesToBeCreated);

    // console.log(placesCreated.length);

    // console.log(updatedData.slice(0, 2));

    // const updateIds = updatedData.map((u) => u._id);
    // const updateIds = [
    //   new mongoose.Types.ObjectId('65e455f789e62a8ad6124333'),
    //   new mongoose.Types.ObjectId('65d6c49f91e13caaa757136b')
    // ];

    // const updates = await SocialMediaUpdates.find({});

    // const updatedUpdates = updatedData.map(async (u) => {
    //   await SocialMediaUpdates.findOneAndUpdate(
    //     { _id: new mongoose.Types.ObjectId(u._id) },
    //     {
    //       group_type: u.group_type,
    //       sub_categories: u.sub_categories,
    //       age_group: u.age_group
    //     }
    //   ).catch((e) => {
    //     console.log(e);
    //   });
    // });

    // await Promise.all(updatedUpdates);

    // console.log(updates[0].event_type);

    // const users = await UserData.find({});
    // console.log(users.length);

    // const updatedUsers = users.map(async (user) => {
    //   await UserData.findOneAndUpdate({ _id: user._id }, { is_onboarding_enabled: true }).catch(
    //     (e) => {
    //       console.log(e);
    //     }
    //   );
    // });

    // await Promise.all(updatedUsers);

    // const interests = await Interests.find();

    // console.log(interests.length);

    // const interestUpdates = interests.map(async (interest) => {
    //   await Interests.findOneAndUpdate({ _id: interest._id }, { display_name: 'sample' }).catch(
    //     (e) => {
    //       console.log(e);
    //     }
    //   );
    // });

    // await Promise.all(interestUpdates);

    // for (const eachSubscription of SubscriptionData) {
    //   if ((await Subscriptions.findOne({ _id: eachSubscription._id })) === null) {
    //     await Subscriptions.create(eachSubscription);
    //   }
    // }
    // const updates = await SocialMediaUpdates.find({
    //   source: 'aroundly',
    //   cta_links: { $elemMatch: { source: 'Bookmyshow' } },
    //   expires_at: { $gt: new Date() }
    // });

    // console.log(updates.length);

    // const updatedUpdates = updates.map(async (update) => {
    //   await SocialMediaUpdates.findOneAndUpdate(
    //     { _id: update._id },
    //     { source: 'bookmyshow', source_link: update.cta_links[0].url }
    //   ).catch((e) => {
    //     console.log(e);
    //   });
    // });

    // await Promise.all(updatedUpdates);

    // const updates = await SocialMediaUpdates.find({
    //   is_published: true,
    //   update_type: 'review',
    //   expires_at: { $not: { $eq: null }, $lt: new Date('2024-03-01T00:00:00.000+00:00') }
    // });

    // console.log(updates.length);
    // for (const eachInterest of InterestData) {
    //   // if ((await Interests.findOne({ _id: eachInterest._id })) === null) {
    //   //   await Interests.create(eachInterest);
    //   // }
    //   // try {
    //   //   await Interests.create(eachInterest);
    //   // } catch (e) {
    //   //   continue;
    //   // }
    //   await Interests.findOneAndUpdate({ _id: eachInterest._id }, eachInterest);
    //   // if ((await Interests.findOne({ _id: eachInterest._id })) === null) {
    //   //   await Interests.create(eachInterest);
    //   // }
    // }

    console.log('Data inserted successfully');

    await disconnectDB();
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

loadFixturesToDB().catch((e) => {
  console.log(e);
});
