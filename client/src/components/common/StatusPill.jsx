import React from 'react';
import { STATUS_COLORS } from '../../utils/constants';

/**
 * Reusable Status Indicator Pill Component
 */
export const StatusPill = ({ status = 'available' }) => {
  const color = STATUS_COLORS[status.toLowerCase()] || '#6B7280';
  
  // TODO: Add icon support for status pills
  return (
    <span
      className="px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider text-white inline-block"
      style={{ backgroundColor: color }}
    >
      {status}
    </span>
  );
};

export default StatusPill;
