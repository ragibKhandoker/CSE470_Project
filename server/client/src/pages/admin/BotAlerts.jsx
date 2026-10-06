import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';
import BotAlertCard from '../../components/admin/BotAlertCard';
import TelemetryModal from '../../components/admin/TelemetryModal';
import BotRiskSummary from '../../components/admin/BotRiskSummary';

export const BotAlerts = () => {
  const { token } = useAuth();
  
  // Clean dynamic state — populated directly from PostgreSQL database
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bot-alerts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching bot alerts from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [token]);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bot-alerts/${id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        const data = await res.json();
        setActionSuccess(data.message || 'Action executed successfully');
        const isRevoke = action === 'revoke' || action === 'suspend';
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: isRevoke ? 'revoked' : 'dismissed' } : a))
        );
        setTimeout(() => setActionSuccess(''), 3500);
        setSelectedAlert(null);
      }
    } catch (err) {
      console.error('Error handling alert action:', err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === 'high') return a.riskLevel === 'High Risk' && a.status === 'active';
    if (activeFilter === 'medium') return a.riskLevel === 'Medium Risk' && a.status === 'active';
    if (activeFilter === 'resolved') return a.status === 'dismissed' || a.status === 'revoked' || a.status === 'suspended';
    return true;
  });

  return (
    <AdminLayout title="Bot &amp; Fraud Alerts">
      <div style={{ maxWidth: '1020px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {actionSuccess && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>✓</span> {actionSuccess}
          </div>
        )}

        {/* Database-Driven Risk Metric Cards & Filters */}
        <BotRiskSummary
          alerts={alerts}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px' }}>
            <div style={{ fontSize: '15px', color: '#6b5d56', fontWeight: 600 }}>
              Loading security audit telemetry from database...
            </div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(44, 35, 32, 0.06)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#2c2320' }}>No alerts in this view</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
              All flagged accounts have been resolved or no matching activity found.
            </div>
          </div>
        ) : (
          /* Alert Cards list */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredAlerts.map((alert) => (
              <BotAlertCard
                key={alert.id}
                alert={alert}
                onReview={(a) => setSelectedAlert(a)}
                onDismiss={(id) => handleAction(id, 'dismiss')}
                onRevoke={(id) => handleAction(id, 'revoke')}
                onSuspend={(id) => handleAction(id, 'revoke')}
              />
            ))}
          </div>
        )}

        {/* Telemetry Inspection Modal */}
        {selectedAlert && (
          <TelemetryModal
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
            onDismiss={(id) => handleAction(id, 'dismiss')}
            onRevoke={(id) => handleAction(id, 'revoke')}
            onSuspend={(id) => handleAction(id, 'revoke')}
          />
        )}

      </div>
    </AdminLayout>
  );
};

export default BotAlerts;
