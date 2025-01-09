import express from 'express';
import cookierParser from 'cookie-parser';
import dotenv from 'dotenv';
import { routes } from './src/routes/index.routes';
import { connectToDB } from './src/services/mongodb-connection.service';
import cors from 'cors';
import { errorHandler } from './src/middlewares/error.middleware';
import 'express-async-errors';
import { processCrons } from './src/cron';
import { redisClient } from './src/services/redis-connection.service';

const app = express();
// Configuring the env file data
dotenv.config();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookierParser());
app.use('/api', routes);

connectToDB().catch((e) => {
  console.log(e);
});

redisClient
  .connect()
  .then(() => {
    console.log('Connected to Redis');
  })
  .catch((e) => {
    console.log('Error connecting to Redis', e);
  });

processCrons().catch((e) => {
  console.log(e);
});

app.get('/', (req, res) => {
  res.send('All okay!');
});

app.post('/registration', (req, res) => {
  console.log('Registration details: ', req.body);
  res.status(400).send('Problem with registration details');
});

app.listen(3000, () => {
  console.log('Server listening at port 3000');
});

app.use(errorHandler);
