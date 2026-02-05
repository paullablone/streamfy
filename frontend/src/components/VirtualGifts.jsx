import { useState, useEffect } from 'react';

function VirtualGifts({ user, roomId, socket, streamerName }) {
  const [gifts, setGifts] = useState([]);
  const [showGiftMenu, setShowGiftMenu] = useState(false);
  const [animatingGifts, setAnimatingGifts] = useState([]);

  const giftTypes = [
    { id: 1, emoji: '❤️', name: 'Heart', cost: 10, color: '#ff6b6b' },
    { id: 2, emoji: '🎁', name: 'Gift', cost: 50, color: '#667eea' },
    { id: 3, emoji: '⭐', name: 'Star', cost: 100, color: '#ffd93d' },
    { id: 4, emoji: '💎', name: 'Diamond', cost: 500, color: '#4ecdc4' },
    { id: 5, emoji: '👑', name: 'Crown', cost: 1000, color: '#f093fb' },
    { id: 6, emoji: '🚀', name: 'Rocket', cost: 2000, color: '#fa709a' },
    { id: 7, emoji: '🔥', name: 'Fire', cost: 5000, color: '#ff6348' },
    { id: 8, emoji: '💰', name: 'Money Bag', cost: 10000, color: '#2ecc71' }
  ];

  useEffect(() => {
    if (!socket) return;

    socket.on('gift-sent', (gift) => {
      setGifts(prev => [...prev, gift]);
      
      // Add to animating gifts
      const animGift = { ...gift, id: Date.now() + Math.random() };
      setAnimatingGifts(prev => [...prev, animGift]);
      
      // Remove after animation
      setTimeout(() => {
        setAnimatingGifts(prev => prev.filter(g => g.id !== animGift.id));
      }, 3000);
    });

    return () => {
      socket.off('gift-sent');
    };
  }, [socket]);

  const sendGift = (gift) => {
    if (!user) {
      alert('Please login to send gifts');
      return;
    }

    const giftData = {
      ...gift,
      from: user.username,
      to: streamerName,
      timestamp: Date.now()
    };

    socket.emit('send-gift', { roomId, gift: giftData });
    setShowGiftMenu(false);
  };

  return (
    <div className="virtual-gifts-container">
      <button 
        onClick={() => setShowGiftMenu(!showGiftMenu)} 
        className="btn-open-gifts"
      >
        🎁 Send Gift
      </button>

      {showGiftMenu && (
        <div className="gifts-menu">
          <div className="gifts-menu-header">
            <h3>🎁 Virtual Gifts</h3>
            <button onClick={() => setShowGiftMenu(false)} className="close-gifts">✕</button>
          </div>
          
          <div className="gifts-grid">
            {giftTypes.map(gift => (
              <div 
                key={gift.id} 
                className="gift-item"
                onClick={() => sendGift(gift)}
                style={{ borderColor: gift.color }}
              >
                <div className="gift-emoji">{gift.emoji}</div>
                <div className="gift-name">{gift.name}</div>
                <div className="gift-cost">💰 {gift.cost}</div>
              </div>
            ))}
          </div>

          <div className="gifts-info">
            <p>💡 Gifts support your favorite streamers!</p>
          </div>
        </div>
      )}

      {/* Animated gifts overlay */}
      <div className="gifts-animation-overlay">
        {animatingGifts.map(gift => (
          <div 
            key={gift.id} 
            className="animated-gift"
            style={{ 
              left: `${Math.random() * 80 + 10}%`,
              animationDelay: `${Math.random() * 0.5}s`
            }}
          >
            <div className="gift-emoji-large">{gift.emoji}</div>
            <div className="gift-sender">from {gift.from}</div>
          </div>
        ))}
      </div>

      {/* Recent gifts feed */}
      <div className="recent-gifts-feed">
        {gifts.slice(-5).reverse().map((gift, idx) => (
          <div key={idx} className="gift-notification">
            <span className="gift-emoji-small">{gift.emoji}</span>
            <span className="gift-text">
              <strong>{gift.from}</strong> sent {gift.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualGifts;
