// Frontend Configuration for UnlimitedHealth
// This file can be used by both Expo app and web app

const ENV = process.env.NODE_ENV || 'development';

const config = {
  development: {
    API_BASE_URL: 'http://localhost:3000/api',
    WEB_SOCKET_URL: 'ws://localhost:3000',
    SUPABASE_URL: 'https://your-dev-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-dev-supabase-anon-key',
    GOOGLE_MAPS_API_KEY: 'your-dev-google-maps-api-key',
    TWILIO_ACCOUNT_SID: 'your-dev-twilio-account-sid',
    TWILIO_AUTH_TOKEN: 'your-dev-twilio-auth-token',
    TWILIO_PHONE_NUMBER: 'your-dev-twilio-phone-number',
  },
  staging: {
    API_BASE_URL: 'https://api-staging.8tfs.onrender.com/api',
    WEB_SOCKET_URL: 'wss://api-staging.8tfs.onrender.com',
    SUPABASE_URL: 'https://your-staging-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-staging-supabase-anon-key',
    GOOGLE_MAPS_API_KEY: 'your-staging-google-maps-api-key',
    TWILIO_ACCOUNT_SID: 'your-staging-twilio-account-sid',
    TWILIO_AUTH_TOKEN: 'your-staging-twilio-auth-token',
    TWILIO_PHONE_NUMBER: 'your-staging-twilio-phone-number',
  },
  production: {
    API_BASE_URL: 'https://api.8tfs.onrender.com/api',
    WEB_SOCKET_URL: 'wss://api.8tfs.onrender.com',
    SUPABASE_URL: 'https://your-prod-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-prod-supabase-anon-key',
    GOOGLE_MAPS_API_KEY: 'your-prod-google-maps-api-key',
    TWILIO_ACCOUNT_SID: 'your-prod-twilio-account-sid',
    TWILIO_AUTH_TOKEN: 'your-prod-twilio-auth-token',
    TWILIO_PHONE_NUMBER: 'your-prod-twilio-phone-number',
  },
};

// API Endpoints
const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },

  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    UPLOAD_AVATAR: '/users/avatar',
  },

  // Patients
  PATIENTS: {
    LIST: '/patients',
    CREATE: '/patients',
    DETAILS: (id) => `/patients/${id}`,
    UPDATE: (id) => `/patients/${id}`,
    DELETE: (id) => `/patients/${id}`,
    MEDICAL_RECORDS: (id) => `/patients/${id}/medical-records`,
  },

  // Medical Records
  MEDICAL_RECORDS: {
    LIST: '/medical-records',
    CREATE: '/medical-records',
    DETAILS: (id) => `/medical-records/${id}`,
    UPDATE: (id) => `/medical-records/${id}`,
    DELETE: (id) => `/medical-records/${id}`,
    SHARE: (id) => `/medical-records/${id}/share`,
    VERSIONS: (id) => `/medical-records/${id}/versions`,
  },

  // Appointments
  APPOINTMENTS: {
    LIST: '/appointments',
    CREATE: '/appointments',
    DETAILS: (id) => `/appointments/${id}`,
    UPDATE: (id) => `/appointments/${id}`,
    DELETE: (id) => `/appointments/${id}`,
    CANCEL: (id) => `/appointments/${id}/cancel`,
    RESCHEDULE: (id) => `/appointments/${id}/reschedule`,
  },

  // Centers
  CENTERS: {
    LIST: '/centers',
    CREATE: '/centers',
    DETAILS: (id) => `/centers/${id}`,
    UPDATE: (id) => `/centers/${id}`,
    DELETE: (id) => `/centers/${id}`,
    DOCTORS: (id) => `/centers/${id}/doctors`,
    SERVICES: (id) => `/centers/${id}/services`,
  },

  // Chat
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    MESSAGES: (conversationId) => `/chat/conversations/${conversationId}/messages`,
    SEND_MESSAGE: (conversationId) => `/chat/conversations/${conversationId}/messages`,
    MARK_READ: (conversationId) => `/chat/conversations/${conversationId}/read`,
  },

  // Video Conferencing
  VIDEO: {
    CREATE_ROOM: '/video/create-room',
    JOIN_ROOM: (roomId) => `/video/rooms/${roomId}/join`,
    LEAVE_ROOM: (roomId) => `/video/rooms/${roomId}/leave`,
    ROOM_STATUS: (roomId) => `/video/rooms/${roomId}/status`,
  },

  // Emergency Services
  EMERGENCY: {
    ALERT: '/emergency/alert',
    AMBULANCE: '/emergency/ambulance',
    NEARBY_HOSPITALS: '/emergency/nearby-hospitals',
    TRACK_AMBULANCE: (ambulanceId) => `/emergency/ambulance/${ambulanceId}/track`,
  },

  // Blood Donation
  BLOOD_DONATION: {
    DONORS: '/blood-donation/donors',
    REQUESTS: '/blood-donation/requests',
    CREATE_REQUEST: '/blood-donation/requests',
    DONATE: '/blood-donation/donate',
    NEARBY_DONORS: '/blood-donation/nearby-donors',
  },

  // Equipment Marketplace
  EQUIPMENT: {
    LIST: '/equipment-marketplace',
    CREATE: '/equipment-marketplace',
    DETAILS: (id) => `/equipment-marketplace/${id}`,
    UPDATE: (id) => `/equipment-marketplace/${id}`,
    DELETE: (id) => `/equipment-marketplace/${id}`,
    PURCHASE: (id) => `/equipment-marketplace/${id}/purchase`,
    RENT: (id) => `/equipment-marketplace/${id}/rent`,
  },

  // AI Assistant
  AI: {
    CHAT: '/ai/chat',
    MEDICAL_ANALYSIS: '/ai/medical-analysis',
    IMAGE_ANALYSIS: '/ai/image-analysis',
    SYMPTOM_CHECKER: '/ai/symptom-checker',
    DRUG_INTERACTION: '/ai/drug-interaction',
  },

  // Reviews & Ratings
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    UPDATE: (id) => `/reviews/${id}`,
    DELETE: (id) => `/reviews/${id}`,
    CENTER_REVIEWS: (centerId) => `/centers/${centerId}/reviews`,
    DOCTOR_REVIEWS: (doctorId) => `/doctors/${doctorId}/reviews`,
  },

  // Location Services
  LOCATION: {
    NEARBY_CENTERS: '/location/nearby-centers',
    NEARBY_PHARMACIES: '/location/nearby-pharmacies',
    NEARBY_LABS: '/location/nearby-labs',
    ROUTE_TO_CENTER: (centerId) => `/location/route-to-center/${centerId}`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
    SETTINGS: '/notifications/settings',
  },

  // Admin
  ADMIN: {
    USERS: '/admin/users',
    CENTERS: '/admin/centers',
    VERIFICATION_REQUESTS: '/admin/centers/verification-requests',
    ANALYTICS: '/admin/analytics',
    REPORTS: '/admin/reports',
  },

  // Health Check
  HEALTH: '/health',
};

// Helper function to get full API URL
const getApiUrl = (endpoint) => {
  const baseUrl = config[ENV].API_BASE_URL;
  return `${baseUrl}${endpoint}`;
};

// Helper function to get WebSocket URL
const getWebSocketUrl = () => {
  return config[ENV].WEB_SOCKET_URL;
};

// Helper function to get Supabase URL
const getSupabaseUrl = () => {
  return config[ENV].SUPABASE_URL;
};

// Helper function to get Supabase Anon Key
const getSupabaseAnonKey = () => {
  return config[ENV].SUPABASE_ANON_KEY;
};

// Helper function to get Google Maps API Key
const getGoogleMapsApiKey = () => {
  return config[ENV].GOOGLE_MAPS_API_KEY;
};

// Helper function to get Twilio credentials
const getTwilioCredentials = () => {
  return {
    accountSid: config[ENV].TWILIO_ACCOUNT_SID,
    authToken: config[ENV].TWILIO_AUTH_TOKEN,
    phoneNumber: config[ENV].TWILIO_PHONE_NUMBER,
  };
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js/CommonJS
  module.exports = {
    config: config[ENV],
    API_ENDPOINTS,
    getApiUrl,
    getWebSocketUrl,
    getSupabaseUrl,
    getSupabaseAnonKey,
    getGoogleMapsApiKey,
    getTwilioCredentials,
    ENV,
  };
} else {
  // Browser/ES6
  window.UnlimitedHealthConfig = {
    config: config[ENV],
    API_ENDPOINTS,
    getApiUrl,
    getWebSocketUrl,
    getSupabaseUrl,
    getSupabaseAnonKey,
    getGoogleMapsApiKey,
    getTwilioCredentials,
    ENV,
  };
} 