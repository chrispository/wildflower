// This file contains environment-specific configuration
const config = {
  // Remove publicUrl since we're using direct paths now
  // publicUrl: process.env.REACT_APP_PUBLIC_URL || '',
  
  // Keep other config values if they exist
  baseUrl: process.env.REACT_APP_BASE_URL || '',
  apiUrl: process.env.REACT_APP_API_URL || '/api',
};

export default config; 