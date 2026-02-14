import React, { useState, useEffect } from 'react';
import { supabase } from "./supabase";
import AdminHeader from "./AdminHeader";
import './SendNotification.css';

const SendNotification = () => {
    const [activeTab, setActiveTab] = useState('movie'); // 'movie' or 'general'
    const [targetAllUsers, setTargetAllUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [movieResults, setMovieResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [message, setMessage] = useState('');
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, deliveryRate: 98.2 });
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        fetchRecentNotifications();
        fetchStats();
    }, []);

    useEffect(() => {
        if (searchQuery.length >= 2) {
            const delayDebounceFn = setTimeout(() => {
                searchMovies();
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setMovieResults([]);
            setShowResults(false);
        }
    }, [searchQuery]);

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase
                .from('user')
                .select('email', { count: 'exact' });

            if (!error && data) {
                setStats(prev => ({ ...prev, totalUsers: data.length }));
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchRecentNotifications = async () => {
        try {
            // Get all promotion notifications ordered by creation time
            const { data, error } = await supabase
                .from('notification')
                .select('id, type, notification_text, created_at, movie_id')
                .in('type', ['g_promotion', 'm_promotion'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Group by notification_text and type, keep only the most recent one
            const notificationMap = new Map();
            
            for (const notif of (data || [])) {
                const key = `${notif.type}-${notif.notification_text}`;
                
                // Only keep this notification if we haven't seen this key before
                // or if this one is more recent (though they're already sorted, first one is most recent)
                if (!notificationMap.has(key)) {
                    notificationMap.set(key, notif);
                }
            }
            
            // Convert map to array and take top 5
            const distinctNotifications = Array.from(notificationMap.values())
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);
            
            setRecentNotifications(distinctNotifications);
        } catch (error) {
            console.error('Error fetching recent notifications:', error);
            setRecentNotifications([]);
        }
    };

    const searchMovies = async () => {
        setSearchLoading(true);
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('id, title, year, poster_url, type')
                .ilike('title', `%${searchQuery}%`)
                .limit(8);

            if (error) throw error;
            setMovieResults(data || []);
            setShowResults(true);
        } catch (error) {
            console.error('Error searching movies:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleMovieSelect = (movie) => {
        setSelectedMovie(movie);
        setSearchQuery(movie.title);
        setShowResults(false);
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            alert('Please enter a message');
            return;
        }

        if (activeTab === 'movie' && !selectedMovie) {
            alert('Please select a movie for movie-specific promotion');
            return;
        }

        setLoading(true);

        try {
            // Get all users
            const { data: users, error: usersError } = await supabase
                .from('user')
                .select('email');

            if (usersError) throw usersError;

            if (!users || users.length === 0) {
                alert('No users found in the system');
                setLoading(false);
                return;
            }

            const notificationType = activeTab === 'movie' ? 'm_promotion' : 'g_promotion';
            
            // Create notifications for all users
            const notifications = users.map(user => {
                const notification = {
                    email: user.email,
                    type: notificationType,
                    notification_text: message,
                    status: 'unread',
                    created_at: new Date().toISOString()
                };

                // Only add movie_id for movie promotions
                if (activeTab === 'movie' && selectedMovie) {
                    notification.movie_id = selectedMovie.id;
                }

                return notification;
            });

            const { error: insertError } = await supabase
                .from('notification')
                .insert(notifications);

            if (insertError) throw insertError;

            // Reset form
            setMessage('');
            setSelectedMovie(null);
            setSearchQuery('');
            
            alert(`✓ Notification sent successfully to ${users.length} user${users.length > 1 ? 's' : ''}!`);
            fetchRecentNotifications();
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Failed to send notification. Please try again.\n\nError: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = () => {
        const draft = {
            type: activeTab,
            message,
            movie: selectedMovie,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('notificationDraft', JSON.stringify(draft));
        alert('Draft saved successfully!');
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffHours < 1) return `${Math.floor(diffMs / 60000)}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 0) return 'Today';
        return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getNotificationStatus = (notification) => {
        const hoursSinceCreated = (new Date() - new Date(notification.created_at)) / 3600000;
        if (hoursSinceCreated < 24) return { label: 'Sent', color: 'emerald' };
        return { label: 'Sent', color: 'emerald' };
    };

    return (
        <div className="send-notif-page">
            <AdminHeader />
            
            <main className="send-notif-main">
                <header className="send-notif-header">
                    <div className="send-notif-header-content">
                        <h1 className="send-notif-title">Notification Center</h1>
                        <p className="send-notif-subtitle">
                            Compose and broadcast updates, premieres, and system alerts. Ensure your message reaches the right audience with precision targeting.
                        </p>
                    </div>
                </header>

                <div className="send-notif-grid">
                    {/* Left Section - Form */}
                    <section className="send-notif-form-section">
                        <div className="send-notif-glass-panel">
                            {/* Tabs */}
                            <div className="send-notif-tabs">
                                <button
                                    className={`send-notif-tab ${activeTab === 'movie' ? 'send-notif-tab-active' : ''}`}
                                    onClick={() => setActiveTab('movie')}
                                >
                                    Movie Specific
                                </button>
                                <button
                                    className={`send-notif-tab ${activeTab === 'general' ? 'send-notif-tab-active' : ''}`}
                                    onClick={() => setActiveTab('general')}
                                >
                                    General Message
                                </button>
                            </div>

                            <form onSubmit={handleSendNotification} className="send-notif-form">
                                {/* Target Audience Toggle */}
                                <div className="send-notif-audience-toggle">
                                    <div>
                                        <p className="send-notif-audience-label">Target Audience</p>
                                        <p className="send-notif-audience-desc">Default is all registered users</p>
                                    </div>
                                    <div className="send-notif-toggle-container">
                                        <span className="send-notif-toggle-label">All Users</span>
                                        <label className="send-notif-toggle">
                                            <input
                                                type="checkbox"
                                                checked={targetAllUsers}
                                                onChange={(e) => setTargetAllUsers(e.target.checked)}
                                                className="send-notif-toggle-input"
                                            />
                                            <div className="send-notif-toggle-slider"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="send-notif-fields">
                                    {/* Movie Search (only for movie tab) */}
                                    {activeTab === 'movie' && (
                                        <div className="send-notif-field">
                                            <label className="send-notif-label">Select Movie</label>
                                            <div className="send-notif-search-wrapper">
                                                <span className="material-symbols-outlined send-notif-search-icon">search</span>
                                                <input
                                                    type="text"
                                                    className="send-notif-input send-notif-input-search"
                                                    placeholder="Search database (e.g. Inception, Dune...)"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onFocus={() => searchQuery && setShowResults(true)}
                                                />
                                                {searchLoading && (
                                                    <span className="material-symbols-outlined send-notif-loading-icon">progress_activity</span>
                                                )}
                                            </div>

                                            {/* Search Results Dropdown */}
                                            {showResults && movieResults.length > 0 && (
                                                <div className="send-notif-results">
                                                    {movieResults.map((movie) => (
                                                        <div
                                                            key={movie.id}
                                                            className="send-notif-result-item"
                                                            onClick={() => handleMovieSelect(movie)}
                                                        >
                                                            <img
                                                                src={movie.poster_url}
                                                                alt={movie.title}
                                                                className="send-notif-result-poster"
                                                            />
                                                            <div className="send-notif-result-info">
                                                                <p className="send-notif-result-title">{movie.title}</p>
                                                                <p className="send-notif-result-meta">
                                                                    {movie.year} • {movie.type}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Selected Movie Display */}
                                            {selectedMovie && (
                                                <div className="send-notif-selected-movie">
                                                    <img
                                                        src={selectedMovie.poster_url}
                                                        alt={selectedMovie.title}
                                                        className="send-notif-selected-poster"
                                                    />
                                                    <div className="send-notif-selected-info">
                                                        <p className="send-notif-selected-title">{selectedMovie.title}</p>
                                                        <p className="send-notif-selected-meta">
                                                            {selectedMovie.year} • {selectedMovie.type}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="send-notif-remove-btn"
                                                        onClick={() => {
                                                            setSelectedMovie(null);
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined">close</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Message Content */}
                                    <div className="send-notif-field">
                                        <label className="send-notif-label">Message Content</label>
                                        <textarea
                                            className="send-notif-textarea"
                                            placeholder="Write your message here..."
                                            rows="5"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="send-notif-actions">
                                    <button
                                        type="submit"
                                        className="send-notif-btn-send"
                                        disabled={loading}
                                    >
                                        <span className="material-symbols-outlined">send</span>
                                        {loading ? 'Sending...' : 'Send Notification'}
                                    </button>
                                    <button
                                        type="button"
                                        className="send-notif-btn-draft"
                                        onClick={handleSaveDraft}
                                    >
                                        Save Draft
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* Right Section - Recent Activity & Stats */}
                    <section className="send-notif-sidebar">
                        <div className="send-notif-sidebar-header">
                            <h2 className="send-notif-sidebar-title">Recent Activity</h2>
                        </div>

                        <div className="send-notif-recent-panel">
                            <div className="send-notif-recent-header">
                                <div className="send-notif-recent-col-campaign">Campaign</div>
                                <div className="send-notif-recent-col-status">Status</div>
                            </div>

                            <div className="send-notif-recent-list">
                                {recentNotifications.length === 0 ? (
                                    <div className="send-notif-recent-empty">
                                        <span className="material-symbols-outlined">notifications_off</span>
                                        <p>No recent notifications</p>
                                    </div>
                                ) : (
                                    recentNotifications.map((notification) => {
                                        const status = getNotificationStatus(notification);
                                        return (
                                            <div key={notification.id} className="send-notif-recent-item">
                                                <div className="send-notif-recent-col-campaign">
                                                    <div className="send-notif-recent-title-row">
                                                        <span className={`send-notif-recent-dot send-notif-dot-${status.color}`}></span>
                                                        <h3 className="send-notif-recent-title">
                                                            {notification.type === 'm_promotion' ? 'Movie Promotion' : 'General Message'}
                                                        </h3>
                                                    </div>
                                                    <p className="send-notif-recent-message">
                                                        {notification.notification_text.substring(0, 40)}...
                                                    </p>
                                                </div>
                                                <div className="send-notif-recent-col-status">
                                                    <span className={`send-notif-recent-status send-notif-status-${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                    <span className="send-notif-recent-time">
                                                        {formatTimeAgo(notification.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="send-notif-stats">
                            <div className="send-notif-stat-card">
                                <span className="send-notif-stat-value">98.2%</span>
                                <span className="send-notif-stat-label">Delivery Rate</span>
                            </div>
                            <div className="send-notif-stat-card">
                                <span className="send-notif-stat-value send-notif-stat-value-accent">
                                    {stats.totalUsers > 1000 ? `${(stats.totalUsers / 1000).toFixed(1)}k` : stats.totalUsers}
                                </span>
                                <span className="send-notif-stat-label">Total Users</span>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default SendNotification;