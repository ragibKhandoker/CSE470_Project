import React from 'react';

/**
 * Reusable Card Container Component
 */
export const Card = ({ children, title, className = '' }) => {
  // TODO: Add card header/footer sub-components
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 border border-gray-100 ${className}`}>
      {title && <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
