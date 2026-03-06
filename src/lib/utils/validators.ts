// src/lib/utils/validators.ts

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { valid: false, error: 'Email is required' };
  if (!regex.test(email)) return { valid: false, error: 'Invalid email format' };
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, error: 'Password must contain at least one lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, error: 'Password must contain at least one number' };
  if (!/[!@#$%^&*]/.test(password)) return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*)' };
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return { valid: false, error: 'Phone number must be 10 digits' };
  return { valid: true };
}

export function validateSSN(ssn: string): { valid: boolean; error?: string } {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length !== 9) return { valid: false, error: 'SSN must be 9 digits' };
  if (/^(\d)\1+$/.test(cleaned)) return { valid: false, error: 'Invalid SSN format' };
  return { valid: true };
}

export function validateDateOfBirth(dob: string): { valid: boolean; error?: string } {
  if (!dob) return { valid: false, error: 'Date of birth is required' };
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  if (age < 18) return { valid: false, error: 'You must be at least 18 years old' };
  if (age > 120) return { valid: false, error: 'Invalid date of birth' };
  return { valid: true };
}

export function validateAddress(address: {
  street: string;
  city: string;
  state: string;
  zip: string;
}): { valid: boolean; error?: string } {
  if (!address.street) return { valid: false, error: 'Street address is required' };
  if (!address.city) return { valid: false, error: 'City is required' };
  if (!address.state) return { valid: false, error: 'State is required' };
  if (!/^\d{5}(-\d{4})?$/.test(address.zip)) return { valid: false, error: 'Invalid ZIP code' };
  return { valid: true };
}