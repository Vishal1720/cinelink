import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from './supabase';
import './MovieDiscussion.css';
import UserHeader from './UserHeader';

const MovieDiscussion = () => {
  const { id: movieId } = useParams();

  const [movie, setMovie] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);

  /* ------------------ Helpers ------------------ */
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
      ? email.split('@')[0].replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase())
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

  /* ------------------ Fetch Messages ------------------ */
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);

      const { data, error } = await supabase
  .from('discussion')
  .select(`
    *,
    user:user_email (
      avatar_url
    )
  `)
  .eq('movie_id', movieId)
  .order('created_at', { ascending: true });


      if (!error) setMessages(data || []);
      setLoading(false);
    };

    fetchMessages();
  }, [movieId]);

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

        // fetch user row for this email
        const { data: userRows, error } = await supabase
          .from('user')
          .select('email, avatar_url, name')
          .eq('email', newMsg.user_email)
          .limit(1);

        const user = !error && userRows?.length ? userRows[0] : null;

        // keep same shape as initial select (has msg.user)
        setMessages((prev) => [...prev, { ...newMsg, user }]);
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

  /* ------------------ UI ------------------ */
  if (!movie) return <div className="loading-state">Loading movie...</div>;

  return (
    <>
     <UserHeader/>
    <div className="movie-discussion-container" style={{marginTop:"13vh"}}>
        
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

        <div className="messages">
          {loading ? (
            <p>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p>No messages yet. Start the discussion!</p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.user_email === currentUser?.email;

              return (
                <div
                  key={msg.id}
                  className={`message ${isOwn ? 'own' : ''}`}
                >
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
            placeholder={
              currentUser
                ? 'Share your thoughts...'
                : 'Login to participate'
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!currentUser || sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            Send
          </button>
        </div>
      </section>
    </div>
    </>
  );
};

export default MovieDiscussion;
