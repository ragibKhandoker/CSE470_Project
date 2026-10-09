import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';

export default function AdminPoints() {
  const { token } = useAuth();
  const [receivers, setReceivers] = useState([]);
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  const loadReceivers = async () => {
    const response = await fetch(`${API_BASE_URL}/points/admin/receivers`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not load receivers.');
    setReceivers(data.data || []);
  };

  useEffect(() => { loadReceivers().catch((error) => setMessage(error.message)); }, [token]);

  const grantPoints = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/points/admin/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: receiverId, points: amount, note })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not grant points.');
      setMessage(data.message || 'Points added.');
      setAmount('');
      setNote('');
      await loadReceivers();
    } catch (error) { setMessage(error.message); }
  };

  return <AdminLayout title="Receiver Points">
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2>Receiver points</h2>
      <p>1 point is shown as ৳1.00 equivalent. This is an internal platform value, not a money transfer.</p>
      {message && <p role="status">{message}</p>}
      <form onSubmit={grantPoints} style={{ display: 'grid', gap: 12, maxWidth: 520, marginBottom: 28 }}>
        <label>Receiver<select required value={receiverId} onChange={(event) => setReceiverId(event.target.value)} style={{ display: 'block', width: '100%', padding: 10 }}>
          <option value="">Choose a receiver</option>
          {receivers.map((receiver) => <option key={receiver.id} value={receiver.id}>{receiver.name} · #{receiver.id} · {Number(receiver.points_balance || 0).toFixed(2)} points</option>)}
        </select></label>
        <label>Points<input required type="number" min="0.01" max="500000" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} style={{ display: 'block', width: '100%', padding: 10, boxSizing: 'border-box' }} /></label>
        <label>Reason<input required minLength="3" maxLength="240" value={note} onChange={(event) => setNote(event.target.value)} style={{ display: 'block', width: '100%', padding: 10, boxSizing: 'border-box' }} /></label>
        <button type="submit" style={{ padding: 12, border: 0, borderRadius: 8, background: '#b91c1c', color: 'white', fontWeight: 700 }}>Grant points</button>
      </form>
      <h3>Balances</h3>
      {receivers.map((receiver) => <div key={receiver.id} style={{ padding: '10px 0', borderBottom: '1px solid #e5e7eb' }}>{receiver.name} · {receiver.phone} · <strong>{Number(receiver.points_balance || 0).toFixed(2)} points</strong></div>)}
    </div>
  </AdminLayout>;
}
