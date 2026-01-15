/**
 * Extracts registration number from input
 * Accepts:
 * 1. Direct registration number: 24bcc7026
 * 2. Email format: amar.24bcc7026@vitapstudent.ac.in
 */
export const extractUsername = (input) => {
  if (!input) return null;
  
  // Check if input is already a registration number (format: digits + letters + digits)
  const directMatch = input.match(/^(\d+[a-zA-Z]+\d+)$/);
  if (directMatch) {
    return directMatch[1];
  }
  
  // Try to extract from email format
  const emailMatch = input.match(/\.(\d+[a-zA-Z]+\d+)@/);
  if (emailMatch) {
    return emailMatch[1];
  }
  
  return null;
};

/**
 * Constructs full email from username
 * Example: 24bcc7026 -> username.24bcc7026@vitapstudent.ac.in
 */
export const constructEmail = (username) => {
  return `user.${username}@vitapstudent.ac.in`;
};
