import React, { useState, useEffect } from 'react';
import UserHeader from "./UserHeader";
import { supabase } from './supabase';
import { useNavigate } from 'react-router-dom';
import './UserNotificationPage.css';

const UserNotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [user, setUser] = useState(null);
    const [moviePosters, setMoviePosters] = useState({});
    const navigate = useNavigate();
    
    useEffect(() => {
        const initializePage = async () => {
            await getCurrentUser();
        };
        initializePage();
    }, []);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            markAllAsRead();
        }
    }, [user, filter]);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };

    const markAllAsRead = async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('notification')
                .update({ status: 'read' })
                .eq('email', user.email)
                .eq('status', 'unread');

            if (error) {
                console.error('Error marking notifications as read:', error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchNotifications = async () => {
        if (!user) return;

        setLoading(true);
        try {
            let query = supabase
                .from('notification')
                .select('*')
                .eq('email', user.email)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('type', filter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setNotifications(data || []);
            
            // Fetch movie posters for notifications with movie_id
            const movieIds = [...new Set(data.filter(n => n.movie_id).map(n => n.movie_id))];
            if (movieIds.length > 0) {
                fetchMoviePosters(movieIds);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMoviePosters = async (movieIds) => {
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('id, poster_url')
                .in('id', movieIds);

            if (error) throw error;

            const postersMap = {};
            data.forEach(movie => {
                postersMap[movie.id] = movie.poster_url;
            });
            setMoviePosters(postersMap);
        } catch (error) {
            console.error('Error fetching movie posters:', error);
        }
    };

    const clearAllNotifications = async () => {
        if (!user) return;

        const confirmed = window.confirm('Are you sure you want to clear all notifications?');
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('notification')
                .delete()
                .eq('email', user.email);

            if (error) throw error;
            setNotifications([]);
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (notification.movie_id) {
            navigate(`/movie/${notification.movie_id}`);
        }
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const notifTime = new Date(timestamp);
        const diffMs = now - notifTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'reviews':
                return { icon: 'rate_review', color: 'green-400', borderColor: 'border-l-green-500' };
            case 'promotions':
                return { icon: 'local_offer', color: 'red-400', borderColor: 'border-l-red-500' };
            case 'discussions':
                return { icon: 'forum', color: 'purple-400', borderColor: 'border-l-purple-500' };
            default:
                return { icon: 'notifications', color: 'gray-400', borderColor: 'border-l-gray-700' };
        }
    };

    const isRecent = (timestamp) => {
        const diffMs = new Date() - new Date(timestamp);
        const diffHours = diffMs / 3600000;
        return diffHours < 1;
    };

    const newNotifications = notifications.filter(n => isRecent(n.created_at));
    const olderNotifications = notifications.filter(n => !isRecent(n.created_at));

    return (
        <div className="notif-page">
            <UserHeader />
            
            <main className="notif-main">
                <div className="notif-header-section">
                    <div>
                        <h1 className="notif-title">Notifications</h1>
                        <p className="notif-subtitle">Stay updated with your community interactions and alerts.</p>
                    </div>
                    <div className="notif-actions-container">
                        <div className="notif-filters">
                            <button 
                                className={`notif-filter-btn ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All
                            </button>
                            <button 
                                className={`notif-filter-btn ${filter === 'reviews' ? 'active' : ''}`}
                                onClick={() => setFilter('reviews')}
                            >
                                Reviews
                            </button>
                            <button 
                                className={`notif-filter-btn ${filter === 'promotions' ? 'active' : ''}`}
                                onClick={() => setFilter('promotions')}
                            >
                                Promotions
                            </button>
                            <button 
                                className={`notif-filter-btn ${filter === 'discussions' ? 'active' : ''}`}
                                onClick={() => setFilter('discussions')}
                            >
                                Discussions
                            </button>
                        </div>
                        {notifications.length > 0 && (
                            <button className="notif-clear-btn" onClick={clearAllNotifications}>
                                <span className="material-icons-round">delete_sweep</span>
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="notif-loading">
                        <span className="material-icons-round notif-loading-icon">hourglass_empty</span>
                        <p>Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notif-empty">
                        <span className="material-icons-round notif-empty-icon">notifications_off</span>
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <div className="notif-list">
                        {newNotifications.length > 0 && (
                            <>
                                <div className="notif-section-divider">
                                    <span className="notif-section-label">New</span>
                                    <div className="notif-divider-line new"></div>
                                </div>

                                {newNotifications.map((notification) => {
                                    const { icon, color, borderColor } = getNotificationIcon(notification.type);
                                    const hasMovie = notification.movie_id && moviePosters[notification.movie_id];
                                    const isClickable = notification.movie_id;
                                    
                                    return (
                                        <div 
                                            key={notification.id} 
                                            className={`notif-card ${borderColor} ${isClickable ? 'clickable' : ''}`}
                                            onClick={() => handleNotificationClick(notification)}
                                            style={{ cursor: isClickable ? 'pointer' : 'default' }}
                                        >
                                            <div className={`notif-gradient ${color}`}></div>
                                            <div className="notif-content">
                                                <div className={`notif-icon-wrapper ${color}`}>
                                                    <span className="material-icons-round notif-icon">{icon}</span>
                                                </div>
                                                <div className="notif-text">
                                                    <p className="notif-message">{notification.notification_text}</p>
                                                    <p className="notif-time">
                                                        <span className="material-icons-round time-icon">schedule</span> 
                                                        {getTimeAgo(notification.created_at)}
                                                    </p>
                                                </div>
                                                {hasMovie ? (
                                                    <div className="notif-movie-poster">
                                                        <img 
                                                            src={moviePosters[notification.movie_id]} 
                                                            alt="Movie poster"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="notif-movie-placeholder" style={{ display: 'none' }}>
                                                            <span className="material-icons-round">movie</span>
                                                        </div>
                                                    </div>
                                                ) : notification.movie_id ? (
                                                    <div className="notif-movie-placeholder">
                                                        <span className="material-icons-round">movie</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        {olderNotifications.length > 0 && (
                            <>
                                <div className="notif-section-divider earlier">
                                    <span className="notif-section-label">Earlier</span>
                                    <div className="notif-divider-line"></div>
                                </div>

                                {olderNotifications.map((notification) => {
                                    const { icon, color, borderColor } = getNotificationIcon(notification.type);
                                    const hasMovie = notification.movie_id && moviePosters[notification.movie_id];
                                    const isClickable = notification.movie_id;
                                    
                                    return (
                                        <div 
                                            key={notification.id} 
                                            className={`notif-card older ${borderColor} ${isClickable ? 'clickable' : ''}`}
                                            onClick={() => handleNotificationClick(notification)}
                                            style={{ cursor: isClickable ? 'pointer' : 'default' }}
                                        >
                                            <div className={`notif-gradient ${color}`}></div>
                                            <div className="notif-content">
                                                <div className={`notif-icon-wrapper ${color}`}>
                                                    <span className="material-icons-round notif-icon">{icon}</span>
                                                </div>
                                                <div className="notif-text">
                                                    <p className="notif-message">{notification.notification_text}</p>
                                                    <p className="notif-time">
                                                        <span className="material-icons-round time-icon">schedule</span> 
                                                        {getTimeAgo(notification.created_at)}
                                                    </p>
                                                </div>
                                                {hasMovie ? (
                                                    <div className="notif-movie-poster">
                                                        <img 
                                                            src={moviePosters[notification.movie_id]} 
                                                            alt="Movie poster"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="notif-movie-placeholder" style={{ display: 'none' }}>
                                                            <span className="material-icons-round">movie</span>
                                                        </div>
                                                    </div>
                                                ) : notification.movie_id ? (
                                                    <div className="notif-movie-placeholder">
                                                        <span className="material-icons-round">movie</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                )}

                {!loading && notifications.length > 0 && (
                    <div className="notif-load-more">
                        <button className="notif-load-btn" onClick={fetchNotifications}>
                            <span className="material-icons-round notif-refresh">refresh</span> 
                            Refresh Notifications
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserNotificationPage;