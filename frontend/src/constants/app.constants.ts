export const APP_CONFIG = {
  NAME: 'Tile Catalogue',
  WORKSPACE: 'Studio workspace',
  DEFAULT_LOCALE: 'en',
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 12,
  },
  STORAGE_KEYS: {
    COLUMNS: 'tile_catalogue_columns',
    THEME: 'tile_catalogue_theme',
    LOCALE: 'tile_catalogue_locale',
  },
} as const;
