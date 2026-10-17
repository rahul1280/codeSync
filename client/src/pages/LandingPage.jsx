import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Users,
  Zap,
  MessageSquare,
  History,
  Terminal,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import Button from '../components/common/Button';
import CreateRoomModal from '../components/rooms/CreateRoomModal';
import JoinRoomModal from '../components/rooms/JoinRoomModal';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleStartCreate = () => {
    if (isAuthenticated) {
      setShowCreateModal(true);
    } else {
      navigate('/login?redirect=create');
    }
  };

  const handleStartJoin = () => {
    if (isAuthenticated) {
      setShowJoinModal(true);
    } else {
      navigate('/login?redirect=join');
    }
  };

  const handleRoomCreated = (room) => {
    navigate(`/room/${room._id || room.id}`);
  };

  const handleRoomJoined = (room) => {
    navigate(`/room/${room._id || room.id}`);
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={16} />
          <span>Next-Generation Real-Time Coding</span>
        </div>

        <h1 className="hero-title">
          Real-Time Collaborative <span>Coding Platform</span>
        </h1>

        <p className="hero-subtitle">
          Code together with teammates seamlessly. High-performance collaborative editing powered by Yjs, instant code execution, integrated chat, and revision tracking.
        </p>

        <div className="hero-cta">
          <Button
            size="lg"
            variant="primary"
            icon={Zap}
            onClick={handleStartCreate}
          >
            Create a Room
          </Button>
          <Button
            size="lg"
            variant="secondary"
            icon={Users}
            onClick={handleStartJoin}
          >
            Join with Code
          </Button>
        </div>

        {/* Workspace Preview */}
        <div className="hero-preview">
          <div className="preview-bar">
            <div className="preview-dots">
              <span className="preview-dot dot-red" />
              <span className="preview-dot dot-yellow" />
              <span className="preview-dot dot-green" />
            </div>
            <span className="preview-title">codesync // algorithm-session.js</span>
          </div>
          <div className="preview-code-mock">
            <span style={{ color: '#6e7681' }}>// Collaborative quicksort implementation in real-time</span><br />
            <span style={{ color: '#ff7b72' }}>function</span> <span style={{ color: '#d2a8ff' }}>quickSort</span>(<span style={{ color: '#ffa657' }}>arr</span>) &#123;<br />
            &nbsp;&nbsp;<span style={{ color: '#ff7b72' }}>if</span> (arr.length &lt;= 1) <span style={{ color: '#ff7b72' }}>return</span> arr;<br />
            &nbsp;&nbsp;<span style={{ color: '#ff7b72' }}>const</span> pivot = arr[Math.floor(arr.length / 2)];<br />
            &nbsp;&nbsp;<span style={{ color: '#ff7b72' }}>const</span> left = arr.filter(x =&gt; x &lt; pivot); <span style={{ color: '#58a6ff', backgroundColor: 'rgba(88, 166, 255, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>| Sarah is typing...</span><br />
            &nbsp;&nbsp;<span style={{ color: '#ff7b72' }}>const</span> middle = arr.filter(x =&gt; x === pivot);<br />
            &nbsp;&nbsp;<span style={{ color: '#ff7b72' }}>const</span> right = arr.filter(x =&gt; x &gt; pivot);<br />
            &nbsp;&nbsp;<span style={{ color: '#ff7b72' }}>return</span> [...quickSort(left), ...middle, ...quickSort(right)];<br />
            &#125;
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Engineered for Seamless Engineering</h2>
          <p className="section-subtitle">
            Everything your team needs to pair program, debug, and ship algorithms together.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Zap size={24} />
            </div>
            <h3 className="feature-title">Real-Time Sync (CRDT)</h3>
            <p className="feature-desc">
              Conflict-free replicated data types via Yjs ensure zero merge conflicts and instant keystroke replication.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Users size={24} />
            </div>
            <h3 className="feature-title">Multi-User Presence</h3>
            <p className="feature-desc">
              See collaborator cursor positions, selections, and presence in real time with distinct participant indicators.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Terminal size={24} />
            </div>
            <h3 className="feature-title">Instant Sandbox Execution</h3>
            <p className="feature-desc">
              Execute JavaScript, Python, C++, Java, and more directly in your browser with real-time terminal output.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <MessageSquare size={24} />
            </div>
            <h3 className="feature-title">Contextual Room Chat</h3>
            <p className="feature-desc">
              Discuss architecture and coordinate changes without switching tabs using embedded live messaging.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <History size={24} />
            </div>
            <h3 className="feature-title">Granular Version Snapshots</h3>
            <p className="feature-desc">
              Every save point creates an immutable snapshot. Inspect changes and restore any previous version instantly.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Sparkles size={24} />
            </div>
            <h3 className="feature-title">AI-Powered Insights</h3>
            <p className="feature-desc">
              Get explanations and automated test suggestions directly from the integrated AI assistant.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Start collaborating in less than 30 seconds</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create a Room</h3>
            <p>Pick your primary language and initialize your workspace with a single click.</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Invite Teammates</h3>
            <p>Copy your unique room invitation link or share the 8-digit access code.</p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Build & Execute Together</h3>
            <p>Write code simultaneously, run algorithms, and inspect outputs side-by-side.</p>
          </div>
        </div>
      </section>

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleRoomCreated}
      />

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoined={handleRoomJoined}
      />
    </div>
  );
}
