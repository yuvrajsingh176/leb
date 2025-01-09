import mongoose from 'mongoose';
import { UserData } from './user-data.model';
import { TIMESTAMPS_MONGOOSE } from '../constants/global.constants';

const ReferalSchema = new mongoose.Schema(
  {
    referer: {
      type: mongoose.Types.ObjectId,
      required: true
    },
    refered_to: {
      type: mongoose.Types.ObjectId,
      required: true
    },
    created_by: {
      type: mongoose.Types.ObjectId,
      required: false,
      ref: UserData // TODO: Need to add validations for this UserData Model.
    },
    modified_by: {
      type: mongoose.Types.ObjectId,
      required: false,
      ref: UserData
    }
  },
  TIMESTAMPS_MONGOOSE
);

export const Referals = mongoose.model('referals', ReferalSchema);
