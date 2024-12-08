import { body } from "express-validator";

export const commentCreateValidation = [
  body("text").isLength({ min: 3 }).isString(),
  // body("postId")
];
