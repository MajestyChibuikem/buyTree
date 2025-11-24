/**
 * Utility functions for WhatsApp integration
 */

/**
 * Formats a phone number for WhatsApp and opens chat
 * @param {string} phone - Phone number (can be with or without country code)
 * @param {string} message - Pre-filled message (optional)
 */
export const openWhatsAppChat = (phone, message = '') => {
  // Remove all non-numeric characters
  let cleanedPhone = phone.replace(/\D/g, '');

  // If phone doesn't start with country code, assume Nigeria (+234)
  if (!cleanedPhone.startsWith('234')) {
    // Remove leading 0 if present (common in Nigeria: 08012345678 -> 8012345678)
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = '234' + cleanedPhone.substring(1);
    } else {
      // If no leading 0, just add country code
      cleanedPhone = '234' + cleanedPhone;
    }
  }

  // Build WhatsApp URL
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
  const whatsappUrl = `https://wa.me/${cleanedPhone}${encodedMessage}`;

  // Open in new window
  window.open(whatsappUrl, '_blank');
};

/**
 * Validates if a phone number is valid for WhatsApp
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const isValidWhatsAppNumber = (phone) => {
  const cleanedPhone = phone.replace(/\D/g, '');
  // Must be at least 10 digits (Nigerian numbers)
  return cleanedPhone.length >= 10;
};

/**
 * Formats a phone number for display
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  const cleanedPhone = phone.replace(/\D/g, '');

  // Nigerian format: +234 812 345 6789
  if (cleanedPhone.startsWith('234') && cleanedPhone.length === 13) {
    return `+234 ${cleanedPhone.substring(3, 6)} ${cleanedPhone.substring(6, 9)} ${cleanedPhone.substring(9)}`;
  }

  // If starts with 0: 0812 345 6789
  if (cleanedPhone.startsWith('0') && cleanedPhone.length === 11) {
    return `${cleanedPhone.substring(0, 4)} ${cleanedPhone.substring(4, 7)} ${cleanedPhone.substring(7)}`;
  }

  // Return as-is if format not recognized
  return phone;
};
