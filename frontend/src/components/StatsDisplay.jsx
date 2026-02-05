import { useState, useEffect } from 'react';

function StatsDisplay({ user }) {
  const [stats, setStats] = useState(null);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
      loadRank();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/gamification/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRank = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/gamification/rank', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setRank(data);
      }
    } catch (err) {
      console.error('Failed to load rank:', err);
    }
  };

  if (loading || !stats) {
    return <div className="stats-loading">Loading stats...</div>;
  }

  const xpForNextLevel = Math.pow(stats.level, 2) * 100;
  const xpProgress = (stats.experiencePoints % xpForNextLevel) / xpForNextLevel * 100;

  return (
    <div className="stats-display">
      <div className="stats-header">
        <div className="level-badge">
          <span className="level-number">Lv {stats.level}</span>
        </div>
        <div className="xp-info">
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${xpProgress}%` }}></div>
          </div>
          <span className="xp-text">{stats.experiencePoints} XP</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎬</div>
          <div className="stat-value">{stats.totalStreams}</div>
          <div className="stat-label">Streams</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{Math.floor(stats.totalStreamTime / 60)}h</div>
          <div className="stat-label">Stream Time</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{stats.currentStreak}</div>
          <div className="stat-label">Day Streak</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-value">{stats.streamsWatched}</div>
          <div className="stat-label">Watched</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-value">{stats.messagesCount}</div>
          <div className="stat-label">Messages</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{stats.badges.length}</div>
          <div className="stat-label">Badges</div>
        </div>
      </div>

      {rank && (
        <div className="rank-info">
          <div className="rank-badge">
            <span className="rank-icon">🏅</span>
            <span className="rank-text">Rank #{rank.rank}</span>
            <span className="rank-percentile">Top {rank.percentile}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsDisplay;
