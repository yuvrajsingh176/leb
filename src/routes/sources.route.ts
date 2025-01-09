import express from 'express';
import { Sources } from '../models/sources.model';
import { logger } from '../logger/winston.config';

export const SourcesRouter = express.Router();

// Create a new source
SourcesRouter.post('/', (async (req, res, next) => {
  try {
    const newSource = new Sources(req?.body);
    const savedSource = await newSource.save();
    logger.info('New source created:', savedSource);
    res.status(201).json(savedSource);
  } catch (error) {
    logger.error('Error creating new source:', error);
    next(error);
  }
}) as express.RequestHandler);

// Get all sources
SourcesRouter.get('/', (async (req, res, next) => {
  try {
    const sources = await Sources.find({});
    logger.info('All sources retrieved:', sources);
    res.json(sources);
  } catch (error) {
    logger.error('Error retrieving sources:', error);
    next(error);
  }
}) as express.RequestHandler);

// Get a single source by ID
SourcesRouter.get('/:id', (async (req, res, next) => {
  try {
    const source = await Sources.findById(req.params.id);
    if (source === null) {
      return res.status(404).json({ message: 'Source not found' });
    }
    logger.info('Source retrieved by ID:', source);
    res.json(source);
  } catch (error) {
    logger.error('Error retrieving source by ID:', error);
    next(error);
  }
}) as express.RequestHandler);

// Update a source by ID
SourcesRouter.patch('/', (async (req, res, next) => {
  try {
    const source = await Sources.findByIdAndUpdate(req.body._id, req.body, { new: true });
    if (source === null) {
      return res.status(404).json({ message: 'Source not found' });
    }
    logger.info('Source updated by ID:', source);
    res.json(source);
  } catch (error) {
    logger.error('Error updating source by ID:', error);
    next(error);
  }
}) as express.RequestHandler);

// Delete a source by ID
SourcesRouter.delete('/:id', (async (req, res, next) => {
  try {
    const source = await Sources.findByIdAndDelete(req.params.id);
    if (source === null) {
      return res.status(404).json({ message: 'Source not found' });
    }
    logger.info('Source deleted by ID:', source);
    res.json({ message: 'Source deleted successfully' });
  } catch (error) {
    logger.error('Error deleting source by ID:', error);
    next(error);
  }
}) as express.RequestHandler);

export default SourcesRouter;
