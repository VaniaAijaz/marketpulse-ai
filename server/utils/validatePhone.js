// Validate and format to E.164
const validatePhone = (phone) => {
  if (!phone) return { valid: false, error: 'Phone number required' };

  let cleaned = phone.toString().replace(/\D/g, '');

  // Pakistan number
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  } else if (cleaned.startsWith('3') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }

  // Check length: Pakistan numbers are 12 digits with 92
  if (cleaned.length < 10 || cleaned.length > 15) {
    return { valid: false, error: 'Invalid phone number length' };
  }

  return {
    valid: true,
    formatted: '+' + cleaned,
    national: cleaned.startsWith('92')? '0' + cleaned.slice(2) : cleaned
  };
};

// Simple check without formatting
const isValidPhone = (phone) => {
  const result = validatePhone(phone);
  return result.valid;
};

module.exports = { validatePhone, isValidPhone };