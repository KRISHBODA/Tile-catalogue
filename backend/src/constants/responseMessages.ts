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

  // Domain - Auth / RBAC
  LOGIN_SUCCESS: 'Logged in successfully.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  UNAUTHORIZED: 'Authentication required. Please provide a valid token.',
  FORBIDDEN: 'Access denied. You do not have the required permissions.',
  ACCOUNT_INACTIVE: 'Your account is inactive or suspended. Please contact Super Admin.',
  USER_NOT_FOUND: 'User account not found.',
} as const;
