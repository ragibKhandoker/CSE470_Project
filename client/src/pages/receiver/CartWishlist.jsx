import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ReceiverLayout from '../../components/receiver/ReceiverLayout';
import CaptchaWidget from '../../components/common/CaptchaWidget';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';

const authHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  Authorization: `Bearer ${token}`
});

const mealName = (item) => item.food_name || item.title || `${item.food_type || 'Meal'} portions`;

export default function CartWishlist() {
  const { token, user } = useAuth();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [captcha, setCaptcha] = useState({ captchaId: '', captchaAnswer: '', isValid: false });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [cartResponse, wishlistResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/receiver-commerce/cart`, { headers: authHeaders(token) }),
        fetch(`${API_BASE_URL}/receiver-commerce/wishlist`, { headers: authHeaders(token) })
      ]);
      const [cartData, wishlistData] = await Promise.all([cartResponse.json(), wishlistResponse.json()]);
      if (!cartResponse.ok) throw new Error(cartData.message || 'Could not load your cart.');
      if (!wishlistResponse.ok) throw new Error(wishlistData.message || 'Could not load your wishlist.');
      setCart(cartData.data || []);
      setWishlist(wishlistData.data || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.receiver_price_bdt || 0) * Number(item.quantity || 0), 0), [cart]);

  const updateQuantity = async (item, quantity) => {
    if (quantity < 1) return removeCartItem(item.id);
    setBusyId(item.id);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/receiver-commerce/cart/${item.id}`, {
        method: 'PATCH', headers: authHeaders(token, true), body: JSON.stringify({ quantity })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not update this cart item.');
      await loadItems();
    } catch (updateError) { setError(updateError.message); }
    finally { setBusyId(null); }
  };

  const removeCartItem = async (id) => {
    setBusyId(id);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/receiver-commerce/cart/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not remove this cart item.');
      await loadItems();
    } catch (removeError) { setError(removeError.message); }
    finally { setBusyId(null); }
  };

  const moveWishlistItemToCart = async (item) => {
    setBusyId(item.id);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/receiver-commerce/cart`, {
        method: 'POST', headers: authHeaders(token, true),
        body: JSON.stringify({ food_post_id: item.food_post_id, quantity: 1 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not add this meal to your cart.');
      await loadItems();
    } catch (moveError) { setError(moveError.message); }
    finally { setBusyId(null); }
  };

  const removeWishlistItem = async (id) => {
    setBusyId(id);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/receiver-commerce/wishlist/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not remove this meal from your wishlist.');
      await loadItems();
    } catch (removeError) { setError(removeError.message); }
    finally { setBusyId(null); }
  };

  const placePurchaseRequest = async (event) => {
    event.preventDefault();
    if (user?.verification_status !== 'verified') {
      setError('Verify your receiver profile before placing a purchase request.');
      return;
    }
    if (!captcha.captchaId || !captcha.captchaAnswer) {
      setError('Complete the security check to continue.');
      return;
    }
    setBusyId('checkout');
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/receiver-commerce/checkout`, {
        method: 'POST', headers: authHeaders(token, true),
        body: JSON.stringify({ captchaId: captcha.captchaId, captchaAnswer: captcha.captchaAnswer })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not place your purchase request.');
      setCart([]);
      setMessage(`${data.message} Order total: ৳${Number(data.data?.total_bdt || 0).toFixed(2)}.`);
      setCaptcha({ captchaId: '', captchaAnswer: '', isValid: false });
    } catch (checkoutError) { setError(checkoutError.message); }
    finally { setBusyId(null); }
  };

  return (
    <ReceiverLayout title="Cart & Wishlist">
      <div style={{ maxWidth: 620, margin: '0 auto', display: 'grid', gap: 12 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, color: '#2c2320' }}>Your cart & wishlist</h2>
            <p style={{ margin: '6px 0 0', color: '#786d66' }}>Review NGO meal prices and send a purchase request.</p>
          </div>
          <Link to="/receiver/find-food" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>Browse meals</Link>
        </header>

        {error && <div role="alert" style={{ padding: 12, borderRadius: 10, background: '#fef2f2', color: '#b91c1c' }}>{error}</div>}
        {message && <div role="status" style={{ padding: 14, borderRadius: 10, background: '#ecfdf5', color: '#166534', fontWeight: 700 }}>{message} <Link to="/receiver/my-requests">View requests</Link></div>}
        {loading ? <p>Loading your saved meals...</p> : (
          <>
            <section style={{ background: '#fff', border: '1px solid #eee5df', borderRadius: 16, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', color: '#2c2320' }}>Cart ({cart.length})</h3>
              {cart.length === 0 ? <p style={{ color: '#786d66' }}>Your cart is empty.</p> : <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gap: 6, maxHeight: 250, overflowY: 'auto', paddingRight: 4 }}>
                {cart.map((item) => (
                  <article key={item.id} style={{ display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr) auto', alignItems: 'center', gap: 8, borderBottom: '1px solid #eee5df', padding: '5px 0' }}>
                    {item.image_url ? <img src={item.image_url} alt="" style={{ width: 48, height: 42, objectFit: 'cover', borderRadius: 10 }} /> : <div aria-hidden="true" style={{ width: 48, height: 42, display: 'grid', placeItems: 'center', borderRadius: 10, background: '#f7f1eb', fontSize: 26 }}>ðŸ²</div>}
                    <div>
                      <strong>{mealName(item)}</strong>
                      <div style={{ color: '#786d66', fontSize: 13 }}>{item.ngo_name || 'NGO'} Â· {item.pickup_point_name || 'NGO pickup point'}</div>
                      <div style={{ marginTop: 4, color: '#166534', fontWeight: 800 }}>৳{Number(item.receiver_price_bdt).toFixed(2)} per portion</div>
                    </div>
                    <div style={{ display: 'grid', justifyItems: 'end', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button type="button" aria-label="Decrease quantity" disabled={busyId === item.id} onClick={() => updateQuantity(item, Number(item.quantity) - 1)} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', padding: 0, fontSize: 17, lineHeight: 1 }}> &minus; </button>
                        <strong>{item.quantity}</strong>
                        <button type="button" aria-label="Increase quantity" disabled={busyId === item.id} onClick={() => updateQuantity(item, Number(item.quantity) + 1)}>+</button>
                      </div>
                      <strong>৳{(Number(item.receiver_price_bdt) * Number(item.quantity)).toFixed(2)}</strong>
                      <button type="button" onClick={() => removeCartItem(item.id)} disabled={busyId === item.id} style={{ border: 0, background: 'transparent', color: '#b91c1c', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </article>
                ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}><span>Order total</span><span>৳{cartTotal.toFixed(2)}</span></div>
                <p style={{ margin: 0, color: '#786d66', fontSize: 13 }}>This sends a purchase request to the NGO. No online payment is taken here; arrange payment with the NGO.</p>
                <form onSubmit={placePurchaseRequest} style={{ display: 'grid', gap: 8 }}>
                  <CaptchaWidget compact onCaptchaChange={setCaptcha} label="Confirm purchase request" />
                  <button type="submit" disabled={busyId === 'checkout' || cart.length === 0} style={{ border: 0, borderRadius: 10, padding: 10, background: 'var(--brand-primary)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                    {busyId === 'checkout' ? 'Sending request...' : 'Place purchase request'}
                  </button>
                </form>
              </div>}
            </section>

            <section style={{ background: '#fff', border: '1px solid #eee5df', borderRadius: 16, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', color: '#2c2320' }}>Wishlist ({wishlist.length})</h3>
              {wishlist.length === 0 ? <p style={{ color: '#786d66' }}>You have no saved meals yet.</p> : <div style={{ display: 'grid', gap: 12 }}>
                {wishlist.map((item) => (
                  <article key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #eee5df', paddingBottom: 12 }}>
                    <div><strong>{mealName(item)}</strong><div style={{ color: '#166534', fontWeight: 700 }}>৳{Number(item.receiver_price_bdt || 0).toFixed(2)} per portion</div></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => moveWishlistItemToCart(item)} disabled={busyId === item.id || Number(item.receiver_price_bdt) <= 0}>Add to cart</button>
                      <button type="button" onClick={() => removeWishlistItem(item.id)} disabled={busyId === item.id}>Remove</button>
                    </div>
                  </article>
                ))}
              </div>}
            </section>
          </>
        )}
      </div>
    </ReceiverLayout>
  );
}


