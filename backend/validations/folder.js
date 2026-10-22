import { body } from "express-validator";

export const folderCreateValidation = [
  body("name", "Folder name must contain between 3 and 100 characters")
    .isLength({ min: 3, max: 100 })
    .isString(),
];
