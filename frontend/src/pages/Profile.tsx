import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(!profile?.startingWeight);
  const [formData, setFormData] = useState({
    startingWeight: profile?.startingWeight || 0,
    currentWeight: profile?.currentWeight || 0,
    targetWeight: profile?.targetWeight || 0,
    height: profile?.height || 0,
    dailySynAllowance: profile?.dailySynAllowance || 15,
    healthyExtraAAllowance: profile?.healthyExtraAAllowance || 1,
    healthyExtraBAllowance: profile?.healthyExtraBAllowance || 1,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        startingWeight: profile.startingWeight,
        currentWeight: profile.currentWeight,
        targetWeight: profile.targetWeight,
        height: profile.height || 0,
        dailySynAllowance: profile.dailySynAllowance,
        healthyExtraAAllowance: profile.healthyExtraAAllowance,
        healthyExtraBAllowance: profile.healthyExtraBAllowance,
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChange = (field: string, value: number) => {
    setFormData({ ...formData, [field]: value });
  };

  const getBMI = () => {
    if (!formData.height || !formData.currentWeight) return null;
    const heightInMeters = formData.height / 100;
    return (formData.currentWeight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const bmi = getBMI();

  return (
    <div className="container">
      <h1>Profile</h1>

      <div className="card profile-info">
        <h2>Account Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Name:</span>
            <span className="info-value">{user?.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Health Profile</h2>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn btn-primary">
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Starting Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.startingWeight || ''}
                  onChange={(e) => handleChange('startingWeight', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.currentWeight || ''}
                  onChange={(e) => handleChange('currentWeight', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Target Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.targetWeight || ''}
                  onChange={(e) => handleChange('targetWeight', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => handleChange('height', parseFloat(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Daily Syn Allowance</label>
                <input
                  type="number"
                  min="5"
                  max="20"
                  value={formData.dailySynAllowance}
                  onChange={(e) => handleChange('dailySynAllowance', parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Healthy Extra A Allowance</label>
                <input
                  type="number"
                  min="1"
                  max="2"
                  value={formData.healthyExtraAAllowance}
                  onChange={(e) => handleChange('healthyExtraAAllowance', parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Healthy Extra B Allowance</label>
                <input
                  type="number"
                  min="1"
                  max="2"
                  value={formData.healthyExtraBAllowance}
                  onChange={(e) => handleChange('healthyExtraBAllowance', parseInt(e.target.value))}
                  required
                />
              </div>
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <div className="form-actions">
              <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-display">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Starting Weight:</span>
                <span className="info-value">{formData.startingWeight} kg</span>
              </div>
              <div className="info-item">
                <span className="info-label">Current Weight:</span>
                <span className="info-value">{formData.currentWeight} kg</span>
              </div>
              <div className="info-item">
                <span className="info-label">Target Weight:</span>
                <span className="info-value">{formData.targetWeight} kg</span>
              </div>
              <div className="info-item">
                <span className="info-label">Height:</span>
                <span className="info-value">{formData.height ? `${formData.height} cm` : 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">BMI:</span>
                <span className="info-value">{bmi || 'Not available'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Daily Syn Allowance:</span>
                <span className="info-value">{formData.dailySynAllowance} syns</span>
              </div>
              <div className="info-item">
                <span className="info-label">Healthy Extra A:</span>
                <span className="info-value">{formData.healthyExtraAAllowance} per day</span>
              </div>
              <div className="info-item">
                <span className="info-label">Healthy Extra B:</span>
                <span className="info-value">{formData.healthyExtraBAllowance} per day</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
