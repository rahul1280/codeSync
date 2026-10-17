export function validateEmail(email) {
  if (!email || !email.trim()) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return null;
}

export function validatePassword(password) {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

export function validateRoomName(name) {
  if (!name || !name.trim()) {
    return 'Room name is required';
  }
  if (name.trim().length < 3) {
    return 'Room name must be at least 3 characters';
  }
  if (name.trim().length > 50) {
    return 'Room name cannot exceed 50 characters';
  }
  return null;
}
