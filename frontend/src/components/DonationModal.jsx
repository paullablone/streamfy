import { useState, useEffect } from 'react';

function DonationModal({ streamer, onClose, onSuccess }) {
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/monetization/donation-tiers');
      const data = await response.json();
      if (data.success) {
        setTiers(data.tiers);
      }
    } catch (error) {
      console.error('Failed to fetch tiers:', error);
    }
  };

  const handleDonate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to donate');
      return;
    }

    const donationAmount = amount === 0 ? parseFloat(customAmount) : amount;
    
    if (!donationAmount || donationAmount < 1) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3002/api/monetization/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: streamer.id,
          amount: donationAmount,
          message,
          isAnonymous,
          paymentMethod
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess && onSuccess(data.donation);
        alert(`Successfully donated $${donationAmount}!`);
        onClose();
      } else {
        alert(data.error || 'Donation failed');
      }
    } catch (error) {
      console.error('Donation error:', error);
      alert('Failed to process donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content donation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💰 Support {streamer.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Donation Tiers */}
          <div className="donation-tiers">
            {tiers.map((tier) => (
              <button
                key={tier.amount}
                className={`donation-tier ${amount === tier.amount ? 'active' : ''}`}
                onClick={() => setAmount(tier.amount)}
              >
                <span className="tier-emoji">{tier.emoji}</span>
                <span className="tier-label">{tier.label}</span>
                <span className="tier-message">{tier.message}</span>
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          {amount === 0 && (
            <div className="form-group">
              <label>Custom Amount ($)</label>
              <input
                type="number"
                min="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          )}

          {/* Message */}
          <div className="form-group">
            <label>Message (Optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a message for the streamer..."
              maxLength={200}
              rows={3}
            />
            <small>{message.length}/200 characters</small>
          </div>

          {/* Anonymous Option */}
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span>Donate anonymously</span>
            </label>
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label>Payment Method</label>
            <div className="payment-methods">
              <button
                className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                💳 Card
              </button>
              <button
                className={`payment-method ${paymentMethod === 'paypal' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('paypal')}
              >
                🅿️ PayPal
              </button>
              <button
                className={`payment-method ${paymentMethod === 'crypto' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('crypto')}
              >
                ₿ Crypto
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="donation-summary">
            <div className="summary-row">
              <span>Amount:</span>
              <span className="summary-amount">${amount === 0 ? customAmount || '0' : amount}</span>
            </div>
            <div className="summary-row">
              <span>Processing Fee:</span>
              <span>$0 (We cover it!)</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span className="summary-total">${amount === 0 ? customAmount || '0' : amount}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={handleDonate}
            disabled={loading || (amount === 0 && !customAmount)}
          >
            {loading ? 'Processing...' : `Donate $${amount === 0 ? customAmount || '0' : amount}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DonationModal;
