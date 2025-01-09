import MixPanel from 'mixpanel';
import dotenv from 'dotenv';

dotenv.config();

const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN;

const mixpanel = MixPanel.init(MIXPANEL_TOKEN);

export default mixpanel;
