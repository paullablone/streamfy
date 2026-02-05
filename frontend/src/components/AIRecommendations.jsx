import { useState, useEffect } from 'react';

function AIRecommendations({ user, onVideoClick }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = user 
        ? 'http://localhost:3002/api/recommendations'
        : 'http://localhost:3002/api/recommendations/trending';
      
      const headers = user ? {
        'Authorization': `Bearer ${token}`
      } : {};

      const response = await fetch(endpoint, { headers });
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-recommendations-loading">
        <div className="loading-spinner">🤖</div>
        <p>AI is analyzing your preferences...</p>
      </div>
    );
  }

  return (
    <div className="ai-recommendations-section">
      <div className="ai-recommendations-header">
        <h2>🤖 AI Recommendations</h2>
        <p>{user ? 'Personalized for you' : 'Trending now'}</p>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((rec) => (
          <div 
            key={rec.id} 
            className="recommendation-card"
            onClick={() => onVideoClick && onVideoClick(rec)}
          >
            <div className="recommendation-thumbnail">
              {rec.thumbnail ? (
                <img src={rec.thumbnail} alt={rec.name} />
              ) : (
                <div className="recommendation-placeholder">
                  <span className="placeholder-icon">{rec.icon}</span>
                </div>
              )}
              <div className="recommendation-badge">
                <span className="live-indicator">🔴</span>
                <span>LIVE</span>
              </div>
              <div className="recommendation-viewers">
                👁️ {rec.viewers.toLocaleString()}
              </div>
            </div>

            <div className="recommendation-info">
              <h3>{rec.name}</h3>
              <p className="recommendation-category">
                {rec.icon} {rec.category}
              </p>
              <p className="recommendation-description">{rec.description}</p>
              {rec.reason && (
                <div className="recommendation-reason">
                  <span className="reason-icon">✨</span>
                  <span>{rec.reason}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="refresh-recommendations-btn" onClick={loadRecommendations}>
        🔄 Refresh Recommendations
      </button>
    </div>
  );
}

export default AIRecommendations;
