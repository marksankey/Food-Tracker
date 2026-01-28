import { useState, useEffect } from 'react';
import { diaryAPI, authAPI } from '../services/api';
import { DailySummary, UserProfile } from '../types';
import { format } from 'date-fns';
import './Dashboard.css';

const Dashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const today = format(new Date(), 'yyyy-MM-dd');

  // Conversion helpers
  const kgToStonesPounds = (kg: number) => {
    const totalPounds = kg * 2.20462;
    let stones = Math.floor(totalPounds / 14);
    let pounds = Math.round(totalPounds % 14);

    if (pounds === 14) {
      stones += 1;
      pounds = 0;
    }

    return { stones, pounds };
  };

  const formatWeight = (kg: number) => {
    if (unitSystem === 'metric') {
      return `${kg.toFixed(1)} kg`;
    } else {
      const { stones, pounds } = kgToStonesPounds(kg);
      return `${stones} st ${pounds} lb`;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileResponse, summaryResponse] = await Promise.all([
        authAPI.getProfile(),
        diaryAPI.getDailySummary(today)
      ]);
      setProfile(profileResponse.data.profile);
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
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
          <div className="extras-grid extras-grid-3">
            <div className={`extra-item ${summary?.healthyExtraAUsed ? 'used' : ''}`}>
              <span className="extra-label">Calcium</span>
              <span className="extra-count">
                {summary?.healthyExtraACount || 0}/{profile?.healthyExtraAAllowance || 1}
              </span>
              <span className="extra-status">
                {summary?.healthyExtraAUsed ? '✓' : '○'}
              </span>
            </div>
            <div className={`extra-item ${summary?.healthyExtraBUsed ? 'used' : ''}`}>
              <span className="extra-label">Fibre</span>
              <span className="extra-count">
                {summary?.healthyExtraBCount || 0}/{profile?.healthyExtraBAllowance || 1}
              </span>
              <span className="extra-status">
                {summary?.healthyExtraBUsed ? '✓' : '○'}
              </span>
            </div>
            <div className={`extra-item ${summary?.healthyExtraCUsed ? 'used' : ''}`}>
              <span className="extra-label">Healthy Fats</span>
              <span className="extra-count">
                {summary?.healthyExtraCCount || 0}/{profile?.healthyExtraCAllowance || 1}
              </span>
              <span className="extra-status">
                {summary?.healthyExtraCUsed ? '✓' : '○'}
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
          <div className="weight-header">
            <h2>Current Weight</h2>
            <div className="unit-toggle-small">
              <button
                className={`unit-btn ${unitSystem === 'metric' ? 'active' : ''}`}
                onClick={() => setUnitSystem('metric')}
              >
                kg
              </button>
              <button
                className={`unit-btn ${unitSystem === 'imperial' ? 'active' : ''}`}
                onClick={() => setUnitSystem('imperial')}
              >
                st
              </button>
            </div>
          </div>
          <p className="weight-value">{formatWeight(profile?.currentWeight || 0)}</p>
          <p className="weight-target">Target: {formatWeight(profile?.targetWeight || 0)}</p>
          <p className="weight-progress">
            {profile && profile.currentWeight > profile.targetWeight
              ? `${formatWeight(profile.currentWeight - profile.targetWeight)} to go`
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
                <div className="entry-food">
                  {entry.food?.name}
                  {entry.isHealthyExtra && entry.healthyExtraType && (
                    <span className={`badge badge-he badge-he-${entry.healthyExtraType.toLowerCase()}`}>
                      HE-{entry.healthyExtraType === 'A' ? 'Calcium' : entry.healthyExtraType === 'B' ? 'Fibre' : 'Fats'}
                    </span>
                  )}
                </div>
                <div className="entry-syns">
                  {entry.isHealthyExtra ? '0' : entry.synValueConsumed} syns
                </div>
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
