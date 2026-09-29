import React from 'react';
import { useParams } from 'react-router-dom';

export const DonationDetail = () => {
  const { id } = useParams();

  // TODO: Fetch and display specific donation listing details and status timeline
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Donation Details (ID: {id})</h1>
      <p className="text-gray-600">View status, claimed NGO info, and pickup schedule.</p>
    </div>
  );
};

export default DonationDetail;
