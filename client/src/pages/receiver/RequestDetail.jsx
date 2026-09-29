import React from 'react';
import { useParams } from 'react-router-dom';

export const RequestDetail = () => {
  const { id } = useParams();

  // TODO: Render request details, assigned NGO contact, and pickup instructions
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Request Detail (ID: {id})</h1>
      <p className="text-gray-600">View status, location, and collection code.</p>
    </div>
  );
};

export default RequestDetail;
