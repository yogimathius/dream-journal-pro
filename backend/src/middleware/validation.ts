import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const validateSchema = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
        data: { validationErrors: errorMessages },
      };
      res.status(400).json(response);
      return;
    }

    next();
  };
};

// User validation schemas
export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    }),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const userUpdateSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  timezone: Joi.string().optional(),
  avatar: Joi.string().uri().optional(),
  preferences: Joi.object().optional(),
  notificationsEnabled: Joi.boolean().optional(),
  reminderTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

// Dream validation schemas
export const dreamCreateSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).max(10000).required(),
  dreamDate: Joi.date().optional(),
  sleepTime: Joi.date().optional(),
  wakeTime: Joi.date().optional(),
  sleepQuality: Joi.number().integer().min(1).max(10).optional(),
  lucidity: Joi.number().integer().min(1).max(10).optional(),
  vividness: Joi.number().integer().min(1).max(10).optional(),
  mood: Joi.string().max(50).optional(),
  wakeUpMood: Joi.string().max(50).optional(),
  emotions: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  symbols: Joi.array().items(Joi.string().max(50)).max(50).optional(),
  people: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  places: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  themes: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  colors: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  lifeTags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  isDraft: Joi.boolean().optional(),
});

export const dreamUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  content: Joi.string().min(1).max(10000).optional(),
  dreamDate: Joi.date().optional(),
  sleepTime: Joi.date().optional(),
  wakeTime: Joi.date().optional(),
  sleepQuality: Joi.number().integer().min(1).max(10).optional(),
  lucidity: Joi.number().integer().min(1).max(10).optional(),
  vividness: Joi.number().integer().min(1).max(10).optional(),
  mood: Joi.string().max(50).optional(),
  wakeUpMood: Joi.string().max(50).optional(),
  emotions: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  symbols: Joi.array().items(Joi.string().max(50)).max(50).optional(),
  people: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  places: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  themes: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  colors: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  lifeTags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  isDraft: Joi.boolean().optional(),
});

// Query parameter validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const dreamQuerySchema = paginationSchema.keys({
  search: Joi.string().max(100).optional(),
  emotions: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  symbols: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  themes: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
  sortBy: Joi.string().valid('dreamDate', 'createdAt', 'title').default('dreamDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      const response: ApiResponse = {
        success: false,
        error: 'Query validation failed',
        data: { validationErrors: errorMessages },
      };
      res.status(400).json(response);
      return;
    }

    req.query = value;
    next();
  };
};