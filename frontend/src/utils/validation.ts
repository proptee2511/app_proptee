export const passwordHelp =
  'Use 8–128 characters with uppercase, lowercase, a number and a special character. No spaces.';

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])\S{8,128}$/;

export function getPasswordError(
  password: string,
  confirmPassword: string,
): string {
  if (!passwordRegex.test(password)) {
    return passwordHelp;
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return '';
}