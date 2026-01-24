import { useState, useEffect } from 'react';
import { weightAPI } from '../services/api';
import { WeightLog } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../store/AuthContext';
import './WeightTracker.css';

const WeightTracker = () => {
  const { profile, updateProfile } = useAuth();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [displayUnit, setDisplayUnit] = useState<'metric' | 'imperial'>('metric');
  const [inputUnit, setInputUnit] = useState<'metric' | 'imperial'>('metric');
  const [stones, setStones] = useState<number>(0);
  const [pounds, setPounds] = useState<number>(0);

  // Conversion helpers
  const kgToStonesPounds = (kg: number) => {
    const totalPounds = kg * 2.20462;
    let stones = Math.floor(totalPounds / 14);
    let pounds = Math.round(totalPounds % 14);

    // Handle rollover: if pounds = 14, that's actually 1 more stone
    if (pounds === 14) {
      stones += 1;
      pounds = 0;
    }

    return { stones, pounds };
  };

  const stonesToKg = (stones: number, pounds: number) => {
    return ((stones * 14) + pounds) / 2.20462;
  };

  const formatWeight = (kg: number) => {
    if (displayUnit === 'metric') {
      return `${kg.toFixed(1)} kg`;
    } else {
      const { stones, pounds } = kgToStonesPounds(kg);
      return `${stones} st ${pounds} lb`;
    }
  };

  useEffect(() => {
    loadWeightLogs();
  }, []);

  const loadWeightLogs = async () => {
    try {
      const response = await weightAPI.getAll();
      const sortedLogs = response.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setWeightLogs(sortedLogs);
    } catch (error) {
      console.error('Failed to load weight logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLog = async () => {
    // Validate input based on unit system
    if (inputUnit === 'metric' && (!weight || weight <= 0)) return;
    if (inputUnit === 'imperial' && (stones === 0 && pounds === 0)) return;

    try {
      // Convert to kg based on input unit
      const weightInKg = inputUnit === 'imperial' ? stonesToKg(stones, pounds) : weight;
      await weightAPI.add({ date, weight: weightInKg, notes });

      // Update the user's profile currentWeight to keep dashboard in sync
      // Only update if this is the most recent entry (date >= all existing dates)
      const isLatestEntry = weightLogs.length === 0 || date >= weightLogs[0].date;
      if (isLatestEntry) {
        await updateProfile({ currentWeight: weightInKg });
      }

      setShowAddModal(false);
      setWeight(0);
      setStones(0);
      setPounds(0);
      setNotes('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setInputUnit('metric'); // Reset to metric
      loadWeightLogs();
    } catch (error) {
      console.error('Failed to add weight log:', error);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) return;

    try {
      await weightAPI.delete(id);

      // If we deleted the most recent entry, update profile with the new most recent weight
      const deletedEntry = weightLogs.find(log => log.id === id);
      if (deletedEntry && weightLogs.length > 0 && deletedEntry.date === weightLogs[0].date) {
        // Get the next most recent entry after deletion
        const remainingLogs = weightLogs.filter(log => log.id !== id);
        if (remainingLogs.length > 0) {
          await updateProfile({ currentWeight: remainingLogs[0].weight });
        }
      }

      loadWeightLogs();
    } catch (error) {
      console.error('Failed to delete weight log:', error);
    }
  };

  const getWeightChange = () => {
    if (weightLogs.length === 0) return null;
    const latest = weightLogs[0].weight;
    // If only 1 entry, compare to profile's startingWeight
    // If 2+ entries, compare to the previous entry
    const previous = weightLogs.length >= 2
      ? weightLogs[1].weight
      : profile?.startingWeight;
    if (!previous) return null;
    return latest - previous;
  };

  const getTotalLoss = () => {
    if (weightLogs.length === 0) return null;
    const latest = weightLogs[0].weight;
    // Use profile's startingWeight if available, otherwise use oldest weight log entry
    const starting = profile?.startingWeight || weightLogs[weightLogs.length - 1].weight;
    // Only show total loss if we have a starting weight to compare against
    if (!starting || starting === latest) return null;
    return starting - latest;
  };

  const weightChange = getWeightChange();
  const totalLoss = getTotalLoss();

  return (
    <div className="container">
      <div className="weight-header">
        <h1>Weight Tracker</h1>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          + Add Weigh-In
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="unit-display-toggle">
            <button
              type="button"
              className={`unit-display-btn ${displayUnit === 'metric' ? 'active' : ''}`}
              onClick={() => setDisplayUnit('metric')}
            >
              Metric (kg)
            </button>
            <button
              type="button"
              className={`unit-display-btn ${displayUnit === 'imperial' ? 'active' : ''}`}
              onClick={() => setDisplayUnit('imperial')}
            >
              Imperial (st/lb)
            </button>
          </div>

          <div className="weight-stats">
            <div className="card stat-card">
              <h3>Current Weight</h3>
              <p className="stat-value">
                {weightLogs.length > 0 ? formatWeight(weightLogs[0].weight) : 'No data'}
              </p>
            </div>
            <div className="card stat-card">
              <h3>Last Change</h3>
              <p className={`stat-value ${weightChange && weightChange < 0 ? 'positive' : 'negative'}`}>
                {weightChange !== null
                  ? displayUnit === 'metric'
                    ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`
                    : (() => {
                        const { stones, pounds } = kgToStonesPounds(Math.abs(weightChange));
                        const sign = weightChange > 0 ? '+' : '-';
                        return `${sign}${stones} st ${pounds} lb`;
                      })()
                  : 'No data'}
              </p>
            </div>
            <div className="card stat-card">
              <h3>Total Loss</h3>
              <p className={`stat-value ${totalLoss && totalLoss > 0 ? 'positive' : 'negative'}`}>
                {totalLoss !== null
                  ? displayUnit === 'metric'
                    ? `${totalLoss.toFixed(1)} kg`
                    : (() => {
                        const { stones, pounds } = kgToStonesPounds(totalLoss);
                        return `${stones} st ${pounds} lb`;
                      })()
                  : 'No data'}
              </p>
            </div>
          </div>

          <div className="card">
            <h2>Weight History</h2>
            <div className="weight-table">
              {weightLogs.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Weight</th>
                      <th>Change</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightLogs.map((log, index) => {
                      const previousWeight = index < weightLogs.length - 1 ? weightLogs[index + 1].weight : null;
                      const change = previousWeight ? log.weight - previousWeight : null;

                      return (
                        <tr key={log.id}>
                          <td>{format(new Date(log.date), 'MMM d, yyyy')}</td>
                          <td>{formatWeight(log.weight)}</td>
                          <td className={change && change < 0 ? 'positive' : 'negative'}>
                            {change !== null
                              ? displayUnit === 'metric'
                                ? `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`
                                : (() => {
                                    const { stones, pounds } = kgToStonesPounds(Math.abs(change));
                                    const sign = change > 0 ? '+' : '-';
                                    return `${sign}${stones} st ${pounds} lb`;
                                  })()
                              : '-'}
                          </td>
                          <td>{log.notes || '-'}</td>
                          <td>
                            <button onClick={() => handleDeleteLog(log.id)} className="btn-delete">
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">No weight entries yet. Add your first weigh-in!</p>
              )}
            </div>
          </div>
        </>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Weigh-In</h2>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <div className="unit-toggle-inline">
                <button
                  type="button"
                  className={`unit-btn ${inputUnit === 'metric' ? 'active' : ''}`}
                  onClick={() => setInputUnit('metric')}
                >
                  kg
                </button>
                <button
                  type="button"
                  className={`unit-btn ${inputUnit === 'imperial' ? 'active' : ''}`}
                  onClick={() => setInputUnit('imperial')}
                >
                  st/lb
                </button>
              </div>
            </div>
            {inputUnit === 'metric' ? (
              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight || ''}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  placeholder="Enter weight"
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Weight</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={stones || ''}
                    onChange={(e) => setStones(parseInt(e.target.value) || 0)}
                    placeholder="St"
                    style={{ flex: 1 }}
                  />
                  <span>st</span>
                  <input
                    type="number"
                    min="0"
                    max="13"
                    value={pounds || ''}
                    onChange={(e) => setPounds(parseInt(e.target.value) || 0)}
                    placeholder="Lb"
                    style={{ flex: 1 }}
                  />
                  <span>lb</span>
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this weigh-in..."
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleAddLog}
                className="btn btn-primary"
                disabled={inputUnit === 'metric' ? (!weight || weight <= 0) : (stones === 0 && pounds === 0)}
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightTracker;
