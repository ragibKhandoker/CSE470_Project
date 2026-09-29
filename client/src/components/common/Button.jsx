import React from 'react';

/**
 * Reusable Button Component
 */
export const Button = ({ children, variant = 'primary', onClick, type = 'button', className = '', disabled = false }) => {
  // TODO: Add customizable styling & loading spinners
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
