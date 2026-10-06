/**
 * Application Constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id.apps.googleusercontent.com';

export const ROLES = {
  DONOR: 'donor',
  NGO: 'ngo',
  RECEIVER: 'receiver',
  ADMIN: 'admin'
};

export const STATUS_COLORS = {
  available: '#10B981',   // Green
  pending: '#F59E0B',     // Amber
  reserved: '#3B82F6',    // Blue
  collected: '#8B5CF6',   // Purple
  completed: '#059669',   // Emerald
  expired: '#EF4444',     // Red
  rejected: '#DC2626'      // Dark Red
};

export const FOOD_POST_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  COLLECTED: 'collected',
  COMPLETED: 'completed',
  EXPIRED: 'expired'
};
