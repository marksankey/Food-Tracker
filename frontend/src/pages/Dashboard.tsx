import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { diaryAPI } from '../services/api';
import { DailySummary } from '../types';
import { format } from 'date-fns';
import './Dashboard.css';

const Dashboard = () => {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadDailySummary();
  }, []);

  const loadDailySummary = async () => {
    try {
      const response = await diaryAPI.getDailySummary(today);
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load daily summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="container">Loading...</div>;
  }

  const dailySynAllowance = profile?.dailySynAllowance || 15;
  const synsUsed = summary?.totalSyns || 0;
  const synsRemaining = dailySynAllowance - synsUsed;
  const percentageUsed = (synsUsed / dailySynAllowance) * 100;

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div className="dashboard-grid">
        <div className="card syn-tracker">
          <h2>Today's Syns</h2>
          <div className="syn-progress">
            <div className="syn-circle">
              <div className="syn-number">
                <span className="syn-value">{synsUsed}</span>
                <span className="syn-total">/ {dailySynAllowance}</span>
              </div>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${percentageUsed > 100 ? 'over-limit' : ''}`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              ></div>
            </div>
            <p className={`syn-remaining ${synsRemaining < 0 ? 'over-limit' : ''}`}>
              {synsRemaining >= 0
                ? `${synsRemaining} syns remaining`
                : `${Math.abs(synsRemaining)} syns over limit`}
            </p>
          </div>
        </div>

        <div className="card healthy-extras">
          <h2>Healthy Extras</h2>
          <div className="extras-grid">
            <div className={`extra-item ${summary?.healthyExtraAUsed ? 'used' : ''}`}>
              <span className="extra-label">A (Dairy)</span>
              <span className="extra-status">
                {summary?.healthyExtraAUsed ? '✓' : '○'}
              </span>
            </div>
            <div className={`extra-item ${summary?.healthyExtraBUsed ? 'used' : ''}`}>
              <span className="extra-label">B (Fiber)</span>
              <span className="extra-status">
                {summary?.healthyExtraBUsed ? '✓' : '○'}
              </span>
            </div>
          </div>
        </div>

        <div className="card speed-foods">
          <h2>Speed Foods</h2>
          <p className="speed-count">{summary?.speedFoodsCount || 0} portions today</p>
          <p className="speed-tip">Aim for at least 1/3 of each meal</p>
        </div>

        <div className="card weight-summary">
          <h2>Current Weight</h2>
          <p className="weight-value">{profile?.currentWeight || 0} kg</p>
          <p className="weight-target">Target: {profile?.targetWeight || 0} kg</p>
          <p className="weight-progress">
            {profile && profile.currentWeight > profile.targetWeight
              ? `${(profile.currentWeight - profile.targetWeight).toFixed(1)} kg to go`
              : 'Target reached!'}
          </p>
        </div>
      </div>

      <div className="card recent-entries">
        <h2>Today's Entries</h2>
        {summary && summary.entries.length > 0 ? (
          <div className="entries-list">
            {summary.entries.map((entry) => (
              <div key={entry.id} className="entry-item">
                <div className="entry-meal">{entry.mealType}</div>
                <div className="entry-food">{entry.food?.name}</div>
                <div className="entry-syns">{entry.synValueConsumed} syns</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-entries">No entries for today. Start tracking your meals!</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
