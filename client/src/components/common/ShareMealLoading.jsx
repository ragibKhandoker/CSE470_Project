import React from 'react';

const ShareMealLoading = () => (
  <div className="sharemeal-loading-screen" role="status" aria-label="Loading ShareMeal">
    <div className="sharemeal-loader-mark">
      <span className="sharemeal-loader-ring" />
      <span className="sharemeal-loader-icon" aria-hidden="true">🍲</span>
    </div>
    <div className="sharemeal-loader-brand" aria-hidden="true">
      <span>Share</span><strong>Meal</strong>
    </div>
    <div className="sharemeal-loader-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  </div>
);

export default ShareMealLoading;
