import { useState, useEffect } from 'react';
import { weightAPI } from '../services/api';
import { WeightLog } from '../types';
import { format } from 'date-fns';
import './WeightTracker.css';

const WeightTracker = () => {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [displayUnit, setDisplayUnit] = useState<'metric' | 'imperial'>('metric');
  const [inputUnit, setInputUnit] = useState<'metric' | 'imperial'>('metric');

  // Conversion helpers
  const kgToLbs = (kg: number) => kg * 2.20462;
  const lbsToKg = (lbs: number) => lbs / 2.20462;

  const formatWeight = (kg: number) => {
    if (displayUnit === 'metric') {
      return `${kg.toFixed(1)} kg`;
    } else {
      return `${kgToLbs(kg).toFixed(1)} lbs`;
    }
  };

  useEffect(() => {
    loadWeightLogs();
  }, []);

  const loadWeightLogs = async () => {
    try {
      const response = await weightAPI.getAll();
      setWeightLogs(response.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Failed to load weight logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLog = async () => {
    if (!weight || weight <= 0) return;

    try {
      // Convert to kg if imperial
      const weightInKg = inputUnit === 'imperial' ? lbsToKg(weight) : weight;
      await weightAPI.add({ date, weight: weightInKg, notes });
      setShowAddModal(false);
      setWeight(0);
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
      loadWeightLogs();
    } catch (error) {
      console.error('Failed to delete weight log:', error);
    }
  };

  const getWeightChange = () => {
    if (weightLogs.length < 2) return null;
    const latest = weightLogs[0].weight;
    const previous = weightLogs[1].weight;
    return latest - previous;
  };

  const getTotalLoss = () => {
    if (weightLogs.length < 2) return null;
    const latest = weightLogs[0].weight;
    const starting = weightLogs[weightLogs.length - 1].weight;
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
              Imperial (lbs)
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
                  ? `${weightChange > 0 ? '+' : ''}${displayUnit === 'metric' ? weightChange.toFixed(1) + ' kg' : kgToLbs(weightChange).toFixed(1) + ' lbs'}`
                  : 'No data'}
              </p>
            </div>
            <div className="card stat-card">
              <h3>Total Loss</h3>
              <p className={`stat-value ${totalLoss && totalLoss > 0 ? 'positive' : 'negative'}`}>
                {totalLoss !== null
                  ? `${displayUnit === 'metric' ? totalLoss.toFixed(1) + ' kg' : kgToLbs(totalLoss).toFixed(1) + ' lbs'}`
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
                              ? `${change > 0 ? '+' : ''}${displayUnit === 'metric' ? change.toFixed(1) + ' kg' : kgToLbs(change).toFixed(1) + ' lbs'}`
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
                  lbs
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Weight ({inputUnit === 'metric' ? 'kg' : 'lbs'})</label>
              <input
                type="number"
                step="0.1"
                value={weight || ''}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                placeholder="Enter weight"
              />
            </div>
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
              <button onClick={handleAddLog} className="btn btn-primary" disabled={!weight || weight <= 0}>
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
