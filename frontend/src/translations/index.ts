import { en } from './en';

export const translations = {
  en,
};

export type Locale = keyof typeof translations;
export * from './en';
