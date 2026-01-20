import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import './Profile.css';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [formData, setFormData] = useState({
    startingWeight: 0,
    currentWeight: 0,
    targetWeight: 0,
    height: 0,
    dailySynAllowance: 15,
    healthyExtraAAllowance: 1,
    healthyExtraBAllowance: 1,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Conversion helpers
  const kgToStonesPounds = (kg: number) => {
    const totalPounds = kg * 2.20462;
    const stones = Math.floor(totalPounds / 14);
    const pounds = Math.round(totalPounds % 14);
    return { stones, pounds };
  };

  const stonesToKg = (stones: number, pounds: number) => {
    return ((stones * 14) + pounds) / 2.20462;
  };

  const cmToFeetInches = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  const feetInchesToCm = (feet: number, inches: number) => {
    return ((feet * 12) + inches) * 2.54;
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const loadedProfile = response.data.profile;
      setFormData({
        startingWeight: loadedProfile.startingWeight,
        currentWeight: loadedProfile.currentWeight,
        targetWeight: loadedProfile.targetWeight,
        height: loadedProfile.height || 0,
        dailySynAllowance: loadedProfile.dailySynAllowance,
        healthyExtraAAllowance: loadedProfile.healthyExtraAAllowance,
        healthyExtraBAllowance: loadedProfile.healthyExtraBAllowance,
      });
      setIsEditing(!loadedProfile.startingWeight);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await authAPI.updateProfile(formData);
      await loadProfile();
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
            <div className="unit-toggle">
              <label>Unit System:</label>
              <div className="toggle-buttons">
                <button
                  type="button"
                  className={`toggle-btn ${unitSystem === 'metric' ? 'active' : ''}`}
                  onClick={() => setUnitSystem('metric')}
                >
                  Metric (kg, cm)
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${unitSystem === 'imperial' ? 'active' : ''}`}
                  onClick={() => setUnitSystem('imperial')}
                >
                  Imperial (st, lb, ft, in)
                </button>
              </div>
            </div>

            <div className="form-grid">
              {unitSystem === 'metric' ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="form-group-imperial">
                    <label>Starting Weight</label>
                    <div className="imperial-inputs">
                      <input
                        type="number"
                        min="0"
                        placeholder="St"
                        value={formData.startingWeight ? kgToStonesPounds(formData.startingWeight).stones : ''}
                        onChange={(e) => {
                          const stones = parseInt(e.target.value) || 0;
                          const pounds = formData.startingWeight ? kgToStonesPounds(formData.startingWeight).pounds : 0;
                          handleChange('startingWeight', stonesToKg(stones, pounds));
                        }}
                        required
                      />
                      <span>st</span>
                      <input
                        type="number"
                        min="0"
                        max="13"
                        placeholder="Lb"
                        value={formData.startingWeight ? kgToStonesPounds(formData.startingWeight).pounds : ''}
                        onChange={(e) => {
                          const pounds = parseInt(e.target.value) || 0;
                          const stones = formData.startingWeight ? kgToStonesPounds(formData.startingWeight).stones : 0;
                          handleChange('startingWeight', stonesToKg(stones, pounds));
                        }}
                      />
                      <span>lb</span>
                    </div>
                  </div>
                  <div className="form-group-imperial">
                    <label>Current Weight</label>
                    <div className="imperial-inputs">
                      <input
                        type="number"
                        min="0"
                        placeholder="St"
                        value={formData.currentWeight ? kgToStonesPounds(formData.currentWeight).stones : ''}
                        onChange={(e) => {
                          const stones = parseInt(e.target.value) || 0;
                          const pounds = formData.currentWeight ? kgToStonesPounds(formData.currentWeight).pounds : 0;
                          handleChange('currentWeight', stonesToKg(stones, pounds));
                        }}
                        required
                      />
                      <span>st</span>
                      <input
                        type="number"
                        min="0"
                        max="13"
                        placeholder="Lb"
                        value={formData.currentWeight ? kgToStonesPounds(formData.currentWeight).pounds : ''}
                        onChange={(e) => {
                          const pounds = parseInt(e.target.value) || 0;
                          const stones = formData.currentWeight ? kgToStonesPounds(formData.currentWeight).stones : 0;
                          handleChange('currentWeight', stonesToKg(stones, pounds));
                        }}
                      />
                      <span>lb</span>
                    </div>
                  </div>
                  <div className="form-group-imperial">
                    <label>Target Weight</label>
                    <div className="imperial-inputs">
                      <input
                        type="number"
                        min="0"
                        placeholder="St"
                        value={formData.targetWeight ? kgToStonesPounds(formData.targetWeight).stones : ''}
                        onChange={(e) => {
                          const stones = parseInt(e.target.value) || 0;
                          const pounds = formData.targetWeight ? kgToStonesPounds(formData.targetWeight).pounds : 0;
                          handleChange('targetWeight', stonesToKg(stones, pounds));
                        }}
                        required
                      />
                      <span>st</span>
                      <input
                        type="number"
                        min="0"
                        max="13"
                        placeholder="Lb"
                        value={formData.targetWeight ? kgToStonesPounds(formData.targetWeight).pounds : ''}
                        onChange={(e) => {
                          const pounds = parseInt(e.target.value) || 0;
                          const stones = formData.targetWeight ? kgToStonesPounds(formData.targetWeight).stones : 0;
                          handleChange('targetWeight', stonesToKg(stones, pounds));
                        }}
                      />
                      <span>lb</span>
                    </div>
                  </div>
                  <div className="form-group-imperial">
                    <label>Height</label>
                    <div className="imperial-inputs">
                      <input
                        type="number"
                        min="0"
                        placeholder="Ft"
                        value={formData.height ? cmToFeetInches(formData.height).feet : ''}
                        onChange={(e) => {
                          const feet = parseInt(e.target.value) || 0;
                          const inches = formData.height ? cmToFeetInches(formData.height).inches : 0;
                          handleChange('height', feetInchesToCm(feet, inches));
                        }}
                      />
                      <span>ft</span>
                      <input
                        type="number"
                        min="0"
                        max="11"
                        placeholder="In"
                        value={formData.height ? cmToFeetInches(formData.height).inches : ''}
                        onChange={(e) => {
                          const inches = parseInt(e.target.value) || 0;
                          const feet = formData.height ? cmToFeetInches(formData.height).feet : 0;
                          handleChange('height', feetInchesToCm(feet, inches));
                        }}
                      />
                      <span>in</span>
                    </div>
                  </div>
                </>
              )}
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
            <div className="unit-toggle">
              <label>Display units:</label>
              <div className="toggle-buttons">
                <button
                  type="button"
                  className={`toggle-btn ${unitSystem === 'metric' ? 'active' : ''}`}
                  onClick={() => setUnitSystem('metric')}
                >
                  Metric
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${unitSystem === 'imperial' ? 'active' : ''}`}
                  onClick={() => setUnitSystem('imperial')}
                >
                  Imperial
                </button>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Starting Weight:</span>
                <span className="info-value">
                  {unitSystem === 'metric'
                    ? `${formData.startingWeight.toFixed(1)} kg`
                    : `${kgToStonesPounds(formData.startingWeight).stones} st ${kgToStonesPounds(formData.startingWeight).pounds} lb`
                  }
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Current Weight:</span>
                <span className="info-value">
                  {unitSystem === 'metric'
                    ? `${formData.currentWeight.toFixed(1)} kg`
                    : `${kgToStonesPounds(formData.currentWeight).stones} st ${kgToStonesPounds(formData.currentWeight).pounds} lb`
                  }
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Target Weight:</span>
                <span className="info-value">
                  {unitSystem === 'metric'
                    ? `${formData.targetWeight.toFixed(1)} kg`
                    : `${kgToStonesPounds(formData.targetWeight).stones} st ${kgToStonesPounds(formData.targetWeight).pounds} lb`
                  }
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Height:</span>
                <span className="info-value">
                  {formData.height
                    ? unitSystem === 'metric'
                      ? `${formData.height} cm`
                      : `${cmToFeetInches(formData.height).feet} ft ${cmToFeetInches(formData.height).inches} in`
                    : 'Not set'
                  }
                </span>
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
