declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production';
    DB_HOST: string;
    PALM_API_KEY: string;
    MAPS_API_KEY: string;
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;
    CHAT_GPT_ORG_ID: string;
    CHAT_GPT_API_KEY: string;
    MSG91_TEMPLATED_ID: string;
    MSG91_AUTH_KEY: string;
    AWS_ACCESS_KEY: string;
    AWS_SECRECT_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_S3_BUCKET_NAME: string;
    MIXPANEL_TOKEN: string;
  }
}
