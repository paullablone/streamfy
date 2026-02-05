import { useState, useEffect } from 'react';

function Leaderboard({ user, onBack }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('xp');

  useEffect(() => {
    loadLeaderboard();
  }, [type]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3002/api/gamification/leaderboard/${type}?limit=100`);
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'xp': return 'Experience Points';
      case 'level': return 'Level';
      case 'streams': return 'Total Streams';
      case 'watch-time': return 'Watch Time';
      case 'streak': return 'Current Streak';
      case 'followers': return 'Followers';
      case 'donations': return 'Donations Received';
      default: return 'Leaderboard';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'xp': return '⭐';
      case 'level': return '🎯';
      case 'streams': return '🎬';
      case 'watch-time': return '⏱️';
      case 'streak': return '🔥';
      case 'followers': return '👥';
      case 'donations': return '💰';
      default: return '🏆';
    }
  };

  const formatValue = (value) => {
    if (type === 'watch-time') {
      return `${Math.floor(value / 60)}h ${value % 60}m`;
    }
    return value.toLocaleString();
  };

  const getRankMedal = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>🏆 Leaderboard</h1>
      </div>

      <div className="leaderboard-filters">
        <button 
          className={type === 'xp' ? 'active' : ''}
          onClick={() => setType('xp')}
        >
          ⭐ XP
        </button>
        <button 
          className={type === 'level' ? 'active' : ''}
          onClick={() => setType('level')}
        >
          🎯 Level
        </button>
        <button 
          className={type === 'streams' ? 'active' : ''}
          onClick={() => setType('streams')}
        >
          🎬 Streams
        </button>
        <button 
          className={type === 'watch-time' ? 'active' : ''}
          onClick={() => setType('watch-time')}
        >
          ⏱️ Watch Time
        </button>
        <button 
          className={type === 'streak' ? 'active' : ''}
          onClick={() => setType('streak')}
        >
          🔥 Streak
        </button>
        <button 
          className={type === 'followers' ? 'active' : ''}
          onClick={() => setType('followers')}
        >
          👥 Followers
        </button>
        <button 
          className={type === 'donations' ? 'active' : ''}
          onClick={() => setType('donations')}
        >
          💰 Donations
        </button>
      </div>

      <div className="leaderboard-title">
        <h2>{getTypeIcon()} {getTypeLabel()}</h2>
      </div>

      {loading ? (
        <div className="leaderboard-loading">Loading leaderboard...</div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((entry) => {
            const isCurrentUser = user && entry.userId === user.id;
            
            return (
              <div 
                key={entry.userId} 
                className={`leaderboard-entry ${isCurrentUser ? 'current-user' : ''} ${entry.rank <= 3 ? 'top-three' : ''}`}
              >
                <div className="entry-rank">
                  {getRankMedal(entry.rank)}
                </div>
                <div className="entry-avatar">
                  {entry.username.charAt(0).toUpperCase()}
                </div>
                <div className="entry-info">
                  <div className="entry-username">
                    {entry.username}
                    {isCurrentUser && <span className="you-badge">YOU</span>}
                  </div>
                  <div className="entry-stats">
                    Level {entry.level} • {entry.badges} badges
                  </div>
                </div>
                <div className="entry-value">
                  {formatValue(entry.value)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
