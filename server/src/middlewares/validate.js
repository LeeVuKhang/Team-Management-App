/**
 * Zod Validation Middleware
 * Validates req.body, req.query, and req.params against Zod schemas
 * Security: Prevents malformed data and injection attacks
 */
export const validate = (schemas) => (req, res, next) => {
  try {
    // Validate each part of the request if schema is provided
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    
    next();
  } catch (error) {
    // Format Zod errors for client
    const formattedErrors = error.errors?.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })) || [{ message: error.message }];

    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: formattedErrors,
    });
  }
};