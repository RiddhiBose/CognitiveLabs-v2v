// Reusable validation utilities

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isValidPassword = (password: string): boolean => {
  // Minimum 8 characters, at least one letter and one number
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
};

export const getPasswordStrength = (
  password: string,
): { strength: 'weak' | 'medium' | 'strong'; message: string } => {
  if (password.length < 8) return { strength: 'weak', message: 'Too short (min 8 characters)' };
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  const score = [hasLetter, hasNumber, hasSpecial, hasUpper, password.length >= 12].filter(
    Boolean,
  ).length;

  if (score <= 2) return { strength: 'weak', message: 'Weak password' };
  if (score <= 3) return { strength: 'medium', message: 'Medium strength' };
  return { strength: 'strong', message: 'Strong password' };
};

export const isValidAge = (age: number): boolean => {
  return age >= 13 && age <= 100;
};

export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

export const countWords = (text: string): number => {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
};

export const isWithinWordLimit = (text: string, limit: number): boolean => {
  return countWords(text) <= limit;
};

export const validateRequired = (value: string | null | undefined, fieldName: string): string | null => {
  if (!value || value.trim() === '') return `${fieldName} is required`;
  return null;
};
