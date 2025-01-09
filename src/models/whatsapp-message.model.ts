import mongoose from 'mongoose';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { UserData } from './user-data.model';
import { SocialMediaUpdates } from './social-media-updates.model';

/*

Sequence of operations

1. Get all the relevant published posts for the user(Reuse function used inside feeds api) - variable_1
2. Get all already sent whatsapp update lists for the particular user by grouping the updates. - variable_2
3. Filter out all the data present inside variable_1 by matching variable_2 - variable_3 (variable_1 - variable_2)
4. send a whatsapp message using variable_3
5. Update the whatsapp message collection on success of whatsapp message sent.


Admin UI - 

Column 1 - user_id and phone
Column 2 - variable_3
Column 3 - CTA (Send Latest Update) - onClick - Show a modal with 2 cta yes or no and display example message
Column 4 - CTA (View previous updates) - onClick - Show a modal with list of all the previous message from whatsappmessage schema with a closing button

*/

const WhatsappMessageSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: UserData
    },
    updates_sent: [{ type: mongoose.Types.ObjectId, ref: SocialMediaUpdates, required: true }]
  },
  TIMESTAMPS_MONGOOSE
);

export const WhatsappMessages = mongoose.model('WhatsappMessage', WhatsappMessageSchema);
