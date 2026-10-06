import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import DonorLayout from '../../components/donor/DonorLayout';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../App.css';

const API_URL = `${API_BASE_URL}/food-posts`;

// Fix Leaflet Default Marker Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customPinIcon = new L.DivIcon({
  className: 'custom-pin-icon',
  html: `<div style="background:#ff6b4a;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(255,107,74,0.5);border:2px solid #ffffff;font-size:16px;">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map Click Handler Component
const LocationMarker = ({ position, setPosition, onLocationChange }) => {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      if (onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return position ? <Marker position={position} icon={customPinIcon} /> : null;
};

const emptyForm = {
  food_name: '',
  food_type: 'Veg',
  quantity: '',
  unit: 'meals',
  expiry_time: '',
  district: 'Dhaka',
  thana: '',
  area_ward: '',
  road_no: '',
  house_no: '',
  floor_flat: '',
  latitude: 23.8103,
  longitude: 90.4125,
  notes: '',
};

export const PostFood = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Multi-Step Wizard: 1 | 2 | 3
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Status & Data states
  const [foodPosts, setFoodPosts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submittedPost, setSubmittedPost] = useState(null);
  const [stepError, setStepError] = useState('');

  // Map position state
  const [mapPosition, setMapPosition] = useState([23.8103, 90.4125]);
  const fileInputRef = useRef(null);

  const loadFoodPosts = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load food posts.');
      setFoodPosts(data.foodPosts || []);
    } catch (error) {
      console.warn('Could not load food posts:', error);
    }
  };

  useEffect(() => {
    loadFoodPosts();
  }, []);

  const changeField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setStepError('');
  };

  // Step 1 -> Step 2 validation
  const handleProceedToStep2 = (e) => {
    if (e) e.preventDefault();
    if (!form.food_name || !form.food_name.trim()) {
      setStepError('Please enter a Food Name (e.g. Chicken Biryani, Bhuna Khichuri, Vegetable Curry).');
      return;
    }
    if (!form.food_type) {
      setStepError('Please select a food category.');
      return;
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      setStepError('Please enter a valid quantity of servings/meals.');
      return;
    }
    setStepError('');
    setCurrentStep(2);
  };

  // Step 2 -> Step 3 validation
  const handleProceedToStep3 = (e) => {
    if (e) e.preventDefault();
    if (!form.expiry_time) {
      setStepError('Please set an expiry date and time.');
      return;
    }
    if (!form.district.trim() || !form.thana.trim()) {
      setStepError('Please provide both District and Thana/Upazila.');
      return;
    }
    setStepError('');
    setCurrentStep(3);
  };

  // Device GPS Auto-Location & Reverse Geocoding
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setStepError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lon = parseFloat(position.coords.longitude.toFixed(6));

        setForm((current) => ({
          ...current,
          latitude: lat,
          longitude: lon,
        }));
        setMapPosition([lat, lon]);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const district = addr.city || addr.state_district || addr.state || 'Dhaka';
            const thana = addr.suburb || addr.town || addr.county || addr.city_district || '';
            const area_ward = addr.neighbourhood || addr.residential || addr.suburb || '';
            const road_no = addr.road || addr.pedestrian || '';

            setForm((current) => ({
              ...current,
              district: district || current.district,
              thana: thana || current.thana,
              area_ward: area_ward || current.area_ward,
              road_no: road_no || current.road_no,
            }));
          }
        } catch (e) {
          console.warn('Reverse geocoding warning:', e);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        alert('Could not detect location: ' + error.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle Photo Drop / Selection
  const handleImageChange = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5 MB. Please select a smaller photo.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  // Final Submission to Backend
  const handleSubmitFoodPost = async (event) => {
    if (event) event.preventDefault();
    setSaving(true);
    setStepError('');

    try {
      const formData = new FormData();
      formData.append('donor_id', user?.id || 1);
      formData.append('food_name', form.food_name ? form.food_name.trim() : '');
      formData.append('title', form.food_name ? form.food_name.trim() : '');
      formData.append('food_type', form.food_type);
      formData.append('quantity', Number(form.quantity));
      formData.append('expiry_time', form.expiry_time);
      formData.append('district', form.district);
      formData.append('thana', form.thana);
      formData.append('area_ward', form.area_ward || '');
      formData.append('road_no', form.road_no || '');
      formData.append('house_no', form.house_no || '');
      formData.append('floor_flat', form.floor_flat || '');
      formData.append('latitude', form.latitude ? form.latitude.toString() : '');
      formData.append('longitude', form.longitude ? form.longitude.toString() : '');
      formData.append('notes', form.notes || '');
      formData.append('status', 'available');

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const isEditing = Boolean(editingId);
      const endpoint = isEditing ? `${API_URL}/${editingId}` : API_URL;

      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save food post.');

      setSubmittedPost(data.foodPost || form);
      setStatus(isEditing ? 'Food post updated successfully!' : 'Food post published successfully!');
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview(null);
      setEditingId(null);
      await loadFoodPosts();
    } catch (error) {
      setStepError(error.message || 'Could not save food post.');
    } finally {
      setSaving(false);
    }
  };

  const startEditPost = (post) => {
    setEditingId(post.id);
    setForm({
      food_name: post.food_name || post.title || '',
      food_type: post.food_type || 'Veg',
      quantity: post.quantity || '',
      unit: 'meals',
      expiry_time: post.expiry_time ? new Date(post.expiry_time).toISOString().slice(0, 16) : '',
      district: post.district || 'Dhaka',
      thana: post.thana || '',
      area_ward: post.area_ward || '',
      road_no: post.road_no || '',
      house_no: post.house_no || '',
      floor_flat: post.floor_flat || '',
      latitude: post.latitude ? parseFloat(post.latitude) : 23.8103,
      longitude: post.longitude ? parseFloat(post.longitude) : 90.4125,
      notes: post.notes || '',
    });
    if (post.latitude && post.longitude) {
      setMapPosition([parseFloat(post.latitude), parseFloat(post.longitude)]);
    }
    if (post.image_url) {
      setImagePreview(post.image_url);
    }
    setSubmittedPost(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteFoodPost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this food post?')) return;
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not delete food post.');
      await loadFoodPosts();
    } catch (error) {
      alert(error.message || 'Could not delete food post.');
    }
  };

  const isVerified = user?.verification_status === 'verified';

  return (
    <DonorLayout title="Post New Food">
      <div style={{ width: '100%', maxWidth: '780px', margin: '0 auto', padding: '10px 0 60px' }}>

        {/* Super Admin Verification Guard Modal */}
        {!isVerified && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              padding: '36px',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              border: '1px solid #fed7aa'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#fff7ed',
                border: '2px solid #fdba74',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '34px',
                margin: '0 auto 20px'
              }}>
                🛡️
              </div>
              <h3 style={{ margin: '0 0 10px', fontSize: '22px', fontWeight: 800, color: '#9a3412' }}>
                Account Verification Required
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6b5d56', lineHeight: 1.6 }}>
                Please wait until Super Admin verification is complete before posting food. To speed up verification, ensure your National ID (NID) document is uploaded in your profile.
              </p>
              <div style={{
                background: '#fef2f2',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '24px',
                border: '1px solid #fecaca',
                fontSize: '13px',
                color: '#991b1b',
                fontWeight: 600
              }}>
                Current Status: <span style={{ textTransform: 'capitalize' }}>{user?.verification_status || 'Pending'}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/donor/profile')}
                  style={{
                    background: '#ff6b4a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(255,107,74,0.35)'
                  }}
                >
                  Go to Profile to Upload NID →
                </button>
                <button
                  onClick={() => navigate('/donor')}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            1. TOP STEPPER (From Figma Node 8:23820, 8:25925, 8:26084)
        ======================================================== */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          
          {/* Step 1 Pill */}
          <div 
            onClick={() => setCurrentStep(1)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentStep >= 1 ? '#ff6b4a' : 'rgba(44, 35, 32, 0.08)',
              color: currentStep >= 1 ? '#ffffff' : '#6b5d56',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 800,
              boxShadow: currentStep === 1 ? '0 4px 12px rgba(255, 107, 74, 0.35)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span style={{ fontSize: '14px', fontWeight: currentStep === 1 ? 700 : 500, color: currentStep === 1 ? '#2c2320' : '#6b5d56' }}>
              Food Info
            </span>
          </div>

          <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}>&gt;</span>

          {/* Step 2 Pill */}
          <div 
            onClick={() => { if (form.quantity) setCurrentStep(2); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: form.quantity ? 'pointer' : 'default' }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentStep >= 2 ? '#ff6b4a' : 'rgba(44, 35, 32, 0.08)',
              color: currentStep >= 2 ? '#ffffff' : '#6b5d56',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 800,
              boxShadow: currentStep === 2 ? '0 4px 12px rgba(255, 107, 74, 0.35)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <span style={{ fontSize: '14px', fontWeight: currentStep === 2 ? 700 : 500, color: currentStep === 2 ? '#2c2320' : '#6b5d56' }}>
              Pickup Details
            </span>
          </div>

          <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}>&gt;</span>

          {/* Step 3 Pill */}
          <div 
            onClick={() => { if (form.quantity && form.expiry_time) setCurrentStep(3); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: (form.quantity && form.expiry_time) ? 'pointer' : 'default' }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentStep >= 3 ? '#ff6b4a' : 'rgba(44, 35, 32, 0.08)',
              color: currentStep >= 3 ? '#ffffff' : '#6b5d56',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 800,
              boxShadow: currentStep === 3 ? '0 4px 12px rgba(255, 107, 74, 0.35)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              3
            </div>
            <span style={{ fontSize: '14px', fontWeight: currentStep === 3 ? 700 : 500, color: currentStep === 3 ? '#2c2320' : '#6b5d56' }}>
              Photo &amp; Notes
            </span>
          </div>

        </div>

        {/* Error Notification Bar */}
        {stepError && (
          <div style={{ background: '#fde8e8', color: '#991b1b', padding: '12px 18px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>{stepError}</span>
          </div>
        )}

        {/* ========================================================
            SUCCESS CELEBRATION CARD
        ======================================================== */}
        {submittedPost && (
          <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid #dcfce7', padding: '36px', textAlign: 'center', marginBottom: '32px', boxShadow: '0 12px 36px rgba(16, 185, 129, 0.12)' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 800, color: '#166534', margin: '0 0 8px' }}>
              Food Donation Published!
            </h2>
            <p style={{ color: '#4b5563', fontSize: '14px', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Your donation of <strong>{submittedPost.quantity} servings of {submittedPost.food_type}</strong> in {submittedPost.district || 'Dhaka'} is now live and available on the community map for verified receivers and NGOs.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSubmittedPost(null)}
                style={{ background: '#ff6b4a', color: '#ffffff', border: 0, padding: '12px 24px', borderRadius: '100px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255, 107, 74, 0.35)' }}
              >
                + Post Another Meal
              </button>
              <button
                type="button"
                onClick={() => navigate('/donor/dashboard')}
                style={{ background: '#f3f4f6', color: '#374151', border: 0, padding: '12px 24px', borderRadius: '100px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                Go to Dashboard →
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            MAIN MULTI-STEP CARD
        ======================================================== */}
        {!submittedPost && (
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            boxShadow: '0 12px 36px rgba(44, 35, 32, 0.05), 0 2px 6px rgba(44, 35, 32, 0.02)',
            overflow: 'hidden'
          }}>

            {/* Step Header */}
            <div style={{ padding: '24px 32px 18px', borderBottom: '1px solid #f7f2ef' }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2c2320', margin: 0 }}>
                {currentStep === 1 && (editingId ? 'Update your food post' : 'What are you sharing?')}
                {currentStep === 2 && 'Pickup details'}
                {currentStep === 3 && 'Add a photo & notes'}
              </h2>
            </div>

            <div style={{ padding: '28px 32px 36px' }}>

              {/* ----------------------------------------------------
                  STEP 1: FOOD INFO (From Figma Node 8:23820)
              ---------------------------------------------------- */}
              {currentStep === 1 && (
                <div>
                  
                  {/* Food Name / Dish Title Field */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#2c2320', marginBottom: '8px' }}>
                      Food Name / Dish Title *
                    </label>
                    <input
                      type="text"
                      name="food_name"
                      value={form.food_name || ''}
                      onChange={changeField}
                      placeholder="e.g. Chicken Biryani with Salad, Bhuna Khichuri, Vegetable Curry..."
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(44, 35, 32, 0.15)',
                        background: 'rgba(253, 241, 233, 0.3)',
                        fontSize: '15px',
                        color: '#2c2320',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#8c7e75', marginTop: '4px', display: 'block' }}>
                      Enter a clear dish title so receivers and NGO staff know exactly what food is being donated.
                    </span>
                  </div>

                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#2c2320', marginBottom: '12px' }}>
                    Food Type
                  </label>

                  {/* 3 Figma Cards: Veg | Non-veg | Cooked */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px', marginBottom: '28px' }}>
                    
                    {/* Veg Card */}
                    <div
                      onClick={() => setForm((curr) => ({ ...curr, food_type: 'Veg' }))}
                      style={{
                        background: '#eaf7ed',
                        border: form.food_type === 'Veg' ? '2.5px solid #27ae60' : '2px solid transparent',
                        borderRadius: '16px',
                        padding: '24px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transform: form.food_type === 'Veg' ? 'scale(1.02)' : 'none',
                        boxShadow: form.food_type === 'Veg' ? '0 8px 20px rgba(39, 174, 96, 0.2)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#27ae60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 10px rgba(39, 174, 96, 0.3)' }}>
                        🥗
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#2c2320' }}>
                        Veg
                      </span>
                    </div>

                    {/* Non-veg Card */}
                    <div
                      onClick={() => setForm((curr) => ({ ...curr, food_type: 'Non-veg' }))}
                      style={{
                        background: '#fdeee9',
                        border: form.food_type === 'Non-veg' ? '2.5px solid #e74c3c' : '2px solid transparent',
                        borderRadius: '16px',
                        padding: '24px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transform: form.food_type === 'Non-veg' ? 'scale(1.02)' : 'none',
                        boxShadow: form.food_type === 'Non-veg' ? '0 8px 20px rgba(231, 76, 60, 0.2)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)' }}>
                        🍲
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#2c2320' }}>
                        Non-veg
                      </span>
                    </div>

                    {/* Cooked Card */}
                    <div
                      onClick={() => setForm((curr) => ({ ...curr, food_type: 'Cooked' }))}
                      style={{
                        background: '#fef3d6',
                        border: form.food_type === 'Cooked' ? '2.5px solid #e67e22' : '2px solid transparent',
                        borderRadius: '16px',
                        padding: '24px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transform: form.food_type === 'Cooked' ? 'scale(1.02)' : 'none',
                        boxShadow: form.food_type === 'Cooked' ? '0 8px 20px rgba(230, 126, 34, 0.2)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#e67e22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 10px rgba(230, 126, 34, 0.3)' }}>
                        🍛
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#2c2320' }}>
                        Cooked
                      </span>
                    </div>

                  </div>

                  {/* Quantity with Unit Selector */}
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#2c2320', marginBottom: '8px' }}>
                      Quantity *
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        min="1"
                        name="quantity"
                        value={form.quantity}
                        onChange={changeField}
                        placeholder="e.g. 12"
                        required
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '1px solid rgba(44, 35, 32, 0.15)',
                          background: 'rgba(253, 241, 233, 0.3)',
                          fontSize: '15px',
                          color: '#2c2320',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <select
                        name="unit"
                        value={form.unit}
                        onChange={changeField}
                        style={{
                          width: '120px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid rgba(44, 35, 32, 0.15)',
                          background: 'rgba(253, 241, 233, 0.3)',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#2c2320',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="meals">meals</option>
                        <option value="kg">kg</option>
                        <option value="packets">packets</option>
                        <option value="servings">servings</option>
                      </select>
                    </div>
                  </div>

                  {/* Action */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
                    <button
                      type="button"
                      onClick={handleProceedToStep2}
                      style={{
                        background: '#ff6b4a',
                        color: '#ffffff',
                        border: 0,
                        padding: '12px 32px',
                        borderRadius: '100px',
                        fontSize: '15px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(255, 107, 74, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Continue →
                    </button>
                  </div>

                </div>
              )}

              {/* ----------------------------------------------------
                  STEP 2: PICKUP DETAILS (From Figma Node 8:25925)
              ---------------------------------------------------- */}
              {currentStep === 2 && (
                <div>
                  
                  {/* Expiry Window */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#2c2320', marginBottom: '8px' }}>
                      Expiry / Pickup Window *
                    </label>
                    <input
                      type="datetime-local"
                      name="expiry_time"
                      value={form.expiry_time}
                      onChange={changeField}
                      min={new Date().toISOString().slice(0, 16)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(44, 35, 32, 0.15)',
                        background: 'rgba(253, 241, 233, 0.3)',
                        fontSize: '14px',
                        color: '#2c2320',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Location Header & GPS Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 700, color: '#2c2320', margin: 0 }}>
                      📍 Exact Pickup Address Details *
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={gpsLoading}
                      style={{
                        background: form.latitude ? '#059669' : '#ff684e',
                        color: '#ffffff',
                        border: 0,
                        borderRadius: '10px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      {gpsLoading ? '⏳ Detecting GPS...' : form.latitude ? '✅ Location Auto-Filled' : '📍 Auto-Fill From Real GPS Location'}
                    </button>
                  </div>

                  {/* Address Grid Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6b5d56', marginBottom: '4px' }}>
                        District *
                      </label>
                      <input
                        type="text"
                        name="district"
                        value={form.district}
                        onChange={changeField}
                        placeholder="e.g. Dhaka"
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(44, 35, 32, 0.15)', background: 'rgba(253, 241, 233, 0.3)', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6b5d56', marginBottom: '4px' }}>
                        Thana / Upazila *
                      </label>
                      <input
                        type="text"
                        name="thana"
                        value={form.thana}
                        onChange={changeField}
                        placeholder="e.g. Dhanmondi, Gulshan, Mirpur"
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(44, 35, 32, 0.15)', background: 'rgba(253, 241, 233, 0.3)', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6b5d56', marginBottom: '4px' }}>
                        Area / Ward
                      </label>
                      <input
                        type="text"
                        name="area_ward"
                        value={form.area_ward}
                        onChange={changeField}
                        placeholder="e.g. Ward 15, Green Road"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(44, 35, 32, 0.15)', background: 'rgba(253, 241, 233, 0.3)', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6b5d56', marginBottom: '4px' }}>
                        Road No.
                      </label>
                      <input
                        type="text"
                        name="road_no"
                        value={form.road_no}
                        onChange={changeField}
                        placeholder="e.g. Road 4/A"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(44, 35, 32, 0.15)', background: 'rgba(253, 241, 233, 0.3)', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6b5d56', marginBottom: '4px' }}>
                        House No. / Building
                      </label>
                      <input
                        type="text"
                        name="house_no"
                        value={form.house_no}
                        onChange={changeField}
                        placeholder="e.g. House 12"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(44, 35, 32, 0.15)', background: 'rgba(253, 241, 233, 0.3)', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#6b5d56', marginBottom: '4px' }}>
                        Floor / Flat No.
                      </label>
                      <input
                        type="text"
                        name="floor_flat"
                        value={form.floor_flat}
                        onChange={changeField}
                        placeholder="e.g. 3rd Floor, Flat B-3"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(44, 35, 32, 0.15)', background: 'rgba(253, 241, 233, 0.3)', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* Leaflet Interactive Mini Map Preview (From Figma Node 8:25925) */}
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b5d56' }}>
                        🗺️ Map Pin Preview (Click map to adjust pin position)
                      </span>
                      {form.latitude && form.longitude && (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                          GPS: {form.latitude}, {form.longitude}
                        </span>
                      )}
                    </div>
                    <div style={{ height: '180px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <MapContainer
                        center={mapPosition}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution="&copy; OpenStreetMap"
                        />
                        <LocationMarker
                          position={mapPosition}
                          setPosition={setMapPosition}
                          onLocationChange={(lat, lon) => {
                            setForm((curr) => ({ ...curr, latitude: lat.toFixed(6), longitude: lon.toFixed(6) }));
                          }}
                        />
                      </MapContainer>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      style={{
                        background: 'transparent',
                        color: '#c8391b',
                        border: '1px solid #ffa286',
                        padding: '10px 24px',
                        borderRadius: '100px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToStep3}
                      style={{
                        background: '#ff6b4a',
                        color: '#ffffff',
                        border: 0,
                        padding: '12px 32px',
                        borderRadius: '100px',
                        fontSize: '15px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(255, 107, 74, 0.35)'
                      }}
                    >
                      Continue →
                    </button>
                  </div>

                </div>
              )}

              {/* ----------------------------------------------------
                  STEP 3: PHOTO & NOTES (From Figma Node 8:26084)
              ---------------------------------------------------- */}
              {currentStep === 3 && (
                <div>
                  
                  {/* Photo Upload Dropzone */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#2c2320', marginBottom: '8px' }}>
                      Food Photo
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleImageChange(e.target.files[0])}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />

                    {!imagePreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        style={{
                          background: 'rgba(255, 243, 239, 0.5)',
                          border: '2px dashed #ffc7b6',
                          borderRadius: '16px',
                          padding: '36px 20px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontSize: '36px', marginBottom: '8px' }}>📸</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#2c2320', marginBottom: '4px' }}>
                          Drop a photo or click to upload
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c7e77' }}>
                          JPG, PNG up to 5 MB
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#faf5f2', border: '1px solid #eee5e0', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img
                          src={imagePreview}
                          alt="Food Preview"
                          style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#2c2320' }}>
                            {imageFile?.name || 'Selected Food Photo'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b5d56', marginTop: '2px' }}>
                            {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Ready to upload'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          style={{ background: '#fde8e8', color: '#dc2626', border: 0, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notes Field */}
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#2c2320', marginBottom: '8px' }}>
                      Notes (optional)
                    </label>
                    <textarea
                      rows={3}
                      name="notes"
                      value={form.notes}
                      onChange={changeField}
                      placeholder="e.g. Contains nuts, vegan-friendly, best consumed same day..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(44, 35, 32, 0.15)',
                        background: 'rgba(253, 241, 233, 0.3)',
                        fontSize: '14px',
                        color: '#2c2320',
                        outline: 'none',
                        boxSizing: 'border-box',
                        lineHeight: 1.6
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      style={{
                        background: 'transparent',
                        color: '#c8391b',
                        border: '1px solid #ffa286',
                        padding: '10px 24px',
                        borderRadius: '100px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      disabled={saving || !isVerified}
                      onClick={handleSubmitFoodPost}
                      style={{
                        background: isVerified ? '#ff6b4a' : '#cbd5e1',
                        color: '#ffffff',
                        border: 0,
                        padding: '12px 36px',
                        borderRadius: '100px',
                        fontSize: '15px',
                        fontWeight: 700,
                        cursor: isVerified ? 'pointer' : 'not-allowed',
                        boxShadow: isVerified ? '0 8px 20px rgba(255, 107, 74, 0.35)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>✈️</span>
                      <span>
                        {!isVerified
                          ? 'Profile Verification Pending'
                          : saving
                          ? 'Publishing...'
                          : editingId
                          ? 'Update Food Post'
                          : 'Post Food'}
                      </span>
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* ========================================================
            PREVIOUS DONATION POSTS (Management Section)
        ======================================================== */}
        <section style={{ marginTop: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2c2320', margin: 0 }}>
              Your food posts ({foodPosts.length})
            </h3>
            <button
              onClick={loadFoodPosts}
              type="button"
              style={{ background: '#f3f4f6', border: 0, padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#4b5563', cursor: 'pointer' }}
            >
              🔄 Refresh
            </button>
          </div>

          {foodPosts.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '32px', textAlign: 'center', color: '#8c7e77', border: '1px solid #f1edeb' }}>
              No food posts yet. Use the 3-step wizard above to post your first surplus meal.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {foodPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    border: '1px solid #f1edeb',
                    padding: '20px 24px',
                    boxShadow: '0 4px 14px rgba(44, 35, 32, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: post.food_type === 'Veg' ? '#eaf7ed' : post.food_type === 'Non-veg' ? '#fdeee9' : '#fef3d6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px'
                    }}>
                      {post.food_type === 'Veg' ? '🥗' : post.food_type === 'Non-veg' ? '🍲' : '🍛'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#2c2320' }}>
                          {post.food_type} ({post.quantity} Servings)
                        </span>
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '100px' }}>
                          {post.status || 'available'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c7e77', marginTop: '4px' }}>
                        📍 {[post.thana, post.district].filter(Boolean).join(', ') || 'Dhaka'} · ⏰ Expires: {new Date(post.expiry_time).toLocaleString()}
                      </div>
                      {post.notes && (
                        <div style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic', marginTop: '4px' }}>
                          "{post.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => startEditPost(post)}
                      style={{ background: '#f3f4f6', color: '#374151', border: 0, padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFoodPost(post.id)}
                      style={{ background: '#fde8e8', color: '#dc2626', border: 0, padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </section>

      </div>
    </DonorLayout>
  );
};

export default PostFood;
