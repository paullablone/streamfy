import { useState, useEffect } from 'react';

function OfflinePlayback({ user, onBack, onVideoClick }) {
  const [offlineContent, setOfflineContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    loadOfflineContent();
  }, []);

  const loadOfflineContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/offline', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setOfflineContent(data.content);
        const size = data.content.reduce((sum, item) => sum + (item.fileSize || 0), 0);
        setTotalSize(size);
      }
    } catch (err) {
      console.error('Failed to load offline content:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (contentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/offline/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setOfflineContent(offlineContent.filter(item => item._id !== contentId));
        loadOfflineContent(); // Refresh to update total size
      }
    } catch (err) {
      console.error('Failed to delete content:', err);
    }
  };

  const clearAll = async () => {
    if (!confirm('Are you sure you want to delete all offline content?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/offline/clear/all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setOfflineContent([]);
        setTotalSize(0);
        alert('All offline content cleared!');
      }
    } catch (err) {
      console.error('Failed to clear content:', err);
    }
  };

  const formatSize = (mb) => {
    if (mb < 1024) return `${mb.toFixed(0)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatExpiry = (date) => {
    const now = new Date();
    const expiry = new Date(date);
    const diffMs = expiry - now;
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  return (
    <div className="offline-playback-page">
      <div className="offline-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="offline-title">
          <h1>📥 Offline Playback</h1>
          <p>Watch your saved content anytime, anywhere</p>
        </div>
      </div>

      <div className="offline-stats">
        <div className="offline-stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <div className="stat-value">{offlineContent.length}</div>
            <div className="stat-label">Saved Videos</div>
          </div>
        </div>
        <div className="offline-stat-card">
          <div className="stat-icon">💾</div>
          <div className="stat-info">
            <div className="stat-value">{formatSize(totalSize)}</div>
            <div className="stat-label">Total Size</div>
          </div>
        </div>
        <div className="offline-stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <div className="stat-value">7 Days</div>
            <div className="stat-label">Storage Period</div>
          </div>
        </div>
      </div>

      {offlineContent.length > 0 && (
        <div className="offline-actions">
          <button className="clear-all-btn" onClick={clearAll}>
            🗑️ Clear All
          </button>
        </div>
      )}

      {loading ? (
        <div className="offline-loading">Loading offline content...</div>
      ) : offlineContent.length === 0 ? (
        <div className="offline-empty">
          <div className="empty-icon">📥</div>
          <h2>No Offline Content</h2>
          <p>Save videos for offline viewing to watch them anytime without internet</p>
          <div className="offline-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Watch without internet</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Save up to 7 days</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Choose quality</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="offline-content-list">
          {offlineContent.map((item) => (
            <div key={item._id} className="offline-content-card">
              <div 
                className="offline-thumbnail"
                onClick={() => onVideoClick && onVideoClick(item)}
              >
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.channelName} />
                ) : (
                  <div className="offline-placeholder">
                    <span className="placeholder-icon">{item.channelIcon || '📺'}</span>
                  </div>
                )}
                <div className="offline-badge">
                  <span>📥</span>
                  <span>OFFLINE</span>
                </div>
                <div className="quality-badge">{item.quality.toUpperCase()}</div>
              </div>

              <div className="offline-info">
                <h3 
                  onClick={() => onVideoClick && onVideoClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  {item.channelName}
                </h3>
                <div className="offline-meta">
                  <span className="offline-category">
                    {item.channelIcon} {item.channelCategory}
                  </span>
                  <span className="offline-size">{formatSize(item.fileSize)}</span>
                </div>
                <div className="offline-expiry">
                  <span className="expiry-icon">⏱️</span>
                  <span>{formatExpiry(item.expiresAt)}</span>
                </div>
              </div>

              <button 
                className="delete-offline-btn"
                onClick={() => deleteContent(item._id)}
                title="Delete offline content"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="offline-info-section">
        <h3>About Offline Playback</h3>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">📥</div>
            <h4>Save for Later</h4>
            <p>Download videos to watch without internet connection</p>
          </div>
          <div className="info-card">
            <div className="info-icon">⏱️</div>
            <h4>7-Day Storage</h4>
            <p>Content expires after 7 days for licensing compliance</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🎬</div>
            <h4>Quality Options</h4>
            <p>Choose between Low, Medium, or High quality</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OfflinePlayback;
