export const CatalogueConstants = {
  DEFAULT_OPTIONS: {
    size: ['600 × 600','600 × 1200','800 × 1600','1200 × 1200','1200 × 2400'],
    collection: ['Marble','Stone','Concrete','Wood'], surface: ['Matt','Polished','Satin'],
    body: ['Porcelain','Ceramic','Full body'], tags: ['New arrival','Bookmatch'], thickness: ['6','8','9','9.5','10','12'],
  },
  MEDIA_CHUNK_BYTES: 3 * 1024 * 1024,
  MAX_BATCH: 100, MAX_MEDIA: 100, MAX_IMAGE_BYTES: 10 * 1024 * 1024, MAX_VIDEO_BYTES: 50 * 1024 * 1024,
  GROUPS: ['size','collection','surface','body','tags','thickness'],
  TEXT_FIELDS: ['name','code','size','collection','surface','body','thickness','extraName','alternateName','bodyDetails','tags','colours','group','description','availableSize','availableCollection','availableSurface','availableBody','availableThickness','hsnCode','url360','status'],
  BOOL_FIELDS: ['showInPdf','private','has360','bookmatch','border','borderShadow','background','inDisplay'],
  STATUSES: ['Active','Inactive','Draft','Archived'],
  MESSAGES: {
    INVALID: 'Check the design details. Name, code, size, collection, surface and thickness are required.',
    CONFLICT: 'A design or option changed in another session, or its code already exists. Reload and try again.',
    OPTION: 'Enter a valid option. Use width × height for sizes and a positive number for thickness.',
    MEDIA: 'Use PNG, JPEG or WebP up to 10 MB, or MP4/WebM up to 50 MB.',
    MISSING_MEDIA: 'This media file could not be found.', LIMIT: 'Save between 1 and 100 designs at a time.', NOT_FOUND: 'The design was not found.',
  },
} as const;
