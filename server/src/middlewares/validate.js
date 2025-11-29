export const validate = (schema) => (req, res, next) => {
  try {
    // Validates body, query, and params against the Zod schema
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: error.errors,
    });
  }
};