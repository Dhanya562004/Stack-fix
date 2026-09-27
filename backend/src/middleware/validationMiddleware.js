const { body, validationResult } = require('express-validator');

const validateAnalyzeInput = [
  body('code')
    .exists({ checkNull: true })
    .withMessage('Source code input is required.')
    .bail()
    .isString()
    .withMessage('Source code must be a string.')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Source code cannot be empty.'),

  body('error')
    .exists({ checkNull: true })
    .withMessage('Error trace or description is required.')
    .bail()
    .isString()
    .withMessage('Error message must be a string.')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Error message cannot be empty.'),

  body('language')
    .optional()
    .isString()
    .withMessage('Language must be a string identifier.'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input payload provided.',
          details: errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg
          }))
        }
      });
    }
    next();
  }
];

module.exports = {
  validateAnalyzeInput
};
