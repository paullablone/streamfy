import { useState, useRef } from 'react';

function StoryCreator({ user, onClose, onStoryCreated, socket }) {
  const [step, setStep] = useState('upload'); // upload, edit, preview
  const [storyData, setStoryData] = useState({
    image: '',
    caption: '',
    textOverlays: [],
    stickers: [],
    filter: 'none',
    backgroundColor: '#667eea'
  });
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState('medium');
  const [textStyle, setTextStyle] = useState('normal');
  const canvasRef = useRef(null);

  const filters = [
    { name: 'None', value: 'none' },
    { name: 'Grayscale', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Brightness', value: 'brightness(120%)' },
    { name: 'Contrast', value: 'contrast(120%)' },
    { name: 'Saturate', value: 'saturate(150%)' },
    { name: 'Blur', value: 'blur(2px)' },
    { name: 'Vintage', value: 'sepia(50%) contrast(120%)' }
  ];

  const stickers = ['😀', '😍', '🔥', '❤️', '👍', '🎉', '⭐', '💯', '🎵', '📸', '🎬', '🎮', '⚡', '🌟', '💪', '🙌'];

  const backgroundColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#fa709a', '#fee140', '#30cfd0', '#330867', '#a8edea', '#fed6e3',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731'
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoryData({ ...storyData, image: reader.result });
        setStep('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setStoryData({ ...storyData, image: url });
      setStep('edit');
    }
  };

  const addTextOverlay = () => {
    if (currentText.trim()) {
      const newOverlay = {
        id: Date.now(),
        text: currentText,
        color: textColor,
        size: textSize,
        style: textStyle,
        x: 50,
        y: 50
      };
      setStoryData({
        ...storyData,
        textOverlays: [...storyData.textOverlays, newOverlay]
      });
      setCurrentText('');
    }
  };

  const removeTextOverlay = (id) => {
    setStoryData({
      ...storyData,
      textOverlays: storyData.textOverlays.filter(t => t.id !== id)
    });
  };

  const addSticker = (sticker) => {
    const newSticker = {
      id: Date.now(),
      emoji: sticker,
      x: Math.random() * 60 + 20,
      y: Math.random() * 60 + 20,
      size: 40
    };
    setStoryData({
      ...storyData,
      stickers: [...storyData.stickers, newSticker]
    });
  };

  const removeSticker = (id) => {
    setStoryData({
      ...storyData,
      stickers: storyData.stickers.filter(s => s.id !== id)
    });
  };

  const handlePublish = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/stories/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(storyData)
      });

      if (response.ok) {
        const data = await response.json();
        socket.emit('story-created', data.story);
        onStoryCreated();
        onClose();
      }
    } catch (err) {
      console.error('Failed to create story:', err);
      alert('Failed to create story. Please try again.');
    }
  };

  return (
    <div className="story-creator-overlay">
      <div className="story-creator-container">
        <div className="story-creator-header">
          <button className="close-btn" onClick={onClose}>✕</button>
          <h2>Create Story</h2>
          {step === 'edit' && (
            <button className="next-btn" onClick={() => setStep('preview')}>
              Next →
            </button>
          )}
          {step === 'preview' && (
            <button className="publish-btn" onClick={handlePublish}>
              Publish
            </button>
          )}
        </div>

        <div className="story-creator-content">
          {step === 'upload' && (
            <div className="upload-section">
              <div className="upload-options">
                <div className="upload-card">
                  <label htmlFor="file-upload" className="upload-label">
                    <div className="upload-icon">📁</div>
                    <h3>Upload Photo</h3>
                    <p>Choose from your device</p>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="upload-card" onClick={handleImageUrl}>
                  <div className="upload-icon">🔗</div>
                  <h3>Image URL</h3>
                  <p>Paste an image link</p>
                </div>

                <div className="upload-card" onClick={() => { setStoryData({...storyData, image: 'text-only'}); setStep('edit'); }}>
                  <div className="upload-icon">✏️</div>
                  <h3>Text Only</h3>
                  <p>Create with text & color</p>
                </div>
              </div>
            </div>
          )}

          {step === 'edit' && (
            <div className="edit-section">
              <div className="story-preview-container">
                <div 
                  className="story-preview"
                  style={{
                    backgroundImage: storyData.image !== 'text-only' ? `url(${storyData.image})` : 'none',
                    backgroundColor: storyData.image === 'text-only' ? storyData.backgroundColor : 'transparent',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: storyData.filter
                  }}
                  ref={canvasRef}
                >
                  {storyData.textOverlays.map((overlay) => (
                    <div
                      key={overlay.id}
                      className={`text-overlay ${overlay.size} ${overlay.style}`}
                      style={{
                        color: overlay.color,
                        left: `${overlay.x}%`,
                        top: `${overlay.y}%`
                      }}
                      onClick={() => removeTextOverlay(overlay.id)}
                    >
                      {overlay.text}
                    </div>
                  ))}
                  
                  {storyData.stickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className="sticker-overlay"
                      style={{
                        left: `${sticker.x}%`,
                        top: `${sticker.y}%`,
                        fontSize: `${sticker.size}px`
                      }}
                      onClick={() => removeSticker(sticker.id)}
                    >
                      {sticker.emoji}
                    </div>
                  ))}
                </div>
              </div>

              <div className="edit-tools">
                <div className="tool-section">
                  <h4>✏️ Add Text</h4>
                  <div className="text-input-group">
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      placeholder="Type your text..."
                      onKeyPress={(e) => e.key === 'Enter' && addTextOverlay()}
                    />
                    <button onClick={addTextOverlay}>Add</button>
                  </div>
                  <div className="text-options">
                    <select value={textSize} onChange={(e) => setTextSize(e.target.value)}>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                    <select value={textStyle} onChange={(e) => setTextStyle(e.target.value)}>
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="italic">Italic</option>
                    </select>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="tool-section">
                  <h4>😀 Stickers</h4>
                  <div className="stickers-grid">
                    {stickers.map((sticker, idx) => (
                      <button
                        key={idx}
                        className="sticker-btn"
                        onClick={() => addSticker(sticker)}
                      >
                        {sticker}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tool-section">
                  <h4>🎨 Filters</h4>
                  <div className="filters-grid">
                    {filters.map((filter) => (
                      <button
                        key={filter.value}
                        className={`filter-btn ${storyData.filter === filter.value ? 'active' : ''}`}
                        onClick={() => setStoryData({...storyData, filter: filter.value})}
                      >
                        {filter.name}
                      </button>
                    ))}
                  </div>
                </div>

                {storyData.image === 'text-only' && (
                  <div className="tool-section">
                    <h4>🎨 Background Color</h4>
                    <div className="colors-grid">
                      {backgroundColors.map((color) => (
                        <button
                          key={color}
                          className={`color-btn ${storyData.backgroundColor === color ? 'active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setStoryData({...storyData, backgroundColor: color})}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="tool-section">
                  <h4>💬 Caption</h4>
                  <textarea
                    value={storyData.caption}
                    onChange={(e) => setStoryData({...storyData, caption: e.target.value})}
                    placeholder="Add a caption..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="preview-section">
              <h3>Preview Your Story</h3>
              <div 
                className="story-final-preview"
                style={{
                  backgroundImage: storyData.image !== 'text-only' ? `url(${storyData.image})` : 'none',
                  backgroundColor: storyData.image === 'text-only' ? storyData.backgroundColor : 'transparent',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: storyData.filter
                }}
              >
                {storyData.textOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className={`text-overlay ${overlay.size} ${overlay.style}`}
                    style={{
                      color: overlay.color,
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`
                    }}
                  >
                    {overlay.text}
                  </div>
                ))}
                
                {storyData.stickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="sticker-overlay"
                    style={{
                      left: `${sticker.x}%`,
                      top: `${sticker.y}%`,
                      fontSize: `${sticker.size}px`
                    }}
                  >
                    {sticker.emoji}
                  </div>
                ))}

                {storyData.caption && (
                  <div className="story-caption-preview">
                    {storyData.caption}
                  </div>
                )}
              </div>
              <div className="preview-actions">
                <button className="btn-secondary" onClick={() => setStep('edit')}>
                  ← Edit
                </button>
                <button className="btn-primary" onClick={handlePublish}>
                  Publish Story
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoryCreator;
