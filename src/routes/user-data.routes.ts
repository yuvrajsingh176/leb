import express from 'express';
import { UserData } from '../models/user-data.model';
import { requireAuthenticationToken } from '../middlewares/auth.middleware';
import { HttpCode } from '../constants/global.constants';
import { logger } from '../logger/winston.config';

export const UserDataRouter = express.Router();
const STANDARD_RESPONSES = {
  SAVE: 'User Data successfully saved',
  ERROR404: 'User not found'
};

UserDataRouter.post('/', (async (req, res, next) => {
  try {
    logger.info('user-data post api / requested with body: ', req.body);
    const result = await UserData.create(req.body);
    res.status(HttpCode.OK).json({ msg: STANDARD_RESPONSES.SAVE, result });
    logger.info('user-data post api / responed 200 with data: ', result);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

UserDataRouter.patch('/update', requireAuthenticationToken, (async (req, res, next) => {
  try {
    const {
      birthdate,
      gender,
      stepout,
      is_onboarding_completed: isOnboardingCompleted,
      interests,
      city,
      name
    } = req.body;

    interface UpdateFields {
      date_of_birth?: Date;
      gender?: string;
      stepout?: any;
      is_onboarding_completed?: boolean;
      name?: string;
      interests?: string[];
      city?: string;
    }
    const id = req.user?.id;

    const updateFields: UpdateFields = {};

    if (birthdate !== undefined) updateFields.date_of_birth = birthdate;
    if (gender !== undefined) updateFields.gender = gender;
    if (stepout !== undefined) updateFields.stepout = stepout;
    if (isOnboardingCompleted !== undefined)
      updateFields.is_onboarding_completed = isOnboardingCompleted;
    if (name !== undefined) updateFields.name = name;
    if (interests !== undefined) updateFields.interests = interests;
    if (city !== undefined) updateFields.city = city;

    const user = await UserData.findOne({ _id: id });

    if (user === null) {
      return res.status(HttpCode.NO_CONTENT).json({ msg: STANDARD_RESPONSES.ERROR404 });
    }

    const updatedUser = await UserData.findByIdAndUpdate(user._id, updateFields, { new: true });

    if (updatedUser === null) {
      return res.status(HttpCode.NOT_FOUND).json({ msg: STANDARD_RESPONSES.ERROR404 });
    }

    res.status(HttpCode.OK).json({ msg: STANDARD_RESPONSES.SAVE, updatedUser });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

UserDataRouter.get('/', requireAuthenticationToken, (async (req, res, next) => {
  try {
    const id = req.user?.id;
    logger.info('user-data get api / requested by user: ', id);
    const result = await UserData.findOne({ _id: id }).populate('avatar_id');
    const friendsCount = await UserData.countDocuments({ invited_by: result?.referal_id });
    // const UserSubscription = await UserSubscriptions.findOne({
    //   user_id: new mongoose.Types.ObjectId(id),
    //   topic_id: new mongoose.Types.ObjectId(WHATSAPP_UPDATES_TOPIC_ID)
    // });
    if (result !== null) {
      logger.info('user-data get api / responed 200 for user: ', id, ' with data: ', result);
      res
        .status(HttpCode.OK)
        .json({ ...JSON.parse(JSON.stringify(result)), no_of_friends: friendsCount });
    } else {
      logger.info(
        'user-data get api / responed 404 for user: ',
        id,
        ' because there was no such document'
      );
      res.status(HttpCode.NOT_FOUND).json({ msg: STANDARD_RESPONSES.ERROR404 });
    }
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

UserDataRouter.get('/all-users', (async (req, res, next) => {
  try {
    const usersList = await UserData.find({}).sort({ created_at: -1 });
    res.status(HttpCode.OK).json(usersList);
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

UserDataRouter.put('/', requireAuthenticationToken, (async (req, res, next) => {
  try {
    const id = req.user?.id;
    const updateUser = req.body;
    if (
      updateUser.avatar_id === undefined ||
      updateUser.avatar_id === null ||
      updateUser.avatar_id.length === 0
    ) {
      delete updateUser.avatar_id;
    }
    logger.info('user-data put api / requested by user: ', id, ' and body ', req.body);
    const result = await UserData.findOneAndUpdate({ _id: id }, updateUser, { new: true });
    logger.info('user-data put api / responed 200 for user: ', id, ' with data: ', result);
    res.status(HttpCode.OK).json({
      msg: 'User data updated successfully',
      result
    });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);

UserDataRouter.put('/:id', (async (req, res, next) => {
  try {
    const id = req.params?.id;
    const updateUser = req.body;
    if (
      updateUser.avatar_id === undefined ||
      updateUser.avatar_id === null ||
      updateUser.avatar_id.length === 0
    ) {
      delete updateUser.avatar_id;
    }
    logger.info('user-data put api / requested for user: ', id, ' and body ', req.body);
    const result = await UserData.findOneAndUpdate({ _id: id }, updateUser, { new: true });
    logger.info('user-data put api / responed 200 for user: ', id, ' with data: ', result);
    res.status(HttpCode.OK).json({
      msg: 'User data updated successfully',
      result
    });
  } catch (error) {
    next(error);
  }
}) as express.RequestHandler);
