import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { GOOGLE_SIGN_IN_ENABLED } from '../../utils/constants';

export const GoogleSignInButton = ({ onSuccess, text, style }) => (
  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, ...style }}>
    {GOOGLE_SIGN_IN_ENABLED ? (
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            onSuccess?.(credentialResponse.credential);
          }
        }}
        onError={() => {
          console.error('Google Sign-In failed. Verify the OAuth client ID and authorized origins.');
        }}
        text={text}
        theme="outline"
        shape="pill"
        width="320"
      />
    ) : (
      <p role="status" style={{ maxWidth: 340, margin: 0, color: '#9a3412', fontSize: 13, textAlign: 'center' }}>
        Google sign-in needs a valid OAuth client ID in client/.env and server/.env. Add http://localhost:5173 as an authorized JavaScript origin in Google Cloud Console. Password sign-in is still available.
      </p>
    )}
  </div>
);
