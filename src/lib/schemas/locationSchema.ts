import Joi from "joi";

// Phone validation to ensure it follows the "2547xxxxxxxx" format
const phoneRegex = /^\+?254\s?\d{3}\s?\d{6}$/;


// password validation to be at least 4 characters, can be numeric
const passwordRegex = /^[a-zA-Z0-9]{4,}$/;


export const createLocationSchema = Joi.object({
  first_name: Joi.string().trim().min(1).required().messages({
    "string.empty": "First name is required",
    "string.min": "First name must be at least 1 character",
    "any.required": "First name is required",
  }),
  last_name: Joi.string().trim().min(1).required().messages({
    "string.empty": "Last name is required",
    "string.min": "Last name must be at least 1 character",
    "any.required": "Last name is required",
  }),
  email: Joi.string().email({ tlds: false }).allow("").messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  phone: Joi.string().regex(phoneRegex).required().messages({
    "string.pattern.base": "Phone number must be in the format 2547xxxxxxxx.",
    "string.empty": "Phone number is required",
    "any.required": "Phone number is required",
  }),
  password: Joi.string().regex(passwordRegex).min(4).required().messages({
    "string.pattern.base": "Password must be at least 4 characters.",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
  
  location_name: Joi.string().trim().min(3).required().messages({
    "string.empty": "Business name is required",
    "string.min": "Business name must be at least 3 characters",
    "any.required": "Business name is required",
  }),

});