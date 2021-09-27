import { body } from "express-validator";

//MEDIA VALIDATION
export const mediaValidation = [
  body("Title")
    .isLength({ min: 1 })
    .withMessage("Title has to be minimum 1 character"),
  body("Year")
    .isLength({ min: 4 })
    .withMessage("Year has to be minimum 4 characters"),
  body("Type")
    .isLength({ min: 5 })
    .withMessage("Type has to be minimum 5 characters"),
];

//REVIEW VALIDATION
export const reviewsValidation = [
  body("comment")
    .isLength({ min: 10 })
    .withMessage("The Comment has to be minimum 10 character"),
  body("rate")
    .isFloat({ min: 1, max: 5 })
    .withMessage("The rate has to be a numeric value between 1 and 5."),
];
