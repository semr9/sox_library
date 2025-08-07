const patterns = {
  // Alphanumeric uppercase pattern
  alphanumericUppercase: /^[A-Z0-9]+$/,
  
  // Alphanumeric uppercase with special characters
  alphanumericWithSpecial: /^[A-Z0-9_.-]+$/,
  
  // Transaction ID pattern (typically alphanumeric with possible hyphens/underscores)
  transactionId: /^[A-Z0-9_-]+$/
};

export default patterns;
