import { useState } from 'react';
import API_URL from '../config/api';

function CreateChannel({ onChannelCreated, onCancel }) {
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Gaming');
  const [avatar, setAvatar] = useState('📺');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const avatarOptions = ['📺', '🎮', '🎵', '🎨', '💻', '🎬', '⚽', '🍳', '💪', '🎤', '📚', '🔬'];
  const categories = ['Gaming', 'Music', 'Tech & Education', 'Entertainment', 'Sports & Fitness', 'Creative Arts', 'Cooking', 'Lifestyle'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!channelName.trim()) {
      setError('Channel name is required');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/channels/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          channelName: channelName.trim(),
          description: description.trim(),
          category,
          avatar
        })
      });

      const data = await response.json();

      if (response.ok) {
        onChannelCreated(data.channel);
      } else {
        setError(data.error || 'Failed to create channel');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-channel-overlay">
      <div className="create-channel-modal">
        <div className="modal-header">
          <h2>🎬 Create Your Channel</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Channel Avatar</label>
            <div className="avatar-selector">
              {avatarOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`avatar-option ${avatar === emoji ? 'selected' : ''}`}
                  onClick={() => setAvatar(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Channel Name *</label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Enter your channel name"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what your channel is about..."
              rows={4}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateChannel;
