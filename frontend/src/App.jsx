import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Signup from './components/Signup';
import './tv-styles.css';
import './homepage-2026.css';
import './gamification.css';
import './watch-history.css';
import './innovative-features.css';
import './mobile-responsive.css';

// Lazy load channel components
const CreateChannel = lazy(() => import('./components/CreateChannel'));
const MyChannel = lazy(() => import('./components/MyChannel'));
const ChannelPage = lazy(() => import('./components/ChannelPage'));
const Discover = lazy(() => import('./components/Discover'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const BadgeCollection = lazy(() => import('./components/BadgeCollection'));
const StatsDisplay = lazy(() => import('./components/StatsDisplay'));
const WatchHistory = lazy(() => import('./components/WatchHistory'));
const VRStreams = lazy(() => import('./components/VRStreams'));
const OfflinePlayback = lazy(() => import('./components/OfflinePlayback'));
const AIRecommendations = lazy(() => import('./components/AIRecommendations'));
const SocialHub = lazy(() => import('./components/SocialHub'));
const StreamDJ = lazy(() => import('./components/StreamDJ'));

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// API URL - uses environment variable or falls back to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('browse'); // Start with browse mode
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [viewers, setViewers] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [streamQuality, setStreamQuality] = useState('high');
  const [followedStreamers, setFollowedStreamers] = useState([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [userChannel, setUserChannel] = useState(null);
  const [showMyChannel, setShowMyChannel] = useState(false);
  const [viewingChannel, setViewingChannel] = useState(null);
  const [allChannels, setAllChannels] = useState([]);
  const [showDiscover, setShowDiscover] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [viewingLiveChannel, setViewingLiveChannel] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [showWatchHistory, setShowWatchHistory] = useState(false);
  const [showVRStreams, setShowVRStreams] = useState(false);
  const [showOfflinePlayback, setShowOfflinePlayback] = useState(false);
  const [showSocialHub, setShowSocialHub] = useState(false);
  const [showStreamDJ, setShowStreamDJ] = useState(false);
  const [streamDJChannel, setStreamDJChannel] = useState(null);
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(true); // Always show for testing
  
  const socketRef = useRef();
  const localVideoRef = useRef();
  const localStreamRef = useRef();
  const peersRef = useRef({});
  const remoteVideosRef = useRef({});

  useEffect(() => {
    socketRef.current = io(API_URL);
    
    socketRef.current.on('user-joined', handleUserJoined);
    socketRef.current.on('room-users', handleRoomUsers);
    socketRef.current.on('offer', handleOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('ice-candidate', handleIceCandidate);
    socketRef.current.on('user-left', handleUserLeft);
    socketRef.current.on('chat-message', handleChatMessage);
    socketRef.current.on('viewer-count', handleViewerCount);
    socketRef.current.on('reaction', handleReaction);

    // Load saved data
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedFollows = localStorage.getItem('followedStreamers');
    
    if (token && savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadUserChannel(token);
      loadUserStats(token);
    }
    if (savedFollows) {
      setFollowedStreamers(JSON.parse(savedFollows));
    }

    loadAllChannels();

    // Check if admin panel should be shown
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      setShowAdminPanel(true);
    }

    // PWA Install Prompt Handler
    const handleBeforeInstallPrompt = (e) => {
      console.log('🎉 beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ App is already installed');
      setShowInstallButton(false);
    } else {
      console.log('📱 App is not installed yet');
    }

    // Log PWA support
    if ('serviceWorker' in navigator) {
      console.log('✅ Service Worker supported');
    } else {
      console.log('❌ Service Worker NOT supported');
    }

    return () => {
      socketRef.current.disconnect();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const loadUserChannel = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/my-channel`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.channel) {
        setUserChannel(data.channel);
      }
    } catch (err) {
      console.error('Failed to load user channel:', err);
    }
  };

  const loadUserStats = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/gamification/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUserStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
  };

  const saveToWatchHistory = async (channel) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/watch-history/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId: channel.id,
          channelName: channel.name,
          channelIcon: channel.icon,
          channelCategory: channel.category,
          videoUrl: channel.videoUrl,
          thumbnail: channel.thumbnail,
          duration: 0
        })
      });
    } catch (err) {
      console.error('Failed to save watch history:', err);
    }
  };

  const loadAllChannels = async () => {
    try {
      const response = await fetch(`${API_URL}/api/channels`);
      const data = await response.json();
      setAllChannels(data.channels || []);
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setAuthView('browse'); // Switch to browse mode after login
    const token = localStorage.getItem('token');
    if (token) {
      loadUserChannel(token);
      loadUserStats(token);
    }
  };

  const handleSignup = (userData) => {
    setUser(userData);
    setAuthView('browse'); // Switch to browse mode after signup
    const token = localStorage.getItem('token');
    if (token) {
      loadUserChannel(token);
      loadUserStats(token);
    }
  };

  const handleChannelCreated = (channel) => {
    setUserChannel(channel);
    setShowCreateChannel(false);
    setShowMyChannel(true);
    loadAllChannels();
  };

  const handleGoLive = (channel) => {
    setRoomId(channel.id);
    socketRef.current.emit('join-room', { roomId: channel.id, username: user.username });
    socketRef.current.emit('channel-go-live', { channelId: channel.id });
    setJoined(true);
    setShowMyChannel(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setJoined(false);
    setAuthView('browse'); // Return to browse page instead of login
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  // PWA Install Handler
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Install prompt not available yet. This could mean:\n\n1. App is already installed\n2. Browser doesn\'t support PWA\n3. Not served over HTTPS (except localhost)\n4. Install criteria not met\n\nTry:\n- Using Chrome/Edge browser\n- Checking if already installed\n- Looking for install icon in address bar');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User installed the app');
      alert('App installed successfully! Check your home screen or apps menu.');
    } else {
      console.log('❌ User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const toggleFollow = (streamerId) => {
    let newFollows;
    if (followedStreamers.includes(streamerId)) {
      newFollows = followedStreamers.filter(id => id !== streamerId);
    } else {
      newFollows = [...followedStreamers, streamerId];
    }
    setFollowedStreamers(newFollows);
    localStorage.setItem('followedStreamers', JSON.stringify(newFollows));
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      const username = user ? user.username : `Guest${Math.floor(Math.random() * 10000)}`;
      socketRef.current.emit('join-room', { roomId, username });
      socketRef.current.emit('request-viewer-count', { roomId });
      setJoined(true);
    }
  };

  const startStreaming = async () => {
    if (!user) {
      alert('Please login to start streaming');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsStreaming(true);

      Object.keys(peersRef.current).forEach(userId => {
        createPeerConnection(userId, true);
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone');
    }
  };

  const stopStreaming = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setIsStreaming(false);

    Object.values(peersRef.current).forEach(peer => peer.close());
    peersRef.current = {};
  };

  const createPeerConnection = (userId, isInitiator) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[userId] = peer;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    peer.ontrack = (event) => {
      if (!remoteVideosRef.current[userId]) {
        remoteVideosRef.current[userId] = event.streams[0];
        forceUpdate();
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          to: userId
        });
      }
    };

    if (isInitiator) {
      peer.createOffer()
        .then(offer => peer.setLocalDescription(offer))
        .then(() => {
          socketRef.current.emit('offer', {
            offer: peer.localDescription,
            to: userId
          });
        });
    }

    return peer;
  };

  const handleUserJoined = ({ userId }) => {
    if (localStreamRef.current) {
      createPeerConnection(userId, true);
    }
  };

  const handleRoomUsers = (users) => {
    users.forEach(({ userId }) => {
      if (!peersRef.current[userId] && localStreamRef.current) {
        createPeerConnection(userId, false);
      }
    });
  };

  const handleOffer = async ({ offer, from }) => {
    const peer = peersRef.current[from] || createPeerConnection(from, false);
    
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    
    socketRef.current.emit('answer', {
      answer: peer.localDescription,
      to: from
    });
  };

  const handleAnswer = async ({ answer, from }) => {
    const peer = peersRef.current[from];
    if (peer) {
      await peer.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async ({ candidate, from }) => {
    const peer = peersRef.current[from];
    if (peer) {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const handleUserLeft = ({ userId }) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].close();
      delete peersRef.current[userId];
    }
    if (remoteVideosRef.current[userId]) {
      delete remoteVideosRef.current[userId];
      forceUpdate();
    }
  };

  const handleChatMessage = (msg) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleViewerCount = (count) => {
    setViewers(count);
  };

  const handleReaction = (reaction) => {
    const id = Date.now() + Math.random();
    setReactions(prev => [...prev, { ...reaction, id }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  };

  const sendReaction = (emoji) => {
    const username = user ? user.username : 'Guest';
    socketRef.current.emit('reaction', { roomId, emoji, username });
  };

  const startScreenShare = async () => {
    if (!user) {
      alert('Please login to share your screen');
      return;
    }
    
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      localStreamRef.current = screenStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      Object.keys(peersRef.current).forEach(userId => {
        const peer = peersRef.current[userId];
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const stopScreenShare = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScreenSharing(false);
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    Object.keys(peersRef.current).forEach(userId => {
      const peer = peersRef.current[userId];
      const videoTrack = stream.getVideoTracks()[0];
      const sender = peer.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });
  };

  const sendMessage = () => {
    if (chatMessage.trim()) {
      if (!user) {
        alert('Please login to chat');
        return;
      }
      const currentRoomId = viewingLiveChannel ? viewingLiveChannel.id : roomId;
      socketRef.current.emit('chat-message', { roomId: currentRoomId, message: chatMessage });
      setChatMessage('');
    }
  };

  const [, setUpdate] = useState(0);
  const forceUpdate = () => setUpdate(n => n + 1);

  // Define all video data arrays (used by viewer and homepage)
  const liveChannels = [
    {
      id: 'channel-news',
      name: 'Streamfy News 24/7',
      icon: '📰',
      category: 'News',
      viewers: 15234,
      description: 'Breaking news and updates',
      color: '#ef4444',
      nowPlaying: 'World News Tonight',
      nextUp: 'Weather Update',
      videoUrl: 'https://www.youtube.com/embed/9Auq9mYxFEE?autoplay=1&mute=1&loop=1&playlist=9Auq9mYxFEE'
    },
    {
      id: 'channel-sports',
      name: 'Sports Central',
      icon: '⚽',
      category: 'Sports',
      viewers: 23456,
      description: 'Live sports coverage',
      color: '#10b981',
      nowPlaying: 'Premier League Live',
      nextUp: 'Sports Highlights',
      videoUrl: 'https://www.youtube.com/embed/EngW7tLk6R8?autoplay=1&mute=1&loop=1&playlist=EngW7tLk6R8'
    },
    {
      id: 'channel-music',
      name: 'Music TV',
      icon: '🎵',
      category: 'Music',
      viewers: 18765,
      description: '24/7 music videos',
      color: '#f093fb',
      nowPlaying: 'Top 40 Countdown',
      nextUp: 'Live Concert Series',
      videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&loop=1&playlist=jfKfPfyJRdk'
    },
    {
      id: 'channel-movies',
      name: 'Cinema Plus',
      icon: '🎬',
      category: 'Movies',
      viewers: 34567,
      description: 'Classic & new movies',
      color: '#fbbf24',
      nowPlaying: 'Action Movie Marathon',
      nextUp: 'Comedy Night',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ'
    },
    {
      id: 'channel-gaming',
      name: 'Game Zone TV',
      icon: '🎮',
      category: 'Gaming',
      viewers: 28901,
      description: 'Gaming tournaments',
      color: '#667eea',
      nowPlaying: 'Esports Championship',
      nextUp: 'Speedrun Challenge',
      videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1&mute=1&loop=1&playlist=jNQXAC9IVRw'
    },
    {
      id: 'channel-tech',
      name: 'Tech Today',
      icon: '💻',
      category: 'Technology',
      viewers: 12345,
      description: 'Tech news & reviews',
      color: '#4facfe',
      nowPlaying: 'Latest Gadget Reviews',
      nextUp: 'Coding Tutorial',
      videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw?autoplay=1&mute=1&loop=1&playlist=rfscVS0vtbw'
    },
    {
      id: 'channel-cooking',
      name: 'Food Network',
      icon: '🍳',
      category: 'Lifestyle',
      viewers: 9876,
      description: 'Cooking shows',
      color: '#fb923c',
      nowPlaying: 'Master Chef Competition',
      nextUp: 'Quick Recipes',
      videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk?autoplay=1&mute=1&loop=1&playlist=kJQP7kiw5Fk'
    },
    {
      id: 'channel-kids',
      name: 'Kids TV',
      icon: '🧸',
      category: 'Kids',
      viewers: 45678,
      description: 'Family-friendly content',
      color: '#a78bfa',
      nowPlaying: 'Cartoon Adventures',
      nextUp: 'Educational Fun',
      videoUrl: 'https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU'
    }
  ];

  const featuredStreamers = [
    {
      id: 'streamer-1',
      name: 'LoFi Girl',
      avatar: '🎵',
      category: 'Music',
      followers: 13500000,
      viewers: 45000,
      isLive: true,
      roomId: 'lofi-girl-live',
      color: '#f093fb',
      icon: '🎵',
      description: 'Lofi hip hop music - beats to relax/study to',
      nowPlaying: 'Lofi Hip Hop Radio',
      nextUp: '24/7 Chill Beats',
      videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1',
      thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg'
    },
    {
      id: 'streamer-2',
      name: 'NASA',
      avatar: '🚀',
      category: 'Science',
      followers: 9800000,
      viewers: 12000,
      isLive: true,
      roomId: 'nasa-live',
      color: '#4facfe',
      icon: '🚀',
      description: 'NASA Live: Earth From Space - ISS Live Stream',
      nowPlaying: 'Earth From Space',
      nextUp: 'ISS Live Feed',
      videoUrl: 'https://www.youtube.com/embed/86YLFOog4GM?autoplay=1&mute=1',
      thumbnail: 'https://img.youtube.com/vi/86YLFOog4GM/mqdefault.jpg'
    },
    {
      id: 'streamer-3',
      name: 'Relaxing Music',
      avatar: '🎹',
      category: 'Music',
      followers: 8200000,
      viewers: 28000,
      isLive: true,
      roomId: 'relaxing-music-live',
      color: '#a78bfa',
      icon: '🎹',
      description: 'Beautiful Relaxing Music - Peaceful Piano & Guitar',
      nowPlaying: 'Peaceful Piano Music',
      nextUp: 'Relaxing Guitar',
      videoUrl: 'https://www.youtube.com/embed/1ZYbU82GVz4?autoplay=1&mute=1',
      thumbnail: 'https://img.youtube.com/vi/1ZYbU82GVz4/mqdefault.jpg'
    },
    {
      id: 'streamer-4',
      name: 'Cozy Coffee Shop',
      avatar: '☕',
      category: 'Ambience',
      followers: 2100000,
      viewers: 8500,
      isLive: true,
      roomId: 'coffee-shop-live',
      color: '#fb923c',
      icon: '☕',
      description: 'Cozy Coffee Shop Ambience with Relaxing Jazz Music',
      nowPlaying: 'Coffee Shop Jazz',
      nextUp: 'Rainy Day Cafe',
      videoUrl: 'https://www.youtube.com/embed/kgx4WGK0oNU?autoplay=1&mute=1',
      thumbnail: 'https://img.youtube.com/vi/kgx4WGK0oNU/mqdefault.jpg'
    },
    {
      id: 'streamer-5',
      name: 'Nature Sounds',
      avatar: '🌲',
      category: 'Nature',
      followers: 3400000,
      viewers: 15000,
      isLive: true,
      roomId: 'nature-sounds-live',
      color: '#10b981',
      icon: '🌲',
      description: 'Relaxing Nature Sounds - Forest Birds & Water',
      nowPlaying: 'Forest Ambience',
      nextUp: 'Ocean Waves',
      videoUrl: 'https://www.youtube.com/embed/eKFTSSKCzWA?autoplay=1&mute=1',
      thumbnail: 'https://img.youtube.com/vi/eKFTSSKCzWA/mqdefault.jpg'
    },
    {
      id: 'streamer-6',
      name: 'Synthwave Radio',
      avatar: '🌆',
      category: 'Music',
      followers: 1800000,
      viewers: 6200,
      isLive: true,
      roomId: 'synthwave-live',
      color: '#667eea',
      icon: '🌆',
      description: 'Synthwave Radio - 24/7 Retro Music',
      nowPlaying: 'Synthwave Mix',
      nextUp: 'Retrowave Vibes',
      videoUrl: 'https://www.youtube.com/embed/4xDzrJKXOOY?autoplay=1&mute=1',
      thumbnail: 'https://img.youtube.com/vi/4xDzrJKXOOY/mqdefault.jpg'
    },
    {
      id: 'streamer-7',
      name: 'Study With Me',
      avatar: '📚',
      category: 'Study',
      followers: 1200000,
      viewers: 9800,
      isLive: true,
      roomId: 'study-live',
      color: '#fbbf24',
      icon: '📚',
      description: 'Study With Me - Pomodoro Timer 25/5',
      nowPlaying: 'Study Session',
      nextUp: 'Focus Time',
      videoUrl: 'https://www.youtube.com/embed/lTRiuFIWV54?autoplay=1&mute=1',
      thumbnail: 'https://img.youtube.com/vi/lTRiuFIWV54/mqdefault.jpg'
    },
    {
      id: 'streamer-8',
      name: 'Meditation Music',
      avatar: '🧘',
      category: 'Wellness',
      followers: 5600000,
      viewers: 22000,
      isLive: true,
      roomId: 'meditation-live',
      color: '#ec4899',
      icon: '🧘',
      description: 'Peaceful Meditation Music - Healing & Relaxation',
      nowPlaying: 'Meditation Session',
      nextUp: 'Healing Sounds',
      videoUrl: 'https://www.youtube.com/embed/1ZYbU82GVz4?autoplay=1&mute=1',
      thumbnail: 'https://img.youtube.com/vi/1ZYbU82GVz4/mqdefault.jpg'
    }
  ];

  // Show login/signup only when explicitly requested
  if (authView === 'login') {
    return (
      <Login 
        onLogin={handleLogin} 
        onSwitchToSignup={() => setAuthView('signup')}
        onBrowseAsGuest={() => setAuthView('browse')}
      />
    );
  }

  if (authView === 'signup') {
    return (
      <Signup 
        onSignup={handleSignup} 
        onSwitchToLogin={() => setAuthView('login')}
        onBrowseAsGuest={() => setAuthView('browse')}
      />
    );
  }

  // Show Admin Panel
  if (showAdminPanel) {
    return (
      <Suspense fallback={<div className="loading-screen">Loading Admin Panel...</div>}>
        <AdminPanel onClose={() => {
          setShowAdminPanel(false);
          window.history.replaceState({}, '', window.location.pathname);
        }} />
      </Suspense>
    );
  }

  // Show Live Channel Viewer
  if (viewingLiveChannel) {
    // Helper function to get suggested videos based on current channel
    const getSuggestedVideos = () => {
      const allVideos = [];
      
      // Add all live channels (defined in the browse section)
      const allLiveChannels = [
        {
          id: 'channel-news',
          name: 'Streamfy News 24/7',
          icon: '📰',
          category: 'News',
          viewers: 15234,
          description: 'Breaking news and updates',
          color: '#ef4444',
          nowPlaying: 'World News Tonight',
          nextUp: 'Weather Update',
          videoUrl: 'https://www.youtube.com/embed/9Auq9mYxFEE?autoplay=1&mute=1&loop=1&playlist=9Auq9mYxFEE',
          thumbnail: 'https://img.youtube.com/vi/9Auq9mYxFEE/mqdefault.jpg'
        },
        {
          id: 'channel-sports',
          name: 'Sports Central',
          icon: '⚽',
          category: 'Sports',
          viewers: 23456,
          description: 'Live sports coverage',
          color: '#10b981',
          nowPlaying: 'Premier League Live',
          nextUp: 'Sports Highlights',
          videoUrl: 'https://www.youtube.com/embed/EngW7tLk6R8?autoplay=1&mute=1&loop=1&playlist=EngW7tLk6R8',
          thumbnail: 'https://img.youtube.com/vi/EngW7tLk6R8/mqdefault.jpg'
        },
        {
          id: 'channel-music',
          name: 'Music TV',
          icon: '🎵',
          category: 'Music',
          viewers: 18765,
          description: '24/7 music videos',
          color: '#f093fb',
          nowPlaying: 'Top 40 Countdown',
          nextUp: 'Live Concert Series',
          videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&loop=1&playlist=jfKfPfyJRdk',
          thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg'
        },
        {
          id: 'channel-movies',
          name: 'Cinema Plus',
          icon: '🎬',
          category: 'Movies',
          viewers: 34567,
          description: 'Classic & new movies',
          color: '#fbbf24',
          nowPlaying: 'Action Movie Marathon',
          nextUp: 'Comedy Night',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
        },
        {
          id: 'channel-gaming',
          name: 'Game Zone TV',
          icon: '🎮',
          category: 'Gaming',
          viewers: 28901,
          description: 'Gaming tournaments',
          color: '#667eea',
          nowPlaying: 'Esports Championship',
          nextUp: 'Speedrun Challenge',
          videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1&mute=1&loop=1&playlist=jNQXAC9IVRw',
          thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg'
        },
        {
          id: 'channel-tech',
          name: 'Tech Today',
          icon: '💻',
          category: 'Technology',
          viewers: 12345,
          description: 'Tech news & reviews',
          color: '#4facfe',
          nowPlaying: 'Latest Gadget Reviews',
          nextUp: 'Coding Tutorial',
          videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw?autoplay=1&mute=1&loop=1&playlist=rfscVS0vtbw',
          thumbnail: 'https://img.youtube.com/vi/rfscVS0vtbw/mqdefault.jpg'
        },
        {
          id: 'channel-cooking',
          name: 'Food Network',
          icon: '🍳',
          category: 'Lifestyle',
          viewers: 9876,
          description: 'Cooking shows',
          color: '#fb923c',
          nowPlaying: 'Master Chef Competition',
          nextUp: 'Quick Recipes',
          videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk?autoplay=1&mute=1&loop=1&playlist=kJQP7kiw5Fk',
          thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg'
        },
        {
          id: 'channel-kids',
          name: 'Kids TV',
          icon: '🧸',
          category: 'Kids',
          viewers: 45678,
          description: 'Family-friendly content',
          color: '#a78bfa',
          nowPlaying: 'Cartoon Adventures',
          nextUp: 'Educational Fun',
          videoUrl: 'https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU',
          thumbnail: 'https://img.youtube.com/vi/ktvTqknDobU/mqdefault.jpg'
        }
      ];
      
      allLiveChannels.forEach(ch => {
        if (ch.id !== viewingLiveChannel.id) {
          allVideos.push(ch);
        }
      });
      
      // Add trending streams
      const trendingStreams = [
        { 
          id: 'trending-1', 
          name: 'Epic Gaming Marathon',
          title: 'Epic Gaming Marathon', 
          streamer: 'ProGamer', 
          viewers: 12500, 
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', 
          category: 'Gaming',
          icon: '🎮',
          description: 'Non-stop gaming action',
          color: '#667eea',
          nowPlaying: 'Epic Gaming Marathon',
          nextUp: 'Tournament Finals',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ'
        },
        { 
          id: 'trending-2', 
          name: 'Live Music Concert',
          title: 'Live Music Concert', 
          streamer: 'DJ Luna', 
          viewers: 8900, 
          thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg', 
          category: 'Music',
          icon: '🎵',
          description: 'Live music performances',
          color: '#f093fb',
          nowPlaying: 'Live Music Concert',
          nextUp: 'Acoustic Session',
          videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&loop=1&playlist=jfKfPfyJRdk'
        },
        { 
          id: 'trending-3', 
          name: 'Cooking Masterclass',
          title: 'Cooking Masterclass', 
          streamer: 'Chef Marco', 
          viewers: 6700, 
          thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg', 
          category: 'Cooking',
          icon: '🍳',
          description: 'Learn to cook amazing dishes',
          color: '#fb923c',
          nowPlaying: 'Cooking Masterclass',
          nextUp: 'Quick Recipes',
          videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk?autoplay=1&mute=1&loop=1&playlist=kJQP7kiw5Fk'
        },
        { 
          id: 'trending-4', 
          name: 'Tech Review Live',
          title: 'Tech Review Live', 
          streamer: 'Tech Sarah', 
          viewers: 5400, 
          thumbnail: 'https://img.youtube.com/vi/rfscVS0vtbw/mqdefault.jpg', 
          category: 'Tech',
          icon: '💻',
          description: 'Latest tech reviews',
          color: '#4facfe',
          nowPlaying: 'Tech Review Live',
          nextUp: 'Coding Tutorial',
          videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw?autoplay=1&mute=1&loop=1&playlist=rfscVS0vtbw'
        }
      ];
      
      trendingStreams.forEach(stream => {
        if (stream.id !== viewingLiveChannel.id) {
          allVideos.push(stream);
        }
      });
      
      // Add featured streamers
      featuredStreamers.forEach(streamer => {
        if (streamer.id !== viewingLiveChannel.id && streamer.isLive) {
          allVideos.push(streamer);
        }
      });
      
      // Filter by same category first, then add others
      const sameCategory = allVideos.filter(v => v.category === viewingLiveChannel.category);
      const otherCategories = allVideos.filter(v => v.category !== viewingLiveChannel.category);
      
      // Return 6 suggestions: prioritize same category
      return [...sameCategory, ...otherCategories].slice(0, 6);
    };
    
    const suggestedVideos = getSuggestedVideos();
    
    return (
      <div className="app">
        <div className="live-channel-viewer">
          {/* Header */}
          <div className="live-viewer-header">
            <button 
              className="back-button"
              onClick={() => setViewingLiveChannel(null)}
            >
              ← Back to Channels
            </button>
            <div className="channel-info-header">
              <span className="channel-icon-header">{viewingLiveChannel.icon}</span>
              <div>
                <h2>{viewingLiveChannel.name}</h2>
                <span className="category-badge">{viewingLiveChannel.category}</span>
              </div>
            </div>
            <div className="viewer-stats">
              <span className="live-badge-header">🔴 LIVE</span>
              <span className="viewer-count-header">👁️ {viewingLiveChannel.viewers.toLocaleString()}</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="live-viewer-content">
            {/* Video Player */}
            <div className="video-player-section">
              <div className="video-player-container">
                <iframe
                  src={viewingLiveChannel.videoUrl.replace('mute=1', 'mute=0')}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                ></iframe>
              </div>

              {/* Video Info */}
              <div className="video-info-bar">
                <div className="now-playing-info">
                  <span className="play-icon-large">▶</span>
                  <div>
                    <div className="now-playing-label-large">NOW PLAYING</div>
                    <div className="now-playing-title-large">{viewingLiveChannel.nowPlaying}</div>
                  </div>
                </div>
                <div className="next-up-info">
                  <span className="next-label-large">NEXT:</span>
                  <span>{viewingLiveChannel.nextUp}</span>
                </div>
              </div>
            </div>

            {/* Chat Section */}
            <div className="chat-section">
              <div className="chat-header">
                <h3>💬 Live Chat</h3>
                <span className="online-badge">{viewers || Math.floor(Math.random() * 100 + 50)} online</span>
              </div>
              
              <div className="reactions-bar">
                {['❤️', '👍', '🔥', '😂', '😮', '👏'].map(emoji => (
                  <button 
                    key={emoji}
                    className="reaction-btn"
                    onClick={() => sendReaction(emoji)}
                    title="Send reaction"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <p>No messages yet. Start the conversation! 👋</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className="chat-message">
                      <div className="message-avatar">
                        {msg.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="message-content">
                        <div className="message-header">
                          <strong>{msg.username}</strong>
                          <span className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <div className="message-text">{msg.message}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="chat-input">
                <input
                  type="text"
                  placeholder={user ? "Type a message..." : "Login to chat..."}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={!user}
                />
                <button onClick={sendMessage} disabled={!user}>
                  <span>Send</span>
                  <span className="send-icon">➤</span>
                </button>
              </div>
            </div>
          </div>

          {/* Channel Description */}
          <div className="channel-description-section">
            <h3>About {viewingLiveChannel.name}</h3>
            <p>{viewingLiveChannel.description}</p>
            <div className="channel-stats-row">
              <div className="stat-item">
                <span className="stat-icon">👁️</span>
                <span className="stat-value">{viewingLiveChannel.viewers.toLocaleString()}</span>
                <span className="stat-label">Viewers</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📺</span>
                <span className="stat-value">24/7</span>
                <span className="stat-label">Live</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🎬</span>
                <span className="stat-value">{viewingLiveChannel.category}</span>
                <span className="stat-label">Category</span>
              </div>
            </div>
          </div>

          {/* Suggested Videos Section */}
          <div className="suggested-videos-section">
            <div className="suggested-header">
              <h3>🎬 Up Next</h3>
              <p>More videos you might like</p>
            </div>
            <div className="suggested-videos-grid">
              {suggestedVideos.map((video) => (
                <div 
                  key={video.id} 
                  className="suggested-video-card"
                  onClick={() => {
                    setViewingLiveChannel(video);
                    setMessages([]); // Clear chat for new video
                    const username = user ? user.username : `Guest${Math.floor(Math.random() * 10000)}`;
                    socketRef.current.emit('join-room', { roomId: video.id, username });
                  }}
                >
                  <div className="suggested-video-thumbnail">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.name} />
                    ) : (
                      <div className="suggested-video-placeholder" style={{ background: video.color }}>
                        <span className="placeholder-icon">{video.icon}</span>
                      </div>
                    )}
                    <div className="suggested-live-badge">🔴 LIVE</div>
                    <div className="suggested-duration">
                      <span>👁️</span> {video.viewers?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="suggested-video-info">
                    <h4>{video.name || video.title}</h4>
                    <p className="suggested-category">{video.category}</p>
                    <p className="suggested-streamer">
                      {video.streamer ? `👤 ${video.streamer}` : video.description?.substring(0, 50) + '...'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show My Channel
  if (showMyChannel) {
    console.log('showMyChannel is true');
    console.log('userChannel:', userChannel);
    
    if (!userChannel) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          background: '#0a0e27',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          padding: '40px'
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>No Channel Found</h2>
          <p style={{ fontSize: '18px', marginBottom: '30px', opacity: 0.8 }}>
            You need to create a channel first before accessing My Channel.
          </p>
          <button 
            onClick={() => {
              setShowMyChannel(false);
              setShowCreateChannel(true);
            }}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Create Channel
          </button>
          <button 
            onClick={() => setShowMyChannel(false)}
            style={{
              marginTop: '15px',
              padding: '12px 24px',
              fontSize: '14px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Back to Browse
          </button>
        </div>
      );
    }
    
    return (
      <Suspense fallback={<div className="loading-screen">Loading...</div>}>
        <MyChannel 
          user={user}
          channel={userChannel}
          onBack={() => setShowMyChannel(false)}
          onGoLive={handleGoLive}
          socket={socketRef.current}
        />
      </Suspense>
    );
  }

  // Show Channel Page
  if (viewingChannel) {
    return (
      <Suspense fallback={<div className="loading-screen">Loading...</div>}>
        <ChannelPage 
          channelId={viewingChannel}
          user={user}
          onBack={() => setViewingChannel(null)}
          socket={socketRef.current}
        />
      </Suspense>
    );
  }

  // Show Create Channel Modal
  if (showCreateChannel) {
    return (
      <Suspense fallback={<div className="loading-screen">Loading...</div>}>
        <CreateChannel 
          onChannelCreated={handleChannelCreated}
          onCancel={() => setShowCreateChannel(false)}
        />
      </Suspense>
    );
  }

  // Show Discover
  if (showDiscover) {
    return (
      <Suspense fallback={<div className="loading-screen">Loading...</div>}>
        <Discover 
          user={user}
          onBack={() => setShowDiscover(false)}
          socket={socketRef.current}
        />
      </Suspense>
    );
  }

  // Show Leaderboard
  if (showLeaderboard) {
    return (
      <Suspense fallback={<div className="loading-screen">Loading Leaderboard...</div>}>
        <Leaderboard 
          user={user}
          onBack={() => setShowLeaderboard(false)}
        />
      </Suspense>
    );
  }

  // Show Badges
  if (showBadges) {
    return (
      <div className="app">
        <div className="tv-header">
          <button className="back-button" onClick={() => setShowBadges(false)}>
            ← Back
          </button>
          <div className="tv-logo-header">
            <span className="logo-text">Streamfy</span>
          </div>
        </div>
        <Suspense fallback={<div className="loading-screen">Loading Badges...</div>}>
          <BadgeCollection user={user} />
        </Suspense>
      </div>
    );
  }

  // Show Stats
  if (showStats) {
    return (
      <div className="app">
        <div className="tv-header">
          <button className="back-button" onClick={() => setShowStats(false)}>
            ← Back
          </button>
          <div className="tv-logo-header">
            <span className="logo-text">Streamfy</span>
          </div>
        </div>
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <Suspense fallback={<div className="loading-screen">Loading Stats...</div>}>
            <StatsDisplay user={user} />
          </Suspense>
        </div>
      </div>
    );
  }

  // Show Watch History
  if (showWatchHistory) {
    return (
      <Suspense fallback={<div className="loading-screen">Loading Watch History...</div>}>
        <WatchHistory 
          user={user}
          onBack={() => setShowWatchHistory(false)}
          onVideoClick={(item) => {
            // Convert history item to channel format
            const channel = {
              id: item.channelId,
              name: item.channelName,
              icon: item.channelIcon,
              category: item.channelCategory,
              videoUrl: item.videoUrl,
              thumbnail: item.thumbnail,
              viewers: 0,
              description: item.channelName,
              nowPlaying: item.channelName,
              nextUp: 'Continue Watching'
            };
            setViewingLiveChannel(channel);
            saveToWatchHistory(channel);
            setShowWatchHistory(false);
          }}
        />
      </Suspense>
    );
  }

  // Show VR Streams
  if (showVRStreams) {
    return (
      <Suspense fallback={<div className="loading-screen">Loading VR Streams...</div>}>
        <VRStreams 
          onBack={() => setShowVRStreams(false)}
          onVideoClick={(stream) => {
            setViewingLiveChannel(stream);
            saveToWatchHistory(stream);
            setShowVRStreams(false);
          }}
        />
      </Suspense>
    );
  }

  // Show Offline Playback
  if (showOfflinePlayback) {
    return (
      <Suspense fallback={<div className="loading-screen">Loading Offline Content...</div>}>
        <OfflinePlayback 
          user={user}
          onBack={() => setShowOfflinePlayback(false)}
          onVideoClick={(item) => {
            const channel = {
              id: item.channelId,
              name: item.channelName,
              icon: item.channelIcon,
              category: item.channelCategory,
              videoUrl: item.videoUrl,
              thumbnail: item.thumbnail,
              viewers: 0,
              description: item.channelName,
              nowPlaying: item.channelName,
              nextUp: 'Offline Playback'
            };
            setViewingLiveChannel(channel);
            setShowOfflinePlayback(false);
          }}
        />
      </Suspense>
    );
  }

  // Show Social Hub
  if (showSocialHub) {
    return (
      <Suspense fallback={<div className="loading-screen">Loading Social Hub...</div>}>
        <SocialHub 
          user={user}
          onClose={() => setShowSocialHub(false)}
        />
      </Suspense>
    );
  }

  // Show Stream DJ
  if (showStreamDJ && streamDJChannel) {
    return (
      <Suspense fallback={<div className="loading-screen">Loading Stream DJ...</div>}>
        <StreamDJ 
          channelId={streamDJChannel.id}
          user={user}
          isOwner={streamDJChannel.owner === user?.id}
          onClose={() => {
            setShowStreamDJ(false);
            setStreamDJChannel(null);
          }}
        />
      </Suspense>
    );
  }

  // Show Create Channel
  if (!joined) {
    // Define all video data arrays
    const liveChannels = [
      {
        id: 'channel-news',
        name: 'Streamfy News 24/7',
        icon: '📰',
        category: 'News',
        viewers: 15234,
        description: 'Breaking news and updates',
        color: '#ef4444',
        nowPlaying: 'World News Tonight',
        nextUp: 'Weather Update',
        videoUrl: 'https://www.youtube.com/embed/9Auq9mYxFEE?autoplay=1&mute=1&loop=1&playlist=9Auq9mYxFEE'
      },
      {
        id: 'channel-sports',
        name: 'Sports Central',
        icon: '⚽',
        category: 'Sports',
        viewers: 23456,
        description: 'Live sports coverage',
        color: '#10b981',
        nowPlaying: 'Premier League Live',
        nextUp: 'Sports Highlights',
        videoUrl: 'https://www.youtube.com/embed/EngW7tLk6R8?autoplay=1&mute=1&loop=1&playlist=EngW7tLk6R8'
      },
      {
        id: 'channel-music',
        name: 'Music TV',
        icon: '🎵',
        category: 'Music',
        viewers: 18765,
        description: '24/7 music videos',
        color: '#f093fb',
        nowPlaying: 'Top 40 Countdown',
        nextUp: 'Live Concert Series',
        videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&loop=1&playlist=jfKfPfyJRdk'
      },
      {
        id: 'channel-movies',
        name: 'Cinema Plus',
        icon: '🎬',
        category: 'Movies',
        viewers: 34567,
        description: 'Classic & new movies',
        color: '#fbbf24',
        nowPlaying: 'Action Movie Marathon',
        nextUp: 'Comedy Night',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ'
      },
      {
        id: 'channel-gaming',
        name: 'Game Zone TV',
        icon: '🎮',
        category: 'Gaming',
        viewers: 28901,
        description: 'Gaming tournaments',
        color: '#667eea',
        nowPlaying: 'Esports Championship',
        nextUp: 'Speedrun Challenge',
        videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1&mute=1&loop=1&playlist=jNQXAC9IVRw'
      },
      {
        id: 'channel-tech',
        name: 'Tech Today',
        icon: '💻',
        category: 'Technology',
        viewers: 12345,
        description: 'Tech news & reviews',
        color: '#4facfe',
        nowPlaying: 'Latest Gadget Reviews',
        nextUp: 'Coding Tutorial',
        videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw?autoplay=1&mute=1&loop=1&playlist=rfscVS0vtbw'
      },
      {
        id: 'channel-cooking',
        name: 'Food Network',
        icon: '🍳',
        category: 'Lifestyle',
        viewers: 9876,
        description: 'Cooking shows',
        color: '#fb923c',
        nowPlaying: 'Master Chef Competition',
        nextUp: 'Quick Recipes',
        videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk?autoplay=1&mute=1&loop=1&playlist=kJQP7kiw5Fk'
      },
      {
        id: 'channel-kids',
        name: 'Kids TV',
        icon: '🧸',
        category: 'Kids',
        viewers: 45678,
        description: 'Family-friendly content',
        color: '#a78bfa',
        nowPlaying: 'Cartoon Adventures',
        nextUp: 'Educational Fun',
        videoUrl: 'https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU'
      }
    ];

    const featuredStreamers = [
      {
        id: 'streamer-1',
        name: 'LoFi Girl',
        avatar: '🎵',
        category: 'Music',
        followers: 13500000,
        viewers: 45000,
        isLive: true,
        roomId: 'lofi-girl-live',
        color: '#f093fb',
        icon: '🎵',
        description: 'Lofi hip hop music - beats to relax/study to',
        nowPlaying: 'Lofi Hip Hop Radio',
        nextUp: '24/7 Chill Beats',
        videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1',
        thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg'
      },
      {
        id: 'streamer-2',
        name: 'NASA',
        avatar: '🚀',
        category: 'Science',
        followers: 9800000,
        viewers: 12000,
        isLive: true,
        roomId: 'nasa-live',
        color: '#4facfe',
        icon: '🚀',
        description: 'NASA Live: Earth From Space - ISS Live Stream',
        nowPlaying: 'Earth From Space',
        nextUp: 'ISS Live Feed',
        videoUrl: 'https://www.youtube.com/embed/86YLFOog4GM?autoplay=1&mute=1',
        thumbnail: 'https://img.youtube.com/vi/86YLFOog4GM/mqdefault.jpg'
      },
      {
        id: 'streamer-3',
        name: 'Relaxing Music',
        avatar: '🎹',
        category: 'Music',
        followers: 8200000,
        viewers: 28000,
        isLive: true,
        roomId: 'relaxing-music-live',
        color: '#a78bfa',
        icon: '🎹',
        description: 'Beautiful Relaxing Music - Peaceful Piano & Guitar',
        nowPlaying: 'Peaceful Piano Music',
        nextUp: 'Relaxing Guitar',
        videoUrl: 'https://www.youtube.com/embed/1ZYbU82GVz4?autoplay=1&mute=1',
        thumbnail: 'https://img.youtube.com/vi/1ZYbU82GVz4/mqdefault.jpg'
      },
      {
        id: 'streamer-4',
        name: 'Cozy Coffee Shop',
        avatar: '☕',
        category: 'Ambience',
        followers: 2100000,
        viewers: 8500,
        isLive: true,
        roomId: 'coffee-shop-live',
        color: '#fb923c',
        icon: '☕',
        description: 'Cozy Coffee Shop Ambience with Relaxing Jazz Music',
        nowPlaying: 'Coffee Shop Jazz',
        nextUp: 'Rainy Day Cafe',
        videoUrl: 'https://www.youtube.com/embed/kgx4WGK0oNU?autoplay=1&mute=1',
        thumbnail: 'https://img.youtube.com/vi/kgx4WGK0oNU/mqdefault.jpg'
      },
      {
        id: 'streamer-5',
        name: 'Nature Sounds',
        avatar: '🌲',
        category: 'Nature',
        followers: 3400000,
        viewers: 15000,
        isLive: true,
        roomId: 'nature-sounds-live',
        color: '#10b981',
        icon: '🌲',
        description: 'Relaxing Nature Sounds - Forest Birds & Water',
        nowPlaying: 'Forest Ambience',
        nextUp: 'Ocean Waves',
        videoUrl: 'https://www.youtube.com/embed/eKFTSSKCzWA?autoplay=1&mute=1',
        thumbnail: 'https://img.youtube.com/vi/eKFTSSKCzWA/mqdefault.jpg'
      },
      {
        id: 'streamer-6',
        name: 'Synthwave Radio',
        avatar: '🌆',
        category: 'Music',
        followers: 1800000,
        viewers: 6200,
        isLive: true,
        roomId: 'synthwave-live',
        color: '#667eea',
        icon: '🌆',
        description: 'Synthwave Radio - 24/7 Retro Music',
        nowPlaying: 'Synthwave Mix',
        nextUp: 'Retrowave Vibes',
        videoUrl: 'https://www.youtube.com/embed/4xDzrJKXOOY?autoplay=1&mute=1',
        thumbnail: 'https://img.youtube.com/vi/4xDzrJKXOOY/mqdefault.jpg'
      },
      {
        id: 'streamer-7',
        name: 'Study With Me',
        avatar: '📚',
        category: 'Study',
        followers: 1200000,
        viewers: 9800,
        isLive: true,
        roomId: 'study-live',
        color: '#fbbf24',
        icon: '📚',
        description: 'Study With Me - Pomodoro Timer 25/5',
        nowPlaying: 'Study Session',
        nextUp: 'Focus Time',
        videoUrl: 'https://www.youtube.com/embed/lTRiuFIWV54?autoplay=1&mute=1',
        thumbnail: 'https://img.youtube.com/vi/lTRiuFIWV54/mqdefault.jpg'
      },
      {
        id: 'streamer-8',
        name: 'Meditation Music',
        avatar: '🧘',
        category: 'Wellness',
        followers: 5600000,
        viewers: 22000,
        isLive: true,
        roomId: 'meditation-live',
        color: '#ec4899',
        icon: '🧘',
        description: 'Peaceful Meditation Music - Healing & Relaxation',
        nowPlaying: 'Meditation Session',
        nextUp: 'Healing Sounds',
        videoUrl: 'https://www.youtube.com/embed/1ZYbU82GVz4?autoplay=1&mute=1',
        thumbnail: 'https://img.youtube.com/vi/1ZYbU82GVz4/mqdefault.jpg'
      }
    ];

    const categories = [
      {
        name: 'Gaming',
        icon: '🎮',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        rooms: [
          { 
            id: 'gaming-fps', 
            name: 'FPS Games', 
            viewers: 1234,
            videoId: 'dQw4w9WgXcQ',
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
            streamer: 'ProGamer123'
          },
          { 
            id: 'gaming-moba', 
            name: 'MOBA Arena', 
            viewers: 856,
            videoId: 'jNQXAC9IVRw',
            thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg',
            streamer: 'MOBAMaster'
          },
          { 
            id: 'gaming-casual', 
            name: 'Casual Gaming', 
            viewers: 432,
            videoId: 'kJQP7kiw5Fk',
            thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg',
            streamer: 'ChillGamer'
          }
        ]
      },
      {
        name: 'Music',
        icon: '🎵',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        rooms: [
          { 
            id: 'music-live', 
            name: 'Live Performances', 
            viewers: 2341,
            videoId: '60ItHLz5WEA',
            thumbnail: 'https://img.youtube.com/vi/60ItHLz5WEA/mqdefault.jpg',
            streamer: 'LiveMusicTV'
          },
          { 
            id: 'music-dj', 
            name: 'DJ Sets', 
            viewers: 1876,
            videoId: '5qap5aO4i9A',
            thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/mqdefault.jpg',
            streamer: 'DJMixMaster'
          },
          { 
            id: 'music-acoustic', 
            name: 'Acoustic Sessions', 
            viewers: 654,
            videoId: 'ktvTqknDobU',
            thumbnail: 'https://img.youtube.com/vi/ktvTqknDobU/mqdefault.jpg',
            streamer: 'AcousticVibes'
          }
        ]
      },
      {
        name: 'Tech & Education',
        icon: '💻',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        rooms: [
          { 
            id: 'tech-coding', 
            name: 'Live Coding', 
            viewers: 987,
            videoId: 'rfscVS0vtbw',
            thumbnail: 'https://img.youtube.com/vi/rfscVS0vtbw/mqdefault.jpg',
            streamer: 'CodeWithMe'
          },
          { 
            id: 'tech-tutorials', 
            name: 'Tech Tutorials', 
            viewers: 1543,
            videoId: 'Mus_vwhTCq0',
            thumbnail: 'https://img.youtube.com/vi/Mus_vwhTCq0/mqdefault.jpg',
            streamer: 'TechTeacher'
          },
          { 
            id: 'tech-talks', 
            name: 'Tech Talks', 
            viewers: 765,
            videoId: 'UNMkLXuNSXQ',
            thumbnail: 'https://img.youtube.com/vi/UNMkLXuNSXQ/mqdefault.jpg',
            streamer: 'TechTalks'
          }
        ]
      },
      {
        name: 'Entertainment',
        icon: '🎬',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        rooms: [
          { 
            id: 'entertainment-talk', 
            name: 'Talk Shows', 
            viewers: 3421,
            videoId: '9bZkp7q19f0',
            thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg',
            streamer: 'TalkShowHost'
          },
          { 
            id: 'entertainment-comedy', 
            name: 'Comedy', 
            viewers: 2109,
            videoId: 'OPf0YbXqDm0',
            thumbnail: 'https://img.youtube.com/vi/OPf0YbXqDm0/mqdefault.jpg',
            streamer: 'ComedyClub'
          },
          { 
            id: 'entertainment-variety', 
            name: 'Variety Shows', 
            viewers: 1234,
            videoId: 'ZZ5LpwO-An4',
            thumbnail: 'https://img.youtube.com/vi/ZZ5LpwO-An4/mqdefault.jpg',
            streamer: 'VarietyShow'
          }
        ]
      },
      {
        name: 'Sports & Fitness',
        icon: '⚽',
        color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        rooms: [
          { 
            id: 'sports-live', 
            name: 'Live Sports', 
            viewers: 5432,
            videoId: 'EngW7tLk6R8',
            thumbnail: 'https://img.youtube.com/vi/EngW7tLk6R8/mqdefault.jpg',
            streamer: 'SportsLive'
          },
          { 
            id: 'sports-fitness', 
            name: 'Fitness Classes', 
            viewers: 1876,
            videoId: 'ML4kCL3f4Uw',
            thumbnail: 'https://img.youtube.com/vi/ML4kCL3f4Uw/mqdefault.jpg',
            streamer: 'FitnessPro'
          },
          { 
            id: 'sports-yoga', 
            name: 'Yoga & Wellness', 
            viewers: 987,
            videoId: 'v7AYKMP6rOE',
            thumbnail: 'https://img.youtube.com/vi/v7AYKMP6rOE/mqdefault.jpg',
            streamer: 'YogaMaster'
          }
        ]
      },
      {
        name: 'Creative Arts',
        icon: '🎨',
        color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        rooms: [
          { 
            id: 'art-drawing', 
            name: 'Digital Art', 
            viewers: 876,
            videoId: 'ZNAzYEM5IVM',
            thumbnail: 'https://img.youtube.com/vi/ZNAzYEM5IVM/mqdefault.jpg',
            streamer: 'DigitalArtist'
          },
          { 
            id: 'art-crafts', 
            name: 'Crafts & DIY', 
            viewers: 543,
            videoId: 'fRh_vgS2dFE',
            thumbnail: 'https://img.youtube.com/vi/fRh_vgS2dFE/mqdefault.jpg',
            streamer: 'CraftyCreator'
          },
          { 
            id: 'art-design', 
            name: 'Design Studio', 
            viewers: 432,
            videoId: 'c9RzMoWZKqI',
            thumbnail: 'https://img.youtube.com/vi/c9RzMoWZKqI/mqdefault.jpg',
            streamer: 'DesignStudio'
          }
        ]
      }
    ];

    return (
      <div className="app">
        <div className="tv-browse-container">
          <div className="tv-header">
            {/* Hamburger Menu Button */}
            <button 
              className="hamburger-menu-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Menu"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>

            <div className="tv-logo-header">
              <span className="logo-text">Streamfy</span>
            </div>

            {/* Search Bar in Header */}
            <div className="header-search">
              <input
                type="text"
                placeholder="🔍 Search streams or room ID..."
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && roomId.trim() && handleJoinRoom()}
              />
              <button onClick={handleJoinRoom} disabled={!roomId.trim()}>
                Join
              </button>
            </div>

            <div className="header-user-info">
              {user ? (
                <>
                  <button onClick={() => setShowDiscover(true)} className="discover-btn-header">
                    🔍 Discover
                  </button>
                  {userStats && (
                    <div 
                      className="user-level-badge"
                      onClick={() => setShowStats(true)}
                      style={{ 
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Click to view stats"
                    >
                      ⭐ Lv {userStats.level}
                    </div>
                  )}
                  <span className="user-greeting">👋 {user.username}</span>
                  {userChannel ? (
                    <button onClick={() => {
                      console.log('My Channel button clicked');
                      console.log('Current userChannel:', userChannel);
                      setShowMyChannel(true);
                    }} className="my-channel-btn">
                      {userChannel.avatar} My Channel
                    </button>
                  ) : (
                    <button onClick={() => setShowCreateChannel(true)} className="create-channel-btn">
                      ➕ Create Channel
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button onClick={() => setShowDiscover(true)} className="discover-btn-header">
                    🔍 Discover
                  </button>
                  <button onClick={() => setAuthView('signup')} className="signup-btn-small">Sign Up</button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {showMobileMenu && (
            <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
              <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-menu-header">
                  <div className="mobile-menu-logo">
                    <span className="logo-text">Streamfy</span>
                  </div>
                  <button 
                    className="mobile-menu-close"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="mobile-menu-content">
                  {user ? (
                    <>
                      {/* User Profile Card */}
                      <div className="mobile-menu-user">
                        <div className="mobile-user-avatar">👤</div>
                        <div className="mobile-user-info">
                          <h3>{user.username}</h3>
                          <p>{user.email}</p>
                        </div>
                      </div>

                      <div className="mobile-menu-divider"></div>

                      {/* Main Navigation */}
                      <div className="mobile-menu-section">
                        <div className="mobile-menu-section-title">Navigation</div>
                        
                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🏠</span>
                          <span>Home</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowDiscover(true);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className="menu-icon">🔍</span>
                          <span>Discover</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            document.querySelector('.trending-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🔥</span>
                          <span>Trending</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            document.querySelector('.live-channels-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">📺</span>
                          <span>Live Channels</span>
                        </button>
                      </div>

                      <div className="mobile-menu-divider"></div>

                      {/* Categories Quick Access */}
                      <div className="mobile-menu-section">
                        <div className="mobile-menu-section-title">Categories</div>
                        
                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            document.querySelector('.category-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🎮</span>
                          <span>Gaming</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            const sections = document.querySelectorAll('.category-section');
                            sections[1]?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🎵</span>
                          <span>Music</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            const sections = document.querySelectorAll('.category-section');
                            sections[2]?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">💻</span>
                          <span>Tech & Education</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            const sections = document.querySelectorAll('.category-section');
                            sections[3]?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🎬</span>
                          <span>Entertainment</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            const sections = document.querySelectorAll('.category-section');
                            sections[4]?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">⚽</span>
                          <span>Sports & Fitness</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            const sections = document.querySelectorAll('.category-section');
                            sections[5]?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🎨</span>
                          <span>Creative Arts</span>
                        </button>
                      </div>

                      <div className="mobile-menu-divider"></div>

                      {/* My Content */}
                      <div className="mobile-menu-section">
                        <div className="mobile-menu-section-title">My Content</div>
                        
                        {userChannel ? (
                          <button 
                            className="mobile-menu-item"
                            onClick={() => {
                              setShowMyChannel(true);
                              setShowMobileMenu(false);
                            }}
                          >
                            <span className="menu-icon">{userChannel.avatar}</span>
                            <span>My Channel</span>
                          </button>
                        ) : (
                          <button 
                            className="mobile-menu-item"
                            onClick={() => {
                              setShowCreateChannel(true);
                              setShowMobileMenu(false);
                            }}
                          >
                            <span className="menu-icon">➕</span>
                            <span>Create Channel</span>
                          </button>
                        )}

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowWatchHistory(true);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className="menu-icon">🕐</span>
                          <span>Watch History</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            alert('Liked Videos feature coming soon!');
                          }}
                        >
                          <span className="menu-icon">❤️</span>
                          <span>Liked Videos</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            document.querySelector('.featured-streamers-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">⭐</span>
                          <span>Following</span>
                        </button>
                      </div>

                      <div className="mobile-menu-divider"></div>

                      {/* Gamification */}
                      <div className="mobile-menu-section">
                        <div className="mobile-menu-section-title">Gamification</div>
                        
                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowStats(true);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className="menu-icon">📊</span>
                          <span>My Stats</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowBadges(true);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className="menu-icon">🏅</span>
                          <span>Badges</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowLeaderboard(true);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className="menu-icon">🏆</span>
                          <span>Leaderboard</span>
                        </button>
                      </div>

                      <div className="mobile-menu-divider"></div>

                      {/* Innovative Features */}
                      <div className="mobile-menu-section">
                        <div className="mobile-menu-section-title">Innovative Features</div>
                        
                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowVRStreams(true);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className="menu-icon">🥽</span>
                          <span>VR Streams</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowOfflinePlayback(true);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className="menu-icon">📥</span>
                          <span>Offline Playback</span>
                        </button>
                      </div>

                      <div className="mobile-menu-divider"></div>

                      {/* Social Features */}
                      {user && (
                        <>
                          <div className="mobile-menu-section">
                            <div className="mobile-menu-section-title">Social Features</div>
                            
                            <button 
                              className="mobile-menu-item"
                              onClick={() => {
                                setShowSocialHub(true);
                                setShowMobileMenu(false);
                              }}
                            >
                              <span className="menu-icon">🌟</span>
                              <span>Social Hub</span>
                            </button>

                            <button 
                              className="mobile-menu-item"
                              onClick={() => {
                                if (userChannel) {
                                  setStreamDJChannel(userChannel);
                                  setShowStreamDJ(true);
                                  setShowMobileMenu(false);
                                } else {
                                  alert('Create a channel first to use Stream DJ!');
                                }
                              }}
                            >
                              <span className="menu-icon">🎵</span>
                              <span>Stream DJ</span>
                            </button>
                          </div>

                          <div className="mobile-menu-divider"></div>
                        </>
                      )}

                      {/* Settings & More */}
                      <div className="mobile-menu-section">
                        <div className="mobile-menu-section-title">More</div>
                        
                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            alert('Settings feature coming soon!');
                          }}
                        >
                          <span className="menu-icon">⚙️</span>
                          <span>Settings</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            alert('Help & Support: Contact us at support@streamfy.com');
                          }}
                        >
                          <span className="menu-icon">❓</span>
                          <span>Help & Support</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            alert('Send us your feedback at feedback@streamfy.com');
                          }}
                        >
                          <span className="menu-icon">💬</span>
                          <span>Send Feedback</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            alert('Streamfy v1.0\n\nA modern streaming platform for creators and viewers.\n\n© 2026 Streamfy');
                          }}
                        >
                          <span className="menu-icon">ℹ️</span>
                          <span>About</span>
                        </button>
                      </div>

                      <div className="mobile-menu-divider"></div>

                      {/* Logout */}
                      <button 
                        className="mobile-menu-item logout-item"
                        onClick={() => {
                          handleLogout();
                          setShowMobileMenu(false);
                        }}
                      >
                        <span className="menu-icon">🚪</span>
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Guest Navigation */}
                      <div className="mobile-menu-section">
                        <div className="mobile-menu-section-title">Navigation</div>
                        
                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🏠</span>
                          <span>Home</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowDiscover(true);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className="menu-icon">🔍</span>
                          <span>Discover</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            document.querySelector('.trending-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🔥</span>
                          <span>Trending</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            document.querySelector('.live-channels-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">📺</span>
                          <span>Live Channels</span>
                        </button>
                      </div>

                      <div className="mobile-menu-divider"></div>

                      {/* Categories for Guests */}
                      <div className="mobile-menu-section">
                        <div className="mobile-menu-section-title">Browse Categories</div>
                        
                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            document.querySelector('.category-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🎮</span>
                          <span>Gaming</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            const sections = document.querySelectorAll('.category-section');
                            sections[1]?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🎵</span>
                          <span>Music</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            const sections = document.querySelectorAll('.category-section');
                            sections[2]?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">💻</span>
                          <span>Tech & Education</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            const sections = document.querySelectorAll('.category-section');
                            sections[3]?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🎬</span>
                          <span>Entertainment</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            const sections = document.querySelectorAll('.category-section');
                            sections[4]?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">⚽</span>
                          <span>Sports & Fitness</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            const sections = document.querySelectorAll('.category-section');
                            sections[5]?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <span className="menu-icon">🎨</span>
                          <span>Creative Arts</span>
                        </button>
                      </div>

                      <div className="mobile-menu-divider"></div>

                      {/* More Options for Guests */}
                      <div className="mobile-menu-section">
                        <div className="mobile-menu-section-title">More</div>
                        
                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            alert('Help & Support: Contact us at support@streamfy.com');
                          }}
                        >
                          <span className="menu-icon">❓</span>
                          <span>Help & Support</span>
                        </button>

                        <button 
                          className="mobile-menu-item"
                          onClick={() => {
                            setShowMobileMenu(false);
                            alert('Streamfy v1.0\n\nA modern streaming platform for creators and viewers.\n\n© 2026 Streamfy');
                          }}
                        >
                          <span className="menu-icon">ℹ️</span>
                          <span>About</span>
                        </button>
                      </div>

                      <div className="mobile-menu-divider"></div>

                      {/* Sign Up for Guests */}
                      <button 
                        className="mobile-menu-item primary"
                        onClick={() => {
                          setAuthView('signup');
                          setShowMobileMenu(false);
                        }}
                      >
                        <span className="menu-icon">✨</span>
                        <span>Sign Up</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trending Now Section */}
          <div className="trending-section">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon">🔥</span>
                <h2>Trending Now</h2>
                <span className="trending-badge">HOT</span>
              </div>
              <p className="section-subtitle">Most watched streams right now</p>
            </div>
            <div className="trending-grid">
              {[
                { 
                  id: 'trending-1', 
                  name: 'Epic Gaming Marathon',
                  title: 'Epic Gaming Marathon', 
                  streamer: 'ProGamer', 
                  viewers: 12500, 
                  thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', 
                  category: 'Gaming',
                  icon: '🎮',
                  description: 'Non-stop gaming action with the best players',
                  color: '#667eea',
                  nowPlaying: 'Epic Gaming Marathon',
                  nextUp: 'Tournament Finals',
                  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ'
                },
                { 
                  id: 'trending-2', 
                  name: 'Live Music Concert',
                  title: 'Live Music Concert', 
                  streamer: 'DJ Luna', 
                  viewers: 8900, 
                  thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg', 
                  category: 'Music',
                  icon: '🎵',
                  description: 'Live music performances and DJ sets',
                  color: '#f093fb',
                  nowPlaying: 'Live Music Concert',
                  nextUp: 'Acoustic Session',
                  videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&loop=1&playlist=jfKfPfyJRdk'
                },
                { 
                  id: 'trending-3', 
                  name: 'Cooking Masterclass',
                  title: 'Cooking Masterclass', 
                  streamer: 'Chef Marco', 
                  viewers: 6700, 
                  thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg', 
                  category: 'Cooking',
                  icon: '🍳',
                  description: 'Learn to cook amazing dishes with expert chefs',
                  color: '#fb923c',
                  nowPlaying: 'Cooking Masterclass',
                  nextUp: 'Quick Recipes',
                  videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk?autoplay=1&mute=1&loop=1&playlist=kJQP7kiw5Fk'
                },
                { 
                  id: 'trending-4', 
                  name: 'Tech Review Live',
                  title: 'Tech Review Live', 
                  streamer: 'Tech Sarah', 
                  viewers: 5400, 
                  thumbnail: 'https://img.youtube.com/vi/rfscVS0vtbw/mqdefault.jpg', 
                  category: 'Tech',
                  icon: '💻',
                  description: 'Latest tech reviews and gadget unboxings',
                  color: '#4facfe',
                  nowPlaying: 'Tech Review Live',
                  nextUp: 'Coding Tutorial',
                  videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw?autoplay=1&mute=1&loop=1&playlist=rfscVS0vtbw'
                }
              ].map((stream) => (
                <div 
                  key={stream.id} 
                  className="trending-card"
                  onClick={() => {
                    setViewingLiveChannel(stream);
                    const username = user ? user.username : `Guest${Math.floor(Math.random() * 10000)}`;
                    socketRef.current.emit('join-room', { roomId: stream.id, username });
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="trending-thumbnail" style={{ backgroundImage: `url(${stream.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className="trending-overlay"></div>
                    <div className="live-badge">🔴 LIVE</div>
                    <div className="trending-viewers">
                      <span>👁️</span> {stream.viewers.toLocaleString()}
                    </div>
                  </div>
                  <div className="trending-info">
                    <h3>{stream.title}</h3>
                    <p className="trending-streamer">👤 {stream.streamer}</p>
                    <span className="trending-category">{stream.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Section */}
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-icon">🎥</div>
              <div className="stat-content">
                <h3>2,500+</h3>
                <p>Live Streams</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>150K+</h3>
                <p>Active Users</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <h3>500+</h3>
                <p>Creators</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌍</div>
              <div className="stat-content">
                <h3>50+</h3>
                <p>Countries</p>
              </div>
            </div>
          </div>

          {/* Reels Section */}
          <div className="reels-section">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon">📱</span>
                <h2>Trending Reels</h2>
                <span className="new-badge">NEW</span>
              </div>
              <p className="section-subtitle">Short videos from our community</p>
            </div>
            <div className="reels-container">
              <button className="reels-nav reels-nav-left" onClick={() => {
                const container = document.querySelector('.reels-scroll');
                container.scrollBy({ left: -300, behavior: 'smooth' });
              }}>‹</button>
              
              <div className="reels-scroll">
                {[
                  { 
                    id: 'reel-1', 
                    title: 'Epic Gaming Moment', 
                    name: 'Epic Gaming Moment',
                    creator: 'ProGamer', 
                    likes: 12500, 
                    views: 45000, 
                    viewers: 45000,
                    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', 
                    duration: '0:15',
                    category: 'Gaming',
                    icon: '🎮',
                    description: 'Epic gaming moments compilation',
                    color: '#667eea',
                    nowPlaying: 'Epic Gaming Moment',
                    nextUp: 'More Gaming Highlights',
                    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ'
                  },
                  { 
                    id: 'reel-2', 
                    title: 'Dance Challenge', 
                    name: 'Dance Challenge',
                    creator: 'DJ Luna', 
                    likes: 8900, 
                    views: 32000, 
                    viewers: 32000,
                    thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg', 
                    duration: '0:30',
                    category: 'Music',
                    icon: '🎵',
                    description: 'Trending dance challenge',
                    color: '#f093fb',
                    nowPlaying: 'Dance Challenge',
                    nextUp: 'More Dance Videos',
                    videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1&mute=1&loop=1&playlist=jNQXAC9IVRw'
                  },
                  { 
                    id: 'reel-3', 
                    title: 'Cooking Hack', 
                    name: 'Cooking Hack',
                    creator: 'Chef Marco', 
                    likes: 6700, 
                    views: 28000, 
                    viewers: 28000,
                    thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg', 
                    duration: '0:45',
                    category: 'Cooking',
                    icon: '🍳',
                    description: 'Quick cooking tips and hacks',
                    color: '#fb923c',
                    nowPlaying: 'Cooking Hack',
                    nextUp: 'More Cooking Tips',
                    videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk?autoplay=1&mute=1&loop=1&playlist=kJQP7kiw5Fk'
                  },
                  { 
                    id: 'reel-4', 
                    title: 'Tech Tips', 
                    name: 'Tech Tips',
                    creator: 'Tech Sarah', 
                    likes: 5400, 
                    views: 21000, 
                    viewers: 21000,
                    thumbnail: 'https://img.youtube.com/vi/60ItHLz5WEA/mqdefault.jpg', 
                    duration: '0:20',
                    category: 'Technology',
                    icon: '💻',
                    description: 'Quick tech tips and tricks',
                    color: '#4facfe',
                    nowPlaying: 'Tech Tips',
                    nextUp: 'More Tech Content',
                    videoUrl: 'https://www.youtube.com/embed/60ItHLz5WEA?autoplay=1&mute=1&loop=1&playlist=60ItHLz5WEA'
                  },
                  { 
                    id: 'reel-5', 
                    title: 'Fitness Routine', 
                    name: 'Fitness Routine',
                    creator: 'Fitness Alex', 
                    likes: 9200, 
                    views: 38000, 
                    viewers: 38000,
                    thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/mqdefault.jpg', 
                    duration: '0:25',
                    category: 'Fitness',
                    icon: '💪',
                    description: 'Quick fitness workout routine',
                    color: '#10b981',
                    nowPlaying: 'Fitness Routine',
                    nextUp: 'More Workouts',
                    videoUrl: 'https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&mute=1&loop=1&playlist=5qap5aO4i9A'
                  },
                  { 
                    id: 'reel-6', 
                    title: 'Art Tutorial', 
                    name: 'Art Tutorial',
                    creator: 'Artist Emma', 
                    likes: 7800, 
                    views: 29000, 
                    viewers: 29000,
                    thumbnail: 'https://img.youtube.com/vi/ktvTqknDobU/mqdefault.jpg', 
                    duration: '0:40',
                    category: 'Art',
                    icon: '🎨',
                    description: 'Digital art tutorial',
                    color: '#a78bfa',
                    nowPlaying: 'Art Tutorial',
                    nextUp: 'More Art Content',
                    videoUrl: 'https://www.youtube.com/embed/ktvTqknDobU?autoplay=1&mute=1&loop=1&playlist=ktvTqknDobU'
                  },
                  { 
                    id: 'reel-7', 
                    title: 'Comedy Skit', 
                    name: 'Comedy Skit',
                    creator: 'Funny Mike', 
                    likes: 11000, 
                    views: 42000, 
                    viewers: 42000,
                    thumbnail: 'https://img.youtube.com/vi/rfscVS0vtbw/mqdefault.jpg', 
                    duration: '0:35',
                    category: 'Entertainment',
                    icon: '🎬',
                    description: 'Hilarious comedy skit',
                    color: '#fa709a',
                    nowPlaying: 'Comedy Skit',
                    nextUp: 'More Comedy',
                    videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw?autoplay=1&mute=1&loop=1&playlist=rfscVS0vtbw'
                  },
                  { 
                    id: 'reel-8', 
                    title: 'Travel Vlog', 
                    name: 'Travel Vlog',
                    creator: 'Wanderer', 
                    likes: 6500, 
                    views: 25000, 
                    viewers: 25000,
                    thumbnail: 'https://img.youtube.com/vi/Mus_vwhTCq0/mqdefault.jpg', 
                    duration: '0:50',
                    category: 'Travel',
                    icon: '✈️',
                    description: 'Amazing travel destinations',
                    color: '#30cfd0',
                    nowPlaying: 'Travel Vlog',
                    nextUp: 'More Travel Content',
                    videoUrl: 'https://www.youtube.com/embed/Mus_vwhTCq0?autoplay=1&mute=1&loop=1&playlist=Mus_vwhTCq0'
                  }
                ].map((reel) => (
                  <div 
                    key={reel.id} 
                    className="reel-card"
                    onClick={() => {
                      setViewingLiveChannel(reel);
                      const username = user ? user.username : `Guest${Math.floor(Math.random() * 10000)}`;
                      socketRef.current.emit('join-room', { roomId: reel.id, username });
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div 
                      className="reel-video"
                      style={{ 
                        backgroundImage: `url(${reel.thumbnail})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="reel-overlay"></div>
                      <div className="reel-play-btn">▶</div>
                      <div className="reel-duration">{reel.duration}</div>
                      
                      <div className="reel-actions">
                        <button className="reel-action-btn" onClick={(e) => e.stopPropagation()}>
                          <span className="action-icon">❤️</span>
                          <span className="action-count">{(reel.likes / 1000).toFixed(1)}K</span>
                        </button>
                        <button className="reel-action-btn" onClick={(e) => e.stopPropagation()}>
                          <span className="action-icon">💬</span>
                          <span className="action-count">{Math.floor(reel.likes / 10)}</span>
                        </button>
                        <button className="reel-action-btn" onClick={(e) => e.stopPropagation()}>
                          <span className="action-icon">🔗</span>
                          <span className="action-count">Share</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="reel-info">
                      <div className="reel-creator">
                        <div className="creator-avatar">{reel.creator.charAt(0)}</div>
                        <div className="creator-details">
                          <h4>{reel.title}</h4>
                          <p>@{reel.creator}</p>
                        </div>
                      </div>
                      <div className="reel-stats">
                        <span>👁️ {(reel.views / 1000).toFixed(1)}K views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="reels-nav reels-nav-right" onClick={() => {
                const container = document.querySelector('.reels-scroll');
                container.scrollBy({ left: 300, behavior: 'smooth' });
              }}>›</button>
            </div>
          </div>

          {/* Live TV Channels Section */}
          <div className="live-channels-section">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon">📺</span>
                <h2>Live TV Channels</h2>
                <span className="live-pulse">● LIVE</span>
              </div>
              <p className="section-subtitle">Watch 24/7 streaming channels</p>
            </div>
            
            <div className="channels-grid">
              {liveChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="channel-card"
                  onClick={() => {
                    setViewingLiveChannel(channel);
                    saveToWatchHistory(channel);
                    const username = user ? user.username : `Guest${Math.floor(Math.random() * 10000)}`;
                    socketRef.current.emit('join-room', { roomId: channel.id, username });
                  }}
                >
                  <div className="channel-preview" style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Live Video Player */}
                    <div className="live-video-container">
                      <iframe
                        src={channel.videoUrl}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none'
                        }}
                      ></iframe>
                      
                      {/* Overlay for click interaction */}
                      <div className="video-overlay-click" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'transparent',
                        cursor: 'pointer',
                        zIndex: 1
                      }}></div>
                    </div>
                    
                    <div className="channel-live-indicator">
                      <span className="live-dot"></span>
                      LIVE
                    </div>
                    <div className="channel-viewers">
                      <span>👁️</span> {channel.viewers.toLocaleString()}
                    </div>
                  </div>
                  <div className="channel-details">
                    <h3>{channel.name}</h3>
                    <p className="channel-category">{channel.category}</p>
                    <div className="now-playing">
                      <div className="now-playing-label">
                        <span className="play-icon">▶</span>
                        NOW PLAYING
                      </div>
                      <div className="now-playing-title">{channel.nowPlaying}</div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.random() * 60 + 20}%` }}></div>
                      </div>
                    </div>
                    <div className="next-up">
                      <span className="next-label">NEXT:</span> {channel.nextUp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Streamers Section */}
          <div className="featured-streamers-section">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon">⭐</span>
                <h2>Featured Streamers</h2>
                <span className="trending-badge">TRENDING</span>
              </div>
              <p className="section-subtitle">Follow your favorite content creators</p>
            </div>
            
            <div className="streamers-grid">
              {featuredStreamers.map((streamer) => (
                <div key={streamer.id} className="streamer-card">
                  <div className="streamer-banner" style={{ background: `linear-gradient(135deg, ${streamer.color}66 0%, ${streamer.color}99 100%)` }}>
                    {streamer.isLive && (
                      <div className="streamer-live-badge">
                        <span className="live-dot"></span>
                        LIVE
                      </div>
                    )}
                    <div className="streamer-avatar">{streamer.avatar}</div>
                  </div>
                  
                  <div className="streamer-info">
                    <h3>{streamer.name}</h3>
                    <p className="streamer-category">{streamer.category}</p>
                    
                    <div className="streamer-stats">
                      <div className="stat">
                        <span className="stat-icon">👥</span>
                        <span className="stat-value">{streamer.followers.toLocaleString()}</span>
                        <span className="stat-label">Followers</span>
                      </div>
                      {streamer.isLive && (
                        <div className="stat">
                          <span className="stat-icon">👁️</span>
                          <span className="stat-value">{streamer.viewers.toLocaleString()}</span>
                          <span className="stat-label">Watching</span>
                        </div>
                      )}
                    </div>

                    <div className="streamer-actions">
                      <button 
                        className={`follow-btn ${followedStreamers.includes(streamer.id) ? 'following' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollow(streamer.id);
                        }}
                      >
                        {followedStreamers.includes(streamer.id) ? (
                          <>
                            <span>✓</span> Following
                          </>
                        ) : (
                          <>
                            <span>+</span> Follow
                          </>
                        )}
                      </button>
                      
                      {streamer.isLive && (
                        <button 
                          className="watch-btn"
                          onClick={() => {
                            setViewingLiveChannel(streamer);
                            saveToWatchHistory(streamer);
                            const username = user ? user.username : `Guest${Math.floor(Math.random() * 10000)}`;
                            socketRef.current.emit('join-room', { roomId: streamer.roomId, username });
                          }}
                        >
                          Watch Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations Section */}
          <Suspense fallback={<div>Loading recommendations...</div>}>
            <AIRecommendations 
              user={user}
              onVideoClick={(video) => {
                setViewingLiveChannel(video);
                saveToWatchHistory(video);
                const username = user ? user.username : `Guest${Math.floor(Math.random() * 10000)}`;
                socketRef.current.emit('join-room', { roomId: video.id, username });
              }}
            />
          </Suspense>

          {/* User Channels Section */}
          {allChannels.length > 0 && (
            <div className="user-channels-section">
              <div className="section-header">
                <div className="section-title">
                  <span className="section-icon">🎬</span>
                  <h2>User Channels</h2>
                  <span className="new-badge">NEW</span>
                </div>
                <p className="section-subtitle">Discover channels created by our community</p>
              </div>
              
              <div className="channels-grid">
                {allChannels.map((channel) => (
                  <div 
                    key={channel.id} 
                    className="user-channel-card"
                    onClick={() => setViewingChannel(channel.id)}
                  >
                    <div className="user-channel-header">
                      <div className="channel-avatar-medium">{channel.avatar}</div>
                      {channel.isLive && (
                        <div className="channel-live-badge">
                          <span className="live-dot"></span>
                          LIVE
                        </div>
                      )}
                    </div>
                    <div className="user-channel-info">
                      <h3>{channel.name}</h3>
                      <p className="channel-owner-name">by {channel.ownerName}</p>
                      <p className="channel-desc">{channel.description}</p>
                      <div className="channel-meta">
                        <span className="meta-item">
                          <span className="meta-icon">👥</span>
                          {channel.subscribers || 0}
                        </span>
                        <span className="meta-badge">{channel.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="categories-container">
            {categories.map((category) => (
              <div key={category.name} className="category-section">
                <div className="category-header">
                  <span className="category-icon">{category.icon}</span>
                  <h2>{category.name}</h2>
                  <span className="category-badge">LIVE</span>
                </div>
                
                <div className="streams-grid">
                  {category.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="stream-card"
                      onClick={() => {
                        const channelData = {
                          id: room.id,
                          name: room.name,
                          icon: category.icon,
                          category: category.name,
                          viewers: room.viewers,
                          description: `Watch ${room.name} live with ${room.streamer}`,
                          color: category.color,
                          nowPlaying: room.name,
                          nextUp: 'More great content',
                          videoUrl: `https://www.youtube.com/embed/${room.videoId}?autoplay=1&mute=1&loop=1&playlist=${room.videoId}`
                        };
                        setViewingLiveChannel(channelData);
                        const username = user ? user.username : `Guest${Math.floor(Math.random() * 10000)}`;
                        socketRef.current.emit('join-room', { roomId: room.id, username });
                      }}
                    >
                      <div className="stream-thumbnail" style={{ backgroundImage: `url(${room.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        <div className="thumbnail-overlay"></div>
                        <div className="live-badge">🔴 LIVE</div>
                        <div className="viewer-count">
                          <span>👁️</span> {room.viewers.toLocaleString()}
                        </div>
                      </div>
                      <div className="stream-info">
                        <h3>{room.name}</h3>
                        <p className="stream-category">
                          <span className="streamer-name">👤 {room.streamer}</span>
                        </p>
                        <div className="stream-id">ID: {room.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Platform Stats Section */}
          <div className="stats-section-2026">
            <div className="stats-grid-2026">
              <div className="stat-card-2026">
                <div className="stat-number-2026">2.5K+</div>
                <div className="stat-label-2026">Live Streams</div>
              </div>
              <div className="stat-card-2026">
                <div className="stat-number-2026">150K+</div>
                <div className="stat-label-2026">Active Users</div>
              </div>
              <div className="stat-card-2026">
                <div className="stat-number-2026">500+</div>
                <div className="stat-label-2026">Creators</div>
              </div>
              <div className="stat-card-2026">
                <div className="stat-number-2026">50+</div>
                <div className="stat-label-2026">Countries</div>
              </div>
            </div>
          </div>

          <div className="create-stream-cta">
            <div className="cta-content">
              <h2>🎥 Ready to Go Live?</h2>
              <p>Create your own stream and connect with viewers worldwide</p>
              <div className="cta-input">
                <input
                  type="text"
                  placeholder="Enter your custom room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
                <button onClick={handleJoinRoom} disabled={!roomId.trim()}>
                  Create Stream
                </button>
              </div>
            </div>
          </div>

          {/* Floating Sign Up Button for Guests */}
          {!user && (
            <button 
              className="floating-auth-btn"
              onClick={() => setAuthView('signup')}
            >
              <span className="icon">🚀</span>
              <span>Sign Up to Stream</span>
            </button>
          )}

          {/* PWA Install Button */}
          {showInstallButton && (
            <button 
              className="floating-install-btn"
              onClick={handleInstallClick}
              style={{
                position: 'fixed',
                bottom: user ? '20px' : '90px',
                right: '20px',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.5)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.5)';
              }}
            >
              <span style={{ fontSize: '18px' }}>📱</span>
              <span>Install App</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="stream-container">
        <div className="header">
          <div className="tv-logo-header">
            <span className="logo-text">Streamfy</span>
          </div>
          <div className="header-info">
            <span className="stream-room-id">📺 {roomId}</span>
            {user ? (
              <>
                <span>Welcome, {user.username}</span>
                <button onClick={handleLogout} className="logout-btn-header">Logout</button>
              </>
            ) : (
              <>
                <span className="guest-badge">👤 Guest Mode</span>
                <button onClick={() => { setJoined(false); setAuthView('signup'); }} className="signup-btn-header">
                  Sign Up to Stream
                </button>
              </>
            )}
          </div>
        </div>

        <div className="main-content">
          <div className="video-section">
            <div className="stream-stats">
              <div className="stat-item">
                <span className="stat-icon">👁️</span>
                <span className="stat-value">{viewers}</span>
                <span className="stat-label">Viewers</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💬</span>
                <span className="stat-value">{messages.length}</span>
                <span className="stat-label">Messages</span>
              </div>
              {isStreaming && (
                <div className="live-indicator">
                  <span className="live-dot"></span>
                  LIVE
                </div>
              )}
            </div>

            <div className="controls">
              {!isStreaming ? (
                <button className="btn-primary btn-large" onClick={startStreaming}>
                  <span className="btn-icon">🎥</span>
                  Go Live
                </button>
              ) : (
                <>
                  <button className="btn-danger" onClick={stopStreaming}>
                    <span className="btn-icon">⏹️</span>
                    Stop Stream
                  </button>
                  {!isScreenSharing ? (
                    <button className="btn-secondary" onClick={startScreenShare}>
                      <span className="btn-icon">🖥️</span>
                      Share Screen
                    </button>
                  ) : (
                    <button className="btn-secondary" onClick={stopScreenShare}>
                      <span className="btn-icon">📹</span>
                      Stop Sharing
                    </button>
                  )}
                  <select 
                    className="quality-select"
                    value={streamQuality}
                    onChange={(e) => setStreamQuality(e.target.value)}
                  >
                    <option value="high">HD Quality</option>
                    <option value="medium">Standard</option>
                    <option value="low">Low Bandwidth</option>
                  </select>
                </>
              )}
            </div>

            <div className="video-grid">
              {isStreaming && (
                <div className="video-wrapper main-video">
                  <video ref={localVideoRef} autoPlay muted playsInline />
                  <div className="video-overlay">
                    <div className="video-label">
                      <span className="label-icon">⭐</span>
                      You {isScreenSharing ? '(Screen)' : '(Camera)'}
                    </div>
                  </div>
                  {reactions.map(reaction => (
                    <div 
                      key={reaction.id} 
                      className="reaction-float"
                      style={{
                        left: `${Math.random() * 80 + 10}%`,
                        animationDuration: `${2 + Math.random()}s`
                      }}
                    >
                      {reaction.emoji}
                    </div>
                  ))}
                </div>
              )}
              
              {Object.entries(remoteVideosRef.current).map(([userId, stream]) => (
                <div key={userId} className="video-wrapper">
                  <video
                    autoPlay
                    playsInline
                    ref={el => {
                      if (el && el.srcObject !== stream) {
                        el.srcObject = stream;
                      }
                    }}
                  />
                  <div className="video-overlay">
                    <div className="video-label">
                      <span className="label-icon">👤</span>
                      Viewer
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!isStreaming && Object.keys(remoteVideosRef.current).length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🎬</div>
                <h3>No Active Streams</h3>
                <p>Click "Go Live" to start streaming or wait for others to join</p>
              </div>
            )}
          </div>

          <div className="chat-section">
            <div className="chat-header">
              <h2>💬 Live Chat</h2>
              <span className="online-badge">{viewers} online</span>
            </div>
            
            <div className="reactions-bar">
              {['❤️', '👍', '🔥', '😂', '😮', '👏'].map(emoji => (
                <button 
                  key={emoji}
                  className="reaction-btn"
                  onClick={() => sendReaction(emoji)}
                  title="Send reaction"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <p>No messages yet. Start the conversation! 👋</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="chat-message">
                    <div className="message-avatar">
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <strong>{msg.username}</strong>
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="message-text">{msg.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="chat-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage}>
                <span>Send</span>
                <span className="send-icon">➤</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
