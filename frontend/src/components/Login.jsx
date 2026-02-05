import { useState } from 'react';

function Login({ onLogin, onSwitchToSignup, onBrowseAsGuest }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '🎥', title: 'Live Streaming', desc: 'Broadcast in HD quality' },
    { icon: '🎮', title: 'Interactive', desc: 'Chat, polls & reactions' },
    { icon: '🏆', title: 'Gamification', desc: 'Earn XP & badges' },
    { icon: '🎵', title: 'Stream DJ', desc: 'Viewers control music' },
    { icon: '🤝', title: 'Social Features', desc: 'Watch with friends' },
    { icon: '📱', title: 'Mobile App', desc: 'Install on any device' }
  ];

  return (
    <div className="auth-container" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-box" style={{ maxWidth: '900px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', padding: '50px', margin: '20px' }}>
        {/* Left Side - Features (Hidden on mobile via CSS) */}
        <div style={{ color: 'white' }} className="desktop-only">
          <div className="tv-logo" style={{ marginBottom: '20px' }}>
            <span className="logo-text" style={{ fontSize: '36px', fontWeight: '800' }}>Streamfy</span>
          </div>
          <h2 style={{ fontSize: '28px', marginBottom: '15px', fontWeight: '800' }}>Welcome Back!</h2>
          <p style={{ fontSize: '16px', marginBottom: '30px', opacity: 0.9 }}>
            Login to access your channel and continue streaming
          </p>

          <div style={{ display: 'grid', gap: '15px' }}>
            {features.map((feature, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'translateX(5px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span style={{ fontSize: '32px' }}>{feature.icon}</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{feature.title}</div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '100%' }}>
          {/* Mobile Logo */}
          <div className="mobile-only" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '32px', fontWeight: '800', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Streamfy</span>
          </div>

          <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#1a1a1a', fontWeight: '800' }}>Login</h3>
          <p style={{ color: '#666', marginBottom: '25px', fontSize: '14px' }}>Enter your credentials to continue</p>

          {error && <div className="error-message" style={{ marginBottom: '20px', padding: '12px', background: '#fee', color: '#c33', borderRadius: '8px', fontSize: '14px' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ color: '#1a1a1a', fontSize: '13px', fontWeight: '600' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  marginTop: '5px',
                  transition: 'all 0.3s',
                  color: '#1a1a1a',
                  backgroundColor: '#fff'
                }}
              />
            </div>

            <div className="form-group">
              <label style={{ color: '#1a1a1a', fontSize: '13px', fontWeight: '600' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  marginTop: '5px',
                  transition: 'all 0.3s',
                  color: '#1a1a1a',
                  backgroundColor: '#fff'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '10px',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' }}>
            Don't have an account?{' '}
            <span 
              onClick={onSwitchToSignup}
              style={{ color: '#667eea', fontWeight: '700', cursor: 'pointer' }}
            >
              Sign up
            </span>
          </p>

          <div style={{ marginTop: '25px', paddingTop: '25px', borderTop: '1px solid #e0e0e0' }}>
            <button 
              onClick={onBrowseAsGuest}
              style={{
                width: '100%',
                padding: '12px',
                background: '#f5f5f5',
                color: '#333',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Continue as Guest
            </button>
            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#999' }}>
              Browse and watch streams without an account
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
