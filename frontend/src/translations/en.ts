import enJson from './en.json';

export const en = enJson;

export type TranslationDictionary = typeof enJson;

export type Leaves<T> = T extends object
  ? { [K in keyof T]: `${Exclude<K, symbol>}${Leaves<T[K]> extends never ? '' : `.${Leaves<T[K]>}`}` }[keyof T]
  : never;

export type TranslationKey = Leaves<TranslationDictionary>;
