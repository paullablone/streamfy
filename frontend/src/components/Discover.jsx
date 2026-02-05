import { useState, useEffect } from 'react';
import StoryCreator from './StoryCreator';

function Discover({ user, onBack, socket }) {
  const [activeTab, setActiveTab] = useState('streams');
  const [streams, setStreams] = useState([]);
  const [clips, setClips] = useState([]);
  const [stories, setStories] = useState([]);
  const [showStoryCreator, setShowStoryCreator] = useState(false);

  useEffect(() => {
    loadDiscoverContent();
    
    if (socket) {
      socket.on('new-story', handleNewStory);
      socket.on('new-clip', handleNewClip);
      
      return () => {
        socket.off('new-story', handleNewStory);
        socket.off('new-clip', handleNewClip);
      };
    }
  }, []);

  const handleNewStory = (story) => {
    setStories(prev => [story, ...prev]);
  };

  const handleNewClip = (clip) => {
    setClips(prev => [clip, ...prev]);
  };

  const loadDiscoverContent = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/discover');
      const data = await response.json();
      setStreams(data.streams || []);
      setClips(data.clips || []);
      setStories(data.stories || []);
    } catch (err) {
      console.error('Failed to load discover content:', err);
    }
  };

  const handleCreateClip = async (streamId) => {
    if (!user) {
      alert('Please login to create clips');
      return;
    }

    const clipTitle = prompt('Enter clip title:');
    if (!clipTitle) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/clips/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: clipTitle,
          streamId,
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
        })
      });

      if (response.ok) {
        const data = await response.json();
        socket.emit('clip-created', data.clip);
        loadDiscoverContent();
      }
    } catch (err) {
      console.error('Failed to create clip:', err);
    }
  };

  return (
    <div className="discover-container">
      <div className="discover-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>🔍 Discover</h1>
        {user && (
          <button className="create-story-btn" onClick={() => setShowStoryCreator(true)}>
            ➕ Add Story
          </button>
        )}
      </div>

      <div className="discover-tabs">
        <button 
          className={`tab-btn ${activeTab === 'streams' ? 'active' : ''}`}
          onClick={() => setActiveTab('streams')}
        >
          🎥 Streams
        </button>
        <button 
          className={`tab-btn ${activeTab === 'clips' ? 'active' : ''}`}
          onClick={() => setActiveTab('clips')}
        >
          ✂️ Clips
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stories' ? 'active' : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          📖 Stories
        </button>
      </div>

      <div className="discover-content">
        {activeTab === 'streams' && (
          <div className="streams-section">
            <h2>🔴 Live Now</h2>
            <div className="discover-grid">
              {streams.length === 0 ? (
                <div className="empty-state">
                  <p>No live streams at the moment</p>
                </div>
              ) : (
                streams.map((stream) => (
                  <div key={stream.id} className="discover-card stream-card-discover">
                    <div 
                      className="discover-thumbnail"
                      style={{ 
                        backgroundImage: stream.thumbnail ? `url(${stream.thumbnail})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="live-badge-discover">🔴 LIVE</div>
                      <div className="viewer-badge">{stream.viewers} watching</div>
                    </div>
                    <div className="discover-info">
                      <div className="streamer-avatar-small">{stream.avatar || '👤'}</div>
                      <div className="discover-details">
                        <h3>{stream.title}</h3>
                        <p className="streamer-name">{stream.streamer}</p>
                        <span className="category-tag">{stream.category}</span>
                      </div>
                    </div>
                    <button 
                      className="clip-btn"
                      onClick={() => handleCreateClip(stream.id)}
                    >
                      ✂️ Clip
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'clips' && (
          <div className="clips-section">
            <h2>✂️ Trending Clips</h2>
            <div className="discover-grid">
              {clips.length === 0 ? (
                <div className="empty-state">
                  <p>No clips yet. Create the first one!</p>
                </div>
              ) : (
                clips.map((clip) => (
                  <div key={clip.id} className="discover-card clip-card">
                    <div 
                      className="discover-thumbnail"
                      style={{ 
                        backgroundImage: clip.thumbnail ? `url(${clip.thumbnail})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="clip-duration">{clip.duration || '0:30'}</div>
                      <div className="play-overlay">▶</div>
                    </div>
                    <div className="discover-info">
                      <h3>{clip.title}</h3>
                      <p className="clip-creator">by {clip.creator}</p>
                      <div className="clip-stats">
                        <span>👁️ {clip.views || 0}</span>
                        <span>❤️ {clip.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="stories-section">
            <h2>📖 Stories</h2>
            <div className="stories-grid">
              {stories.length === 0 ? (
                <div className="empty-state">
                  <p>No stories yet. Share your first story!</p>
                </div>
              ) : (
                stories.map((story) => (
                  <div key={story.id} className="story-card">
                    <div 
                      className="story-image"
                      style={{ 
                        backgroundImage: story.image ? `url(${story.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="story-user">
                        <div className="story-avatar">{story.avatar || '👤'}</div>
                        <span>{story.username}</span>
                      </div>
                      <div className="story-time">{story.timeAgo || 'Just now'}</div>
                    </div>
                    {story.caption && (
                      <div className="story-caption">
                        <p>{story.caption}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showStoryCreator && (
        <StoryCreator
          user={user}
          onClose={() => setShowStoryCreator(false)}
          onStoryCreated={loadDiscoverContent}
          socket={socket}
        />
      )}
    </div>
  );
}

export default Discover;
