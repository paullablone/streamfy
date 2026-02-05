import { useState, useEffect } from 'react';

function WatchHistory({ user, onBack, onVideoClick }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/watch-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to load watch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear your entire watch history?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/watch-history/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory([]);
        alert('Watch history cleared!');
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
      alert('Failed to clear history');
    }
  };

  const deleteHistoryItem = async (historyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/watch-history/${historyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(history.filter(item => item._id !== historyId));
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const watchedDate = new Date(date);
    const diffMs = now - watchedDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return watchedDate.toLocaleDateString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <div className="watch-history-page">
      <div className="watch-history-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>🕐 Watch History</h1>
        {history.length > 0 && (
          <button className="clear-history-btn" onClick={clearHistory}>
            Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="history-loading">Loading watch history...</div>
      ) : history.length === 0 ? (
        <div className="history-empty">
          <div className="empty-icon">📺</div>
          <h2>No Watch History</h2>
          <p>Videos you watch will appear here</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item._id} className="history-item">
              <div 
                className="history-thumbnail"
                onClick={() => onVideoClick && onVideoClick(item)}
                style={{ cursor: 'pointer' }}
              >
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.channelName} />
                ) : (
                  <div className="history-placeholder">
                    <span className="placeholder-icon">{item.channelIcon || '📺'}</span>
                  </div>
                )}
                {item.duration > 0 && (
                  <div className="history-duration">
                    {formatDuration(item.duration)}
                  </div>
                )}
              </div>
              
              <div className="history-info">
                <h3 
                  onClick={() => onVideoClick && onVideoClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  {item.channelName}
                </h3>
                <div className="history-meta">
                  <span className="history-category">
                    {item.channelIcon} {item.channelCategory}
                  </span>
                  <span className="history-time">
                    {formatDate(item.watchedAt)}
                  </span>
                </div>
              </div>

              <button 
                className="delete-history-btn"
                onClick={() => deleteHistoryItem(item._id)}
                title="Remove from history"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WatchHistory;
