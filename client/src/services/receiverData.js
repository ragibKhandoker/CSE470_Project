// Shared receiver helper functions and Bangladeshi defaults

export const BANGLADESH_DEFAULT_LOCATIONS = [
  'Dhanmondi, Dhaka',
  'Banani, Dhaka',
  'Gulshan 2, Dhaka',
  'Uttara Sector 4, Dhaka',
  'Mirpur DOHS, Dhaka',
  'Mohakhali, Dhaka'
];

export const getAnonymousMode = () => {
  const val = localStorage.getItem('sharemeal_receiver_anonymous');
  return val !== null ? val === 'true' : true;
};

export const setAnonymousMode = (enabled) => {
  localStorage.setItem('sharemeal_receiver_anonymous', enabled ? 'true' : 'false');
};
