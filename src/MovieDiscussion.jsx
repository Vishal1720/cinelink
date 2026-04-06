import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from './supabase';
import './MovieDiscussion.css';
import UserHeader from './UserHeader';

const PAGE_SIZE = 10;

const MovieDiscussion = () => {
  const { id: movieId } = useParams();

  const [movie, setMovie] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const channelRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  const getInitials = (email) =>
    email ? email.split('@')[0].substring(0, 2).toUpperCase() : 'U';

  const getDisplayName = (email) =>
    email
      ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      : 'Anonymous';

  /* ------------------ Auth ------------------ */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });
  }, []);

  /* ------------------ Fetch Movie ------------------ */
  useEffect(() => {
    const fetchMovie = async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', movieId)
        .single();
      if (!error) setMovie(data);
    };
    fetchMovie();
  }, [movieId]);

  /* ------------------ Fetch Initial Messages ------------------ */
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('discussion')
        .select(`*, user:user_email (avatar_url)`)
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (!error) {
        setMessages((data || []).reverse());
        setHasMore((data || []).length === PAGE_SIZE);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [movieId]);

  /* ------------------ Load More (scroll up) ------------------ */
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextPage = page + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    const { data, error } = await supabase
      .from('discussion')
      .select(`*, user:user_email (avatar_url)`)
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setMessages((prev) => [...data.reverse(), ...prev]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(nextPage);

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    }

    setLoadingMore(false);
  };

  /* ------------------ Scroll Handler ------------------ */
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  /* ------------------ Realtime ------------------ */
  useEffect(() => {
    if (!movieId) return;

    const channel = supabase
      .channel(`discussion:movie:${movieId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion',
          filter: `movie_id=eq.${movieId}`,
        },
        async (payload) => {
          const newMsg = payload.new;

          const { data: userRows, error } = await supabase
            .from('user')
            .select('email, avatar_url, name')
            .eq('email', newMsg.user_email)
            .limit(1);

          const user = !error && userRows?.length ? userRows[0] : null;

          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, user }];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [movieId]);

  useEffect(scrollToBottom, [messages]);

  /* ------------------ Send Message ------------------ */
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || sending) return;
    setSending(true);

    const { error } = await supabase.from('discussion').insert({
      movie_id: movieId,
      user_email: currentUser.email,
      message: newMessage.trim(),
    });

    if (!error) setNewMessage('');
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!movie) return <div className="loading-state">Loading movie...</div>;

  return (
    <>
      <UserHeader />
      <div className="movie-discussion-container">

        {/* Movie Info */}
        <aside className="movie-sidebar">
          <img src={movie.poster_url} alt={movie.title} />
          <h2>{movie.title}</h2>
          <p className="meta">
            {movie.year} • {movie.duration} • {movie.language}
          </p>
        </aside>

        {/* Discussion */}
        <section className="discussion-section">
          <header className="discussion-header">
            <h1>Discussion</h1>
            <span>{messages.length} messages</span>
          </header>

          <div
            className="messages"
            ref={messagesContainerRef}
            onScroll={handleScroll}
          >
            {loadingMore && (
              <p style={{ textAlign: 'center', color: '#64748B', padding: '0.5rem' }}>
                Loading...
              </p>
            )}
            {!hasMore && messages.length > 0 && (
              <p style={{ textAlign: 'center', color: '#64748B', padding: '0.5rem', fontSize: '0.75rem' }}>
                All messages loaded
              </p>
            )}

            {loading ? (
              <p>Loading messages...</p>
            ) : messages.length === 0 ? (
              <p>No messages yet. Start the discussion!</p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.user_email === currentUser?.email;
                return (
                  <div key={msg.id} className={`message ${isOwn ? 'own' : ''}`}>
                    <img
                      className="avatar-img"
                      src={msg.user?.avatar_url || 'https://via.placeholder.com/40'}
                      alt={msg.user?.name || 'User'}
                    />
                    <div className="content">
                      <p>{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="message-input-box">
            <input
              type="text"
              placeholder={currentUser ? 'Share your thoughts...' : 'Login to participate'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={!currentUser || sending}
            />
            <button onClick={sendMessage} disabled={!newMessage.trim() || sending}>
              Send
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default MovieDiscussion;