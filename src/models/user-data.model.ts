import mongoose from 'mongoose';
import { Avatars } from './avatars.model';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';
import { Interests } from './interests.model';

const ROLE_ADMIN = 'admin';
const ROLE_CUSTOMER = 'customer';

const userDataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false
    },
    email: {
      type: String,
      required: false
    },
    avatar_id: {
      type: mongoose.Types.ObjectId,
      required: false,
      ref: Avatars
    },
    referal_id: {
      type: String,
      required: false,
      unique: true
    },
    referrals: {
      type: Number,
      required: false
    },
    invited_by: {
      type: String,
      required: false
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Non Binary'],
      required: true
    },
    stepout: {
      type: [String],
      required: true
    },
    phone: {
      type: String,
      required: true,
      unique: true
    },
    date_of_birth: {
      type: Date,
      required: false
    },
    is_active: {
      type: Boolean,
      default: true
    },
    is_onboarding_completed: {
      type: Boolean,
      default: false
    },
    is_onboarding_enabled: {
      type: Boolean,
      default: false // false means user is in pre-registration stage. True means user is in registration stage.
    },
    city: {
      type: String,
      required: false
    },
    interests: [
      {
        type: mongoose.Types.ObjectId,
        ref: Interests
      }
    ],
    role: {
      type: String,
      enum: [ROLE_ADMIN, ROLE_CUSTOMER],
      default: ROLE_CUSTOMER
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const UserData = mongoose.model('UserData', userDataSchema);
