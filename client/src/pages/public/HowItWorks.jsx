import React from 'react';

export const HowItWorks = () => {
  // TODO: Build interactive step-by-step workflow guide
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">How ShareMeal Works</h1>
      <ol className="list-decimal pl-6 space-y-4 text-gray-600">
        <li><strong>Donors</strong> post surplus food details, quantity, and pickup times.</li>
        <li><strong>NGOs</strong> request and claim available food collections.</li>
        <li><strong>Receivers</strong> claim individual meals or request NGO assistance.</li>
        <li><strong>Admins</strong> verify organizations and ensure food safety compliance.</li>
      </ol>
    </div>
  );
};

export default HowItWorks;
