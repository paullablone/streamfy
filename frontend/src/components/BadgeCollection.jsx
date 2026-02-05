import { useState, useEffect } from 'react';

function BadgeCollection({ user }) {
  const [allBadges, setAllBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadBadges();
  }, [user]);

  const loadBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load all badges
      const allResponse = await fetch('http://localhost:3002/api/gamification/badges');
      const allData = await allResponse.json();
      
      // Load user's earned badges
      const userResponse = await fetch('http://localhost:3002/api/gamification/my-badges', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const userData = await userResponse.json();
      
      if (allData.success) {
        setAllBadges(allData.badges);
      }
      if (userData.success) {
        setUserBadges(userData.badges);
      }
    } catch (err) {
      console.error('Failed to load badges:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#94a3b8';
      case 'rare': return '#3b82f6';
      case 'epic': return '#a855f7';
      case 'legendary': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const isEarned = (badgeId) => {
    return userBadges.some(b => b.badgeId === badgeId);
  };

  const filteredBadges = filter === 'all' 
    ? allBadges 
    : filter === 'earned'
    ? allBadges.filter(b => isEarned(b.badgeId))
    : allBadges.filter(b => b.category === filter);

  if (loading) {
    return <div className="badges-loading">Loading badges...</div>;
  }

  return (
    <div className="badge-collection">
      <div className="badge-header">
        <h2>🏆 Badge Collection</h2>
        <p>{userBadges.length} / {allBadges.length} Earned</p>
      </div>

      <div className="badge-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'earned' ? 'active' : ''}
          onClick={() => setFilter('earned')}
        >
          Earned
        </button>
        <button 
          className={filter === 'streaming' ? 'active' : ''}
          onClick={() => setFilter('streaming')}
        >
          Streaming
        </button>
        <button 
          className={filter === 'viewing' ? 'active' : ''}
          onClick={() => setFilter('viewing')}
        >
          Viewing
        </button>
        <button 
          className={filter === 'social' ? 'active' : ''}
          onClick={() => setFilter('social')}
        >
          Social
        </button>
        <button 
          className={filter === 'engagement' ? 'active' : ''}
          onClick={() => setFilter('engagement')}
        >
          Engagement
        </button>
      </div>

      <div className="badges-grid">
        {filteredBadges.map((badge) => {
          const earned = isEarned(badge.badgeId);
          const earnedBadge = userBadges.find(b => b.badgeId === badge.badgeId);
          
          return (
            <div 
              key={badge.badgeId} 
              className={`badge-card ${earned ? 'earned' : 'locked'}`}
              style={{ borderColor: earned ? getRarityColor(badge.rarity) : '#e5e7eb' }}
            >
              <div 
                className="badge-icon"
                style={{ 
                  background: earned ? badge.color : '#f3f4f6',
                  filter: earned ? 'none' : 'grayscale(100%)'
                }}
              >
                {badge.icon}
              </div>
              <div className="badge-info">
                <h3>{badge.name}</h3>
                <p className="badge-description">{badge.description}</p>
                <div className="badge-meta">
                  <span 
                    className="badge-rarity"
                    style={{ color: getRarityColor(badge.rarity) }}
                  >
                    {badge.rarity.toUpperCase()}
                  </span>
                  {earned && earnedBadge && (
                    <span className="badge-earned-date">
                      {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {!earned && (
                  <div className="badge-requirement">
                    🔒 {badge.requirement}: {badge.requiredValue}
                  </div>
                )}
                {earned && (
                  <div className="badge-xp">
                    +{badge.xpReward} XP
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BadgeCollection;
