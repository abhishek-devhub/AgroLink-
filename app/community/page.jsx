'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import styles from './community.module.css';

const CATEGORIES = [
  { key: 'all', label: '🌐 All', color: '#616161' },
  { key: 'pest-control', label: '🐛 Pest Control', color: '#c62828' },
  { key: 'techniques', label: '🌱 Techniques', color: '#2e7d32' },
  { key: 'market-tips', label: '💰 Market Tips', color: '#f57f17' },
  { key: 'weather', label: '🌦️ Weather', color: '#1565c0' },
  { key: 'success-story', label: '🏆 Success Stories', color: '#7b1fa2' },
  { key: 'general', label: '💬 General', color: '#616161' },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('recent');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('text'); // text | voice
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' });
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyText, setReplyText] = useState({});
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchPosts();
  }, [category, sort]);

  const fetchPosts = () => {
    const params = new URLSearchParams();
    if (category !== 'all') params.append('category', category);
    params.append('sort', sort);
    fetch(`/api/community?${params.toString()}`)
      .then(r => r.json())
      .then(setPosts)
      .catch(() => {});
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
    setTranscript('');
    setRecordingTime(0);
    setNewPost({ title: '', content: '', category: 'general' });
  };

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + ' ';
      }
      setTranscript(text.trim());
    };

    recognition.onerror = () => {
      setIsRecording(false);
      clearInterval(timerRef.current);
    };

    recognition.onend = () => {
      setIsRecording(false);
      clearInterval(timerRef.current);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime(t => t + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  const submitPost = async () => {
    if (!user) return;
    const body = {
      authorId: user.id,
      authorName: user.name || user.ownerName || 'Anonymous',
      authorRole: user.role,
      type: modalType,
      category: newPost.category,
      title: newPost.title,
      content: modalType === 'voice' ? '' : newPost.content,
      audioTranscript: modalType === 'voice' ? transcript : '',
    };

    await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setShowModal(false);
    fetchPosts();
  };

  const handleUpvote = async (postId) => {
    if (!user) return;
    await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upvote', postId, userId: user.id }),
    });
    // Optimistic UI update
    setPosts(prev => prev.map(p =>
      p._id === postId
        ? { ...p, upvotes: p.upvotes?.includes?.(user.id) ? p.upvotes.filter(id => id !== user.id) : [...(p.upvotes || []), user.id] }
        : p
    ));
  };

  const submitReply = async (postId) => {
    if (!user || !replyText[postId]?.trim()) return;
    await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reply',
        postId,
        authorId: user.id,
        authorName: user.name || user.ownerName || 'Anonymous',
        authorRole: user.role,
        content: replyText[postId],
      }),
    });
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p._id === postId
        ? {
          ...p,
          replies: [...(p.replies || []), {
            authorName: user.name || user.ownerName || 'Anonymous',
            authorRole: user.role,
            content: replyText[postId],
            createdAt: new Date().toISOString(),
          }]
        }
        : p
    ));
    setReplyText(prev => ({ ...prev, [postId]: '' }));
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={styles.communityWrap}>
      <div className="page-container">
        {/* Header */}
        <div className={styles.header}>
          <h1>🌾 Community Knowledge Hub</h1>
          <p>Share farming tips, ask questions, and learn from fellow farmers. Post with your voice — no typing needed!</p>
        </div>

        {/* Controls */}
        <div className={styles.controlsBar}>
          <div className={styles.categoryTabs}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`${styles.categoryTab} ${category === cat.key ? styles.active : ''}`}
                onClick={() => setCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="recent">Most Recent</option>
            <option value="popular">Most Viewed</option>
            <option value="upvoted">Most Helpful</option>
          </select>
          {user && (
            <>
              <button className={styles.newPostBtn} onClick={() => openModal('text')}>
                ✏️ Write Post
              </button>
              <button className={styles.newPostBtn} style={{ background: 'linear-gradient(135deg, var(--danger), #e74c3c)' }} onClick={() => openModal('voice')}>
                🎙️ Voice Post
              </button>
            </>
          )}
        </div>

        {/* Posts Feed */}
        <div className={styles.postsGrid}>
          {posts.length === 0 ? (
            <div className={styles.emptyState}>
              <span style={{ fontSize: '3rem' }}>🌿</span>
              <p>No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post._id} className={`${styles.postCard} ${styles[post.type] || ''}`}>
                {/* Post Header */}
                <div className={styles.postHeader}>
                  <div className={styles.authorInfo}>
                    <div className={`${styles.authorAvatar} ${styles[post.authorRole]}`}>
                      {post.authorRole === 'farmer' ? '🧑‍🌾' : '🏪'}
                    </div>
                    <div>
                      <div className={styles.authorName}>
                        {post.authorName}
                        {post.isExpert && <span className={styles.expertBadge}>⭐ Expert</span>}
                      </div>
                      <div className={styles.authorMeta}>
                        {timeAgo(post.createdAt)} · {post.views || 0} views
                      </div>
                    </div>
                  </div>
                  <div className={styles.postTags}>
                    <span className={`${styles.categoryBadge} ${styles[post.category]}`}>
                      {CATEGORIES.find(c => c.key === post.category)?.label || post.category}
                    </span>
                    {post.type === 'voice' && <span className={styles.typeBadge}>🎙️ Voice</span>}
                    {post.type === 'question' && <span className={styles.typeBadge}>❓ Question</span>}
                    {post.type === 'tip' && <span className={styles.typeBadge}>💡 Tip</span>}
                  </div>
                </div>

                {/* Title & Content */}
                <h3 className={styles.postTitle}>{post.title}</h3>

                {/* Voice indicator */}
                {post.type === 'voice' && (
                  <div className={styles.voiceIndicator}>
                    <div className={styles.waveform}>
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className={styles.waveBar}></div>
                      ))}
                    </div>
                    <span className={styles.voiceLabel}>Voice Recording</span>
                  </div>
                )}

                {post.content && <p className={styles.postContent}>{post.content}</p>}

                {post.audioTranscript && (
                  <div className={styles.transcript}>
                    📝 Transcript: &ldquo;{post.audioTranscript}&rdquo;
                  </div>
                )}

                {/* Footer */}
                <div className={styles.postFooter}>
                  <button
                    className={`${styles.footerAction} ${user && post.upvotes?.includes?.(user.id) ? styles.upvoted : ''}`}
                    onClick={() => handleUpvote(post._id)}
                  >
                    👍 {post.upvotes?.length || 0} Helpful
                  </button>
                  <button
                    className={styles.footerAction}
                    onClick={() => setExpandedReplies(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                  >
                    💬 {post.replies?.length || 0} Replies
                  </button>
                </div>

                {/* Replies Expansion */}
                {expandedReplies[post._id] && (
                  <div className={styles.repliesSection}>
                    <div className={styles.repliesTitle}>Replies ({post.replies?.length || 0})</div>
                    {post.replies?.map((reply, i) => (
                      <div key={i} className={styles.replyItem}>
                        <div className={styles.replyAvatar}>
                          {reply.authorRole === 'farmer' ? '🧑‍🌾' : '🏪'}
                        </div>
                        <div className={styles.replyContent}>
                          <div className={styles.replyAuthor}>{reply.authorName}</div>
                          <div className={styles.replyText}>{reply.content}</div>
                          <div className={styles.replyTime}>{reply.createdAt ? timeAgo(reply.createdAt) : ''}</div>
                        </div>
                      </div>
                    ))}
                    {user && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <input
                          placeholder="Write a reply..."
                          value={replyText[post._id] || ''}
                          onChange={e => setReplyText(prev => ({ ...prev, [post._id]: e.target.value }))}
                          style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1.5px solid #d0c8be', fontSize: '0.88rem' }}
                          onKeyDown={e => e.key === 'Enter' && submitReply(post._id)}
                        />
                        <button
                          className="btn-primary"
                          style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
                          onClick={() => submitReply(post._id)}
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Create Post Modal */}
        {showModal && (
          <div className={styles.recordingOverlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div className={styles.recordingModal}>
              <h2 className={styles.modalTitle}>
                {modalType === 'voice' ? '🎙️ Create Voice Post' : '✏️ Create Post'}
              </h2>

              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  placeholder="Give your post a clear title..."
                  value={newPost.title}
                  onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>
                <select
                  value={newPost.category}
                  onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.filter(c => c.key !== 'all').map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {modalType === 'voice' ? (
                <>
                  {isRecording && (
                    <>
                      <div className={styles.recordingTime}>{formatTime(recordingTime)}</div>
                      <div className={styles.liveWaveform}>
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className={styles.liveWaveBar} style={{ animationDelay: `${i * 0.1}s` }}></div>
                        ))}
                      </div>
                    </>
                  )}

                  <button
                    className={`${styles.recordBtn} ${isRecording ? styles.recording : styles.idle}`}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? '⏹' : '🎤'}
                  </button>

                  <p className={styles.recordingHint}>
                    {isRecording ? 'Listening... tap to stop' : transcript ? 'Recording complete. Edit transcript below or re-record.' : 'Tap the microphone to start recording'}
                  </p>

                  {transcript && (
                    <div className={styles.formGroup}>
                      <label>Transcript (auto-generated)</label>
                      <textarea
                        rows={4}
                        value={transcript}
                        onChange={e => setTranscript(e.target.value)}
                        style={{ fontStyle: 'italic' }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.formGroup}>
                  <label>Content</label>
                  <textarea
                    rows={5}
                    placeholder="Share your knowledge, ask a question, or tell your success story..."
                    value={newPost.content}
                    onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                  />
                </div>
              )}

              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => { setShowModal(false); stopRecording(); }}>
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  disabled={!newPost.title || (modalType === 'text' && !newPost.content) || (modalType === 'voice' && !transcript)}
                  onClick={submitPost}
                >
                  Publish Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
