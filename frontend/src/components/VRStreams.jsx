import { useState } from 'react';

function VRStreams({ onBack, onVideoClick }) {
  const [vrMode, setVrMode] = useState('360');

  const vrStreams = [
    {
      id: 'vr-1',
      name: 'VR Gaming Experience',
      category: 'Gaming',
      icon: '🥽',
      viewers: 8765,
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1',
      description: 'Immersive VR gaming in 360°',
      vrType: '360',
      isLive: true
    },
    {
      id: 'vr-2',
      name: 'Virtual Concert Hall',
      category: 'Music',
      icon: '🎵',
      viewers: 12345,
      thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1',
      description: 'Live concert in VR',
      vrType: '360',
      isLive: true
    },
    {
      id: 'vr-3',
      name: 'VR Travel Experience',
      category: 'Travel',
      icon: '✈️',
      viewers: 6543,
      thumbnail: 'https://img.youtube.com/vi/eKFTSSKCzWA/mqdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/eKFTSSKCzWA?autoplay=1&mute=1',
      description: 'Explore the world in VR',
      vrType: '360',
      isLive: true
    },
    {
      id: 'vr-4',
      name: 'VR Sports Arena',
      category: 'Sports',
      icon: '⚽',
      viewers: 15678,
      thumbnail: 'https://img.youtube.com/vi/EngW7tLk6R8/mqdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/EngW7tLk6R8?autoplay=1&mute=1',
      description: 'Watch sports in VR',
      vrType: '360',
      isLive: true
    },
    {
      id: 'vr-5',
      name: 'VR Art Gallery',
      category: 'Art',
      icon: '🎨',
      viewers: 4321,
      thumbnail: 'https://img.youtube.com/vi/ZNAzYEM5IVM/mqdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/ZNAzYEM5IVM?autoplay=1&mute=1',
      description: 'Virtual art exhibition',
      vrType: '360',
      isLive: true
    },
    {
      id: 'vr-6',
      name: 'VR Space Exploration',
      category: 'Science',
      icon: '🚀',
      viewers: 9876,
      thumbnail: 'https://img.youtube.com/vi/86YLFOog4GM/mqdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/86YLFOog4GM?autoplay=1&mute=1',
      description: 'Explore space in VR',
      vrType: '360',
      isLive: true
    }
  ];

  return (
    <div className="vr-streams-page">
      <div className="vr-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="vr-title">
          <h1>🥽 VR Streams</h1>
          <p>Immersive 360° Virtual Reality Experience</p>
        </div>
      </div>

      <div className="vr-info-banner">
        <div className="vr-info-icon">🥽</div>
        <div className="vr-info-content">
          <h3>Experience Streams in Virtual Reality</h3>
          <p>Use VR headset for full immersion or watch in 360° mode on your device</p>
          <div className="vr-features">
            <span className="vr-feature">✓ 360° View</span>
            <span className="vr-feature">✓ VR Headset Compatible</span>
            <span className="vr-feature">✓ Interactive Controls</span>
            <span className="vr-feature">✓ Spatial Audio</span>
          </div>
        </div>
      </div>

      <div className="vr-mode-selector">
        <button 
          className={`vr-mode-btn ${vrMode === '360' ? 'active' : ''}`}
          onClick={() => setVrMode('360')}
        >
          360° View
        </button>
        <button 
          className={`vr-mode-btn ${vrMode === 'vr' ? 'active' : ''}`}
          onClick={() => setVrMode('vr')}
        >
          VR Mode
        </button>
        <button 
          className={`vr-mode-btn ${vrMode === '3d' ? 'active' : ''}`}
          onClick={() => setVrMode('3d')}
        >
          3D Mode
        </button>
      </div>

      <div className="vr-streams-grid">
        {vrStreams.map((stream) => (
          <div 
            key={stream.id} 
            className="vr-stream-card"
            onClick={() => onVideoClick && onVideoClick(stream)}
          >
            <div className="vr-stream-thumbnail">
              <img src={stream.thumbnail} alt={stream.name} />
              <div className="vr-badge">
                <span className="vr-icon">🥽</span>
                <span>VR</span>
              </div>
              <div className="vr-live-badge">
                <span className="live-dot">🔴</span>
                <span>LIVE</span>
              </div>
              <div className="vr-viewers">
                👁️ {stream.viewers.toLocaleString()}
              </div>
            </div>

            <div className="vr-stream-info">
              <h3>{stream.name}</h3>
              <p className="vr-category">
                {stream.icon} {stream.category}
              </p>
              <p className="vr-description">{stream.description}</p>
              <div className="vr-type-badge">{stream.vrType}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="vr-help-section">
        <h3>How to Watch VR Streams</h3>
        <div className="vr-help-grid">
          <div className="vr-help-card">
            <div className="help-icon">📱</div>
            <h4>Mobile</h4>
            <p>Use your phone with a VR headset like Google Cardboard</p>
          </div>
          <div className="vr-help-card">
            <div className="help-icon">🥽</div>
            <h4>VR Headset</h4>
            <p>Connect Oculus, HTC Vive, or other VR headsets</p>
          </div>
          <div className="vr-help-card">
            <div className="help-icon">💻</div>
            <h4>Desktop</h4>
            <p>Click and drag to look around in 360°</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VRStreams;
