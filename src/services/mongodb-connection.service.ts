import mongoose from 'mongoose';
import { logger } from '../logger/winston.config';

/**
 * Connection to MongoDB.
 */
async function connectToDB(): Promise<void> {
  try {
    if (process.env.DB_HOST !== null) {
      await mongoose.connect(process.env.DB_HOST, {});
      console.log('Connected To DB');
    }
  } catch (error) {
    logger.error({ error });
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB.
 */
async function disconnectDB(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('Disconnected from DB');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

export { connectToDB, disconnectDB };
