import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { GOOGLE_SIGN_IN_ENABLED } from '../../utils/constants';

export const GoogleSignInButton = ({ onSuccess, text, style }) => {
  const [error, setError] = useState('');
  const helpText = 'Check that the same Web application OAuth client ID is set in client/.env and server/.env, and that http://localhost:5173 is an authorized JavaScript origin in Google Cloud Console.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16, ...style }}>
      {GOOGLE_SIGN_IN_ENABLED ? (
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            setError('');
            if (credentialResponse.credential) {
              onSuccess?.(credentialResponse.credential);
            }
          }}
          onError={() => {
            console.error('Google Sign-In failed. Verify the OAuth client ID and authorized origins.');
            setError(`Google sign-in failed. ${helpText}`);
          }}
          text={text}
          theme="outline"
          shape="pill"
          width="320"
        />
      ) : (
        <p role="status" style={{ maxWidth: 340, margin: 0, color: '#9a3412', fontSize: 13, textAlign: 'center' }}>
          Google sign-in needs a real Web application OAuth client ID. {helpText} Password sign-in is still available.
        </p>
      )}
      {error && (
        <p role="alert" style={{ maxWidth: 340, margin: '10px 0 0', color: '#9a3412', fontSize: 13, textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
};
