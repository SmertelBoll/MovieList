import { body } from "express-validator";

export const postCreateValidation = [
  body("title", "Header must contain at least 3 characters").isLength({ min: 3 }).isString(),
  body("text", "Text must contain at least 5 characters").isLength({ min: 5 }).isString(),
  body("tags", "Invalid tag format").optional().isArray(),
];
