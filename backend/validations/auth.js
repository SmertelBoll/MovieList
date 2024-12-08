import { body } from "express-validator";

export const registerValidation = [
  body("email", "wrong email").isEmail(),
  body("password", "the password must contain at least 5 characters").isLength({ min: 5 }),
  body("fullName", "the name must contain at least 2 characters").isLength({ min: 2 }),
];

export const loginValidation = [
  body("email").isEmail(),
  body("password").isLength({
    min: 5,
  }),
];
