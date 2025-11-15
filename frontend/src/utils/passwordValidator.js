/**
 * Password Validation Utility
 * Validates password strength requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

export function validatePassword(password) {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const isValid = Object.values(requirements).every(req => req === true);

  return {
    isValid,
    requirements,
    score: Object.values(requirements).filter(req => req).length
  };
}

export function getPasswordStrengthLabel(score) {
  switch (score) {
    case 5:
      return 'Strong 💪';
    case 4:
      return 'Good ✓';
    case 3:
      return 'Fair ⚠️';
    case 2:
      return 'Weak ❌';
    default:
      return 'Very Weak ❌';
  }
}

export function getPasswordStrengthColor(score) {
  switch (score) {
    case 5:
      return '#4caf50'; // Green
    case 4:
      return '#8bc34a'; // Light Green
    case 3:
      return '#ff9800'; // Orange
    case 2:
      return '#ff5722'; // Deep Orange
    default:
      return '#f44336'; // Red
  }
}
