export const ResponseMessages = {
  // Generic
  SUCCESS: 'Operation completed successfully.',
  CREATED: 'Resource created successfully.',
  UPDATED: 'Resource updated successfully.',
  DELETED: 'Resource deleted successfully.',
  NOT_FOUND: 'Requested resource was not found.',
  BAD_REQUEST: 'Invalid request payload or parameters.',
  INTERNAL_ERROR: 'An unexpected internal server error occurred.',
  ROUTE_NOT_FOUND: 'The requested route does not exist.',

  // Domain - Product / Tile
  PRODUCT_NOT_FOUND: 'Product not found with the provided identifier.',
  PRODUCT_CREATE_FAILED: 'Failed to create product due to invalid input.',
  PRODUCT_SLUG_EXISTS: 'A product with this slug already exists.',
} as const;
