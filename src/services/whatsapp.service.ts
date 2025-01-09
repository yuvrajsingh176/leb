import axios from 'axios';
import type { AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import { logger } from '../logger/winston.config';
dotenv.config();

interface SendOTPProps {
  phone: string;
  otp: string;
}

interface UpdateMessageDetails {
  update_one: string;
  update_two: string;
  update_three: string;
  update_four: string;
  support_number: string;
  city: string;
}

interface RenewedTemplate {
  update_one_title: string;
  update_one_summary: string;
  update_one_type_and_date: string;
  update_one_location: string;
  update_two_title: string;
  update_two_summary: string;
  update_two_type_and_date: string;
  update_two_location: string;
  update_three_title: string;
  update_three_summary: string;
  update_three_type_and_date: string;
  update_three_location: string;
}

const {
  WHATSAPP_ACCESS_TOKEN: ACCESS_TOKEN,
  WHATSAPP_API_VERSION: VERSION,
  WHATSAPP_PHONE_NUMBER_ID: NUMBER_ID
} = process.env;

const WHATSAPP_API_URL = `https://graph.facebook.com/${VERSION}/${NUMBER_ID}`;

const sendWhatsAppMessage = async (messageDetails: any): Promise<AxiosResponse> => {
  return await axios.post(`${WHATSAPP_API_URL}/messages`, messageDetails, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`
    }
  });
};

export const WhatsappApi = {
  async sendOTP(val: SendOTPProps) {
    const messageDetails = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: val.phone.replace('+', ''),
      type: 'template',
      template: {
        name: 'auth',
        language: {
          code: 'en_US'
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: val.otp
              }
            ]
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              {
                type: 'text',
                text: val.otp
              }
            ]
          }
        ]
      }
    };

    try {
      const { data: whatsAppMessageResp } = await sendWhatsAppMessage(messageDetails);
      logger.info(whatsAppMessageResp);
      return whatsAppMessageResp;
    } catch (e) {
      console.log(e);
      throw e;
    }
  },

  // async sendDailyUpdateWithSaved(recipientPhoneNo: string, updateDetails: UpdateMessageDetails) {
  //   const messageDetails = {
  //     messaging_product: 'whatsapp',
  //     to: recipientPhoneNo.replace('+', ''),
  //     type: 'template',
  //     template: {
  //       name: 'daily_messages_with_saved',
  //       language: {
  //         code: 'en'
  //       },
  //       components: [
  //         {
  //           type: 'header',
  //           parameters: [
  //             {
  //               type: 'image',
  //               image: {
  //                 link: updateDetails.image_url
  //               }
  //             }
  //           ]
  //         },
  //         {
  //           type: 'body',
  //           parameters: [
  //             {
  //               type: 'text',
  //               text: updateDetails.city
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.date
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.update_one
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.update_two
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.update_three
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.update_four
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.count_of_more_updates
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.saved_update_one
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.saved_update_two
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   };

  //   try {
  //     const { data: whatsAppMessageResp } = await sendWhatsAppMessage(messageDetails);
  //     logger.info(whatsAppMessageResp);
  //     return whatsAppMessageResp;
  //   } catch (e) {
  //     console.log(e);
  //     throw e;
  //   }
  // },
  // async sendDailyUpdate(recipientPhoneNo: string, updateDetails: UpdateMessageDetails) {
  //   const messageDetails = {
  //     messaging_product: 'whatsapp',
  //     to: recipientPhoneNo.replace('+', ''),
  //     type: 'template',
  //     template: {
  //       name: 'daily_updates_message',
  //       language: {
  //         code: 'en_US'
  //       },
  //       components: [
  //         {
  //           type: 'header',
  //           parameters: [
  //             {
  //               type: 'image',
  //               image: {
  //                 link: updateDetails.image_url
  //               }
  //             }
  //           ]
  //         },
  //         {
  //           type: 'body',
  //           parameters: [
  //             {
  //               type: 'text',
  //               text: updateDetails.update_one
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.update_two
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.update_three
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.update_four
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.update_five
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.count_of_more_updates
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.date
  //             },
  //             {
  //               type: 'text',
  //               text: updateDetails.city
  //             }
  //           ]
  //         },
  //         {
  //           type: 'button',
  //           sub_type: 'url',
  //           index: '0',
  //           parameters: [
  //             {
  //               type: 'text',
  //               text: 'feed'
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   };

  //   try {
  //     const { data: whatsAppMessageResp } = await sendWhatsAppMessage(messageDetails);
  //     logger.info(whatsAppMessageResp);
  //     return whatsAppMessageResp;
  //   } catch (e) {
  //     console.log(e);
  //     throw e;
  //   }
  // },
  //   async newYearsMessage(recipientPhoneNo: string) {
  //     const IMAGE_URL = 'https://aroundly-instagram-playground.web.app/whatsapp-new-years.png';
  //     const NEW_YEARS_TEMPLATE = 'every_new_years_message';
  //     const messageDetails = {
  //       messaging_product: 'whatsapp',
  //       to: recipientPhoneNo.replace('+', ''),
  //       type: 'template',
  //       template: {
  //         name: NEW_YEARS_TEMPLATE,
  //         language: {
  //           code: 'en'
  //         },
  //         components: [
  //           {
  //             type: 'header',
  //             parameters: [
  //               {
  //                 type: 'image',
  //                 image: {
  //                   link: IMAGE_URL
  //                 }
  //               }
  //             ]
  //           },
  //           {
  //             type: 'body',
  //             parameters: [
  //               {
  //                 type: 'text',
  //                 text: '2024'
  //               }
  //             ]
  //           }
  //         ]
  //       }
  //     };

  //     try {
  //       const { data: whatsAppMessageResp } = await sendWhatsAppMessage(messageDetails);
  //       logger.info(whatsAppMessageResp);
  //       return whatsAppMessageResp;
  //     } catch (e) {
  //       console.log(e);
  //       throw e;
  //     }
  //   }

  async newDailyWhatsAppMessage(recipientPhoneNo: string, updateDetails: UpdateMessageDetails) {
    const messageDetails = {
      messaging_product: 'whatsapp',
      to: recipientPhoneNo.replace('+', ''),
      type: 'template',
      template: {
        name: 'new_daily_whatsapp_updates_template',
        language: {
          code: 'en'
        },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'text',
                text: updateDetails.city
              }
            ]
          },
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: updateDetails.update_one
              },
              {
                type: 'text',
                text: updateDetails.update_two
              },
              {
                type: 'text',
                text: updateDetails.update_three
              },
              {
                type: 'text',
                text: updateDetails.update_four
              },
              {
                type: 'text',
                text: updateDetails.support_number
              }
            ]
          }
        ]
      }
    };

    try {
      const { data: whatsAppMessageResp } = await sendWhatsAppMessage(messageDetails);
      logger.info(whatsAppMessageResp);
      return whatsAppMessageResp;
    } catch (e: any) {
      console.log(e.response.data);
      throw e;
    }
  },
  async renewedDailyTemplate(recipientPhoneNo: string, updateDetails: RenewedTemplate) {
    const messageDetails = {
      messaging_product: 'whatsapp',
      to: recipientPhoneNo.replace('+', ''),
      type: 'template',
      template: {
        name: 'renewed_daily_template',
        language: {
          code: 'en'
        },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'image',
                image: {
                  link: 'https://aroundly-instagram-playground.web.app/renewed-whatsapp-message-media.png'
                }
              }
            ]
          },
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: updateDetails.update_one_title
              },
              {
                type: 'text',
                text: updateDetails.update_one_type_and_date
              },
              {
                type: 'text',
                text: updateDetails.update_one_location
              },
              {
                type: 'text',
                text: updateDetails.update_two_title
              },
              {
                type: 'text',
                text: updateDetails.update_two_type_and_date
              },
              {
                type: 'text',
                text: updateDetails.update_two_location
              },
              {
                type: 'text',
                text: updateDetails.update_three_title
              },
              {
                type: 'text',
                text: updateDetails.update_three_type_and_date
              },
              {
                type: 'text',
                text: updateDetails.update_three_location
              },
              {
                type: 'text',
                text: updateDetails.update_one_summary
              },
              {
                type: 'text',
                text: updateDetails.update_two_summary
              },
              {
                type: 'text',
                text: updateDetails.update_three_summary
              }
            ]
          }
        ]
      }
    };

    try {
      const { data: whatsAppMessageResp } = await sendWhatsAppMessage(messageDetails);
      logger.info(whatsAppMessageResp);
      return whatsAppMessageResp;
    } catch (e: any) {
      console.log(e.response.data);
      throw e;
    }
  },
  async releaseNotesTemplate(
    recipientPhoneNo: string,
    releaseNotes: { note_1: string; note_2: string; note_3: string }
  ) {
    const messageDetails = {
      messaging_product: 'whatsapp',
      to: recipientPhoneNo.replace('+', ''),
      type: 'template',
      template: {
        name: 'release_log',
        language: {
          code: 'en'
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: releaseNotes.note_1
              },
              {
                type: 'text',
                text: releaseNotes.note_2
              },
              {
                type: 'text',
                text: releaseNotes.note_3
              }
            ]
          }
        ]
      }
    };

    try {
      const { data: whatsAppMessageResp } = await sendWhatsAppMessage(messageDetails);
      logger.info(whatsAppMessageResp);
      return whatsAppMessageResp;
    } catch (e: any) {
      console.log(e.response.data);
      throw e;
    }
  },
  async launchTemplate(recipientPhoneNo: string) {
    const messageDetails = {
      messaging_product: 'whatsapp',
      to: recipientPhoneNo.replace('+', ''),
      type: 'template',
      template: {
        name: 'launch_updates',
        language: {
          code: 'en'
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: "We're happy to share our biggest update to your local discovery"
              },
              {
                type: 'text',
                text: '1️⃣ *Ask as if you ask a friend* like "best cafes for couples" and get recommendations around you.'
              },
              {
                type: 'text',
                text: `2️⃣ *Add Aroundly to phone's Home Screen*: Ex: On Chrome, click the Share button beside the URL and select "Add to Home Screen". Works like mobile app.`
              },
              {
                type: 'text',
                text: `3️⃣ *Share your discoveries*: Found something interesting? Easily share your searches and discoveries with your friends. Head to https://myaroundly.com/feed`
              },
              {
                type: 'text',
                text: 'https://myaroundly.com/feed'
              }
            ]
          }
        ]
      }
    };

    try {
      const { data: whatsAppMessageResp } = await sendWhatsAppMessage(messageDetails);
      logger.info(whatsAppMessageResp);
      return whatsAppMessageResp;
    } catch (e: any) {
      console.log(e.response.data);
      throw e;
    }
  }
};
