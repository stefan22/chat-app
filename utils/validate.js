const { isEmail, isEmpty } = require('../helpers');

const validateSignup = data => {
  let errors = {};
  // email field
  if (isEmpty(data.email)) {
    errors.email = 'Email field cannot be empty';
  } else if (!isEmail(data.email)) {
    errors.email = 'Must be a valid email address';
  }

  // password field
  if (isEmpty(data.password)) {
    errors.password = 'Password field cannot be empty';
  }

  if (isEmpty(data.confirmPassword)) {
    errors.confirmPassword = 'Confirm password field cannot be empty';
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // user field
  if (isEmpty(data.user)) {
    errors.user = 'User field cannot be empty';
  }
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };

};

const validateLogin = data => {
  let errors = {};
  if (isEmpty(data.email)) {
    errors.email = 'Email field cannot be empty';
  }
  if (isEmpty(data.password)) {
    errors.password = 'Password field cannot be empty';
  }
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };

};

module.exports = { validateSignup, validateLogin };
