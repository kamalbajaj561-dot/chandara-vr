export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateEventForm = (formData) => {
  const errors = {};

  if (!formData.title.trim()) {
    errors.title = 'Event name is required';
  }

  if (!formData.description.trim()) {
    errors.description = 'Description is required';
  }

  if (!formData.sport) {
    errors.sport = 'Sport type is required';
  }

  if (!formData.country) {
    errors.country = 'Country is required';
  }

  if (!formData.city) {
    errors.city = 'City is required';
  }

  if (!formData.date) {
    errors.date = 'Date is required';
  }

  if (!formData.time) {
    errors.time = 'Time is required';
  }

  if (!formData.ticketPrice || formData.ticketPrice <= 0) {
    errors.ticketPrice = 'Valid ticket price is required';
  }

  if (!formData.cameraType) {
    errors.cameraType = 'Camera type is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegisterForm = (formData) => {
  const errors = {};

  if (!formData.fullName.trim()) {
    errors.fullName = 'Full name is required';
  }

  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (!validatePassword(formData.password)) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!formData.country) {
    errors.country = 'Country is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
