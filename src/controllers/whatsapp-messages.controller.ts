import moment from 'moment';
import 'moment-timezone';
import { WhatsappApi } from '../services/whatsapp.service';
import type {
  AddressComponent,
  // InterestProps,
  SocialMediaUpdate,
  UserType
  // UserSubscriptionWithUser
} from '../types/global.types';

const parseMessageLine = (update: SocialMediaUpdate): string =>
  // `${(update.interest_categories as InterestProps[])[0].interest_name} - ${update.caption_title}`;
  update.caption_title as string;

/**
 * Handles the WhatsApp message for template "new_daily_whatsapp_updates_template"
 * @param userSubscription - User subscription details.
 * @param totalUpdates - Total updates for a particular location.
 * @returns - WhatsApp API response.
 */
export const sendNewDailyWhatsappMessage = async (
  userData: UserType,
  totalUpdates: SocialMediaUpdate[]
): Promise<any> => {
  const personalUpdates = totalUpdates.filter((u) =>
    u?.interest_categories?.some((interest: any) =>
      userData?.interests.some((i: any) => i._id.toJSON() === interest._id.toJSON())
    )
  );
  const newPersonalUpdates = personalUpdates.filter(
    (u) =>
      moment(u.modified_at).unix() > moment().startOf('day').unix() &&
      moment(u.modified_at).unix() < moment().endOf('day').unix()
  );

  const newUpdates = totalUpdates.filter(
    (u) =>
      moment(u.modified_at).unix() > moment().startOf('day').unix() &&
      moment(u.modified_at).unix() < moment().endOf('day').unix()
  );

  const weekendUpdates = totalUpdates.filter(
    (u) =>
      moment(u.expires_at).unix() > moment().weekday(6).startOf('day').unix() &&
      moment(u.expires_at).unix() < moment().weekday(7).endOf('day').unix()
  );

  const updateDetails = {
    city: userData.city,
    update_one: parseMessageLine(newUpdates[0]),
    update_two: parseMessageLine(newUpdates[1]),
    update_three: parseMessageLine(newUpdates[2]),
    update_four:
      weekendUpdates.length > 0 ? parseMessageLine(weekendUpdates[0]) : 'None yet, stay tuned!',
    support_number: '+917093214324'
  };

  if (newPersonalUpdates.length > 0 && newPersonalUpdates.length <= 1) {
    updateDetails.update_one = parseMessageLine(newPersonalUpdates[0]);
  }
  if (newPersonalUpdates.length > 1 && newPersonalUpdates.length <= 2) {
    updateDetails.update_one = parseMessageLine(newPersonalUpdates[0]);
    updateDetails.update_two = parseMessageLine(newPersonalUpdates[1]);
  }
  if (newPersonalUpdates.length > 2) {
    updateDetails.update_one = parseMessageLine(newPersonalUpdates[0]);
    updateDetails.update_two = parseMessageLine(newPersonalUpdates[1]);
    updateDetails.update_three = parseMessageLine(newPersonalUpdates[2]);
  }

  const weekendPersonalUpdates = personalUpdates.filter(
    (u) =>
      moment(u.expires_at).unix() > moment().weekday(6).startOf('day').unix() &&
      moment(u.expires_at).unix() < moment().weekday(7).endOf('day').unix()
  );

  if (weekendPersonalUpdates.length > 0) {
    updateDetails.update_four = parseMessageLine(weekendPersonalUpdates[0]);
  }

  // console.log(newPersonalUpdates);
  // return await Promise.resolve(newPersonalUpdates);
  return await WhatsappApi.newDailyWhatsAppMessage(userData.phone, updateDetails);
};

const UPDATE_TYPE_MAP = {
  event: 'Event',
  offer: 'Offer',
  review: 'Place Recommendation'
};

const parseEventAndDate = (update: SocialMediaUpdate): string => {
  if (update.update_type === undefined || update.update_type === null) {
    return '';
  }

  const date = moment(update.expires_at).tz('Asia/Kolkata').format('Do MMM');

  if (update.update_type === 'review') {
    return UPDATE_TYPE_MAP[update.update_type];
  } else if (update.update_type === 'event') {
    return `${UPDATE_TYPE_MAP[update.update_type]} (${date})`;
  } else if (update.update_type === 'offer') {
    return `${UPDATE_TYPE_MAP[update.update_type]} (valid till ${date})`;
  }

  return '';
};

const parseLocalityAndSubLocality = (addressComponents: AddressComponent[]): string => {
  if (
    addressComponents === undefined ||
    addressComponents === null ||
    addressComponents.length === 0
  ) {
    return 'Bengaluru';
  }

  const locality = addressComponents.filter((component) => component.types.includes('locality'))[0];
  const sublocalityLevel1 = addressComponents.filter((component) =>
    component.types.includes('sublocality_level_1')
  )[0];

  if (locality !== undefined && sublocalityLevel1 !== undefined) {
    return `${sublocalityLevel1.short_name}, ${locality.short_name}`;
  }

  if (locality !== undefined && sublocalityLevel1 === undefined) {
    return locality.short_name;
  }

  if (locality === undefined && sublocalityLevel1 !== undefined) {
    return sublocalityLevel1.short_name;
  }

  return 'Bengaluru';
};

const parseLocation = (update: SocialMediaUpdate): string => {
  if (
    update.related_aroundly_place_ids === undefined ||
    update.related_aroundly_place_ids === null
  ) {
    return '';
  }

  const placeName = update.related_aroundly_place_ids[0].name;
  const rating = update.related_aroundly_place_ids[0].google_maps_details.rating;
  const addressComponents =
    update.related_aroundly_place_ids[0].google_maps_details.address_components;

  return `${placeName} (${rating} ⭐️), ${parseLocalityAndSubLocality(addressComponents)}`;
};

const parseLimitedCaptionSummary = (captionSummary: string | undefined): string => {
  if (captionSummary === undefined) {
    return '';
  }

  const MAX_CAPTION_SUMMARY_LENGTH = 75;
  if (captionSummary.length > MAX_CAPTION_SUMMARY_LENGTH) {
    return `- ${captionSummary.substring(0, MAX_CAPTION_SUMMARY_LENGTH)}...`;
  }

  return `- ${captionSummary}`;
};

const newUpdatesFilterFunction = (u: SocialMediaUpdate): boolean =>
  moment(u.modified_at).tz('Asia/Kolkata').unix() >
    moment().tz('Asia/Kolkata').subtract(1, 'day').hour(14).minute(0).second(0).unix() &&
  moment(u.modified_at).tz('Asia/Kolkata').unix() <
    moment().tz('Asia/Kolkata').hour(14).minute(0).second(0).unix();

const weekendFilterFunction = (u: SocialMediaUpdate): boolean =>
  moment(u.expires_at).tz('Asia/Kolkata').unix() >
    moment().tz('Asia/Kolkata').weekday(6).startOf('day').unix() &&
  moment(u.expires_at).tz('Asia/Kolkata').unix() <
    moment().tz('Asia/Kolkata').weekday(7).endOf('day').unix();

export const sendRenewedDailyTemplateMessageWithoutFallback = async (
  userData: UserType,
  totalUpdates: SocialMediaUpdate[]
): Promise<any> => {
  const updateDetails = {
    update_one_title:
      (totalUpdates[0].caption_title as string) +
      ` (https://myaroundly.com/wa/post-${totalUpdates[0]._id})`,
    update_one_summary: parseLimitedCaptionSummary(totalUpdates[0].caption_summary),
    update_one_type_and_date: parseEventAndDate(totalUpdates[0]),
    update_one_location: parseLocation(totalUpdates[0]),
    update_two_title:
      (totalUpdates[1].caption_title as string) +
      ` (https://myaroundly.com/wa/post-${totalUpdates[1]._id})`,
    update_two_summary: parseLimitedCaptionSummary(totalUpdates[1].caption_summary),
    update_two_type_and_date: parseEventAndDate(totalUpdates[1]),
    update_two_location: parseLocation(totalUpdates[1]),
    update_three_title:
      (totalUpdates[2].caption_title as string) +
      ` (https://myaroundly.com/wa/post-${totalUpdates[2]._id})`,
    update_three_summary: parseLimitedCaptionSummary(totalUpdates[2].caption_summary),
    update_three_type_and_date: parseEventAndDate(totalUpdates[2]),
    update_three_location: parseLocation(totalUpdates[2])
  };

  return await WhatsappApi.renewedDailyTemplate(userData.phone, updateDetails);
};

/**
 * Handles the WhatsApp message for template "renewed_daily_template"
 * @param userData - User details.
 * @param totalUpdates - Total updates for a particular location.
 * @returns - WhatsApp API response.
 */
export const sendRenewedDailyTemplateMessage = async (
  userData: UserType,
  totalUpdates: SocialMediaUpdate[]
): Promise<any> => {
  // complete fallback: when there are no weekend updates, All 3 are new updates
  const newUpdates = totalUpdates.filter((u) => newUpdatesFilterFunction(u));
  const updateDetails = {
    update_one_title: newUpdates[0].caption_title as string,
    update_one_summary: parseLimitedCaptionSummary(newUpdates[0].caption_summary),
    update_one_type_and_date: parseEventAndDate(newUpdates[0]),
    update_one_location: parseLocation(newUpdates[0]),
    update_two_title: newUpdates[1].caption_title as string,
    update_two_summary: parseLimitedCaptionSummary(newUpdates[1].caption_summary),
    update_two_type_and_date: parseEventAndDate(newUpdates[1]),
    update_two_location: parseLocation(newUpdates[1]),
    update_three_title: newUpdates[2].caption_title as string,
    update_three_summary: parseLimitedCaptionSummary(newUpdates[2].caption_summary),
    update_three_type_and_date: parseEventAndDate(newUpdates[2]),
    update_three_location: parseLocation(newUpdates[2])
  };

  // Secondary fallback: when there is one weekend update.
  const weekendEvents = totalUpdates
    .filter((u) => weekendFilterFunction(u))
    .filter((u) => u.update_type === 'event');

  if (weekendEvents.length > 0) {
    updateDetails.update_three_title = weekendEvents[0].caption_title as string;
    updateDetails.update_three_summary = parseLimitedCaptionSummary(
      weekendEvents[0].caption_summary
    );
    updateDetails.update_three_type_and_date = parseEventAndDate(weekendEvents[0]);
    updateDetails.update_three_location = parseLocation(weekendEvents[0]);
  }

  // Personal Updates.
  const personalUpdates = totalUpdates.filter((u) =>
    u?.interest_categories?.some((interest: any) =>
      userData?.interests.some((i: any) => i._id.toJSON() === interest._id.toJSON())
    )
  );

  // Primary Fallback: show all 3 personal updates.
  const newPersonalUpdates = personalUpdates.filter((u) => newUpdatesFilterFunction(u));

  if (newPersonalUpdates.length > 0) {
    updateDetails.update_one_title = newPersonalUpdates[0].caption_title as string;
    updateDetails.update_one_summary = parseLimitedCaptionSummary(
      newPersonalUpdates[0].caption_summary
    );
    updateDetails.update_one_type_and_date = parseEventAndDate(newPersonalUpdates[0]);
    updateDetails.update_one_location = parseLocation(newPersonalUpdates[0]);
  }

  if (newPersonalUpdates.length > 1) {
    updateDetails.update_two_title = newPersonalUpdates[1].caption_title as string;
    updateDetails.update_two_summary = parseLimitedCaptionSummary(
      newPersonalUpdates[1].caption_summary
    );
    updateDetails.update_two_type_and_date = parseEventAndDate(newPersonalUpdates[1]);
    updateDetails.update_two_location = parseLocation(newPersonalUpdates[1]);
  }

  if (newPersonalUpdates.length > 2) {
    updateDetails.update_three_title = newPersonalUpdates[2].caption_title as string;
    updateDetails.update_three_summary = parseLimitedCaptionSummary(
      newPersonalUpdates[2].caption_summary
    );
    updateDetails.update_three_type_and_date = parseEventAndDate(newPersonalUpdates[2]);
    updateDetails.update_three_location = parseLocation(newPersonalUpdates[2]);
  }

  // Personal Weekend update: when there are personal weekend updates.
  // const weekendPersonalEvents = personalUpdates
  //   .filter((u) => weekendFilterFunction(u))
  //   .filter((u) => u.update_type === 'event');

  // if (weekendPersonalEvents.length > 0) {
  //   updateDetails.update_three_title = weekendPersonalEvents[0].caption_title as string;
  //   updateDetails.update_three_summary = parseLimitedCaptionSummary(
  //     weekendPersonalEvents[0].caption_summary
  //   );
  //   updateDetails.update_three_type_and_date = parseEventAndDate(weekendPersonalEvents[0]);
  //   updateDetails.update_three_location = parseLocation(weekendPersonalEvents[0]);
  // }

  return await WhatsappApi.renewedDailyTemplate(userData.phone, updateDetails);
};
