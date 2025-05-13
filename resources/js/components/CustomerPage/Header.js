import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBell, FaShoppingCart, FaUser } from "react-icons/fa";
import { FiUser, FiLock, FiPackage, FiLogOut, FiLoader, FiChevronDown, FiChevronUp } from "react-icons/fi"; // Added Chevrons
import { useCart } from "./ShoppingCart/CartContext";
import { AuthContext } from "../AuthContext";
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';
const INITIAL_NOTIFICATIONS_TO_SHOW = 5; // Constant for initial display count

const Header = ({ isHomepage = false }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const { cartItemCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, token, logout: contextLogout } = useContext(AuthContext);

    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [isNotificationLoading, setIsNotificationLoading] = useState(false);
    const [notificationError, setNotificationError] = useState(null);
    const pollIntervalRef = useRef(null);

    // --- NEW STATE FOR EXPANDED NOTIFICATIONS VIEW ---
    const [showAllNotifications, setShowAllNotifications] = useState(false);

    const fetchNotifications = useCallback(async () => {
        // ... (fetchNotifications remains the same)
        if (!token) {
            setNotifications([]);
            setUnreadNotificationCount(0);
            return;
        }
        setIsNotificationLoading(true);
        setNotificationError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/customer/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data && Array.isArray(response.data.notifications)) {
                const sortedNotifications = response.data.notifications.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                setNotifications(sortedNotifications);
                setUnreadNotificationCount(response.data.unread_count || 0);
                // Reset showAllNotifications if new notifications are fewer than the limit
                if (sortedNotifications.length <= INITIAL_NOTIFICATIONS_TO_SHOW) {
                    setShowAllNotifications(false);
                }
            } else {
                setNotifications([]);
                setUnreadNotificationCount(0);
                setShowAllNotifications(false);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            setNotificationError("Could not load notifications.");
        } finally {
            setIsNotificationLoading(false);
        }
    }, [token]);

    useEffect(() => {
        // ... (useEffect for polling remains the same)
        if (user && token) {
            fetchNotifications();
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            pollIntervalRef.current = setInterval(() => {
                fetchNotifications();
            }, 30000);
        } else {
            setNotifications([]);
            setUnreadNotificationCount(0);
            setShowAllNotifications(false); // Reset on logout
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        }
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [user, token, fetchNotifications]);

    const markNotificationsAsSeen = async () => {
        // ... (markNotificationsAsSeen remains the same)
        if (unreadNotificationCount > 0 && token) {
            setUnreadNotificationCount(0);
            setNotifications(prevNotifications =>
                prevNotifications.map(n => ({ ...n, is_read: 1 }))
            );
            try {
                await axios.put(`${API_BASE_URL}/customer/notifications/mark-all-read`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log("Marked notifications as read on backend.");
            } catch (error) {
                console.error("Failed to mark notifications as read on backend:", error);
            }
        }
    };

    const handleLogout = () => {
        // ... (handleLogout remains the same)
        setIsProfileOpen(false);
        setIsNotificationOpen(false);
        setShowAllNotifications(false); // Reset on logout
        if (contextLogout) {
            contextLogout();
        }
        navigate("/");
    };

    const handleCartClick = () => {
        // ... (handleCartClick remains the same)
        navigate("/customer/cart");
    };

    const handleNotificationItemClick = (notification) => {
        navigate("/customer/my-orders");
        setIsNotificationOpen(false); // Close the dropdown after clicking an item
        setShowAllNotifications(false); // Reset expanded view
    };

    const handleNotificationClick = () => {
        setIsNotificationOpen(prev => {
            const newIsOpen = !prev;
            if (newIsOpen) {
                setIsProfileOpen(false);
                markNotificationsAsSeen();
            } else {
                // If closing the dropdown, also reset the expanded view
                setShowAllNotifications(false);
            }
            return newIsOpen;
        });
    };

    const formatNotificationTime = (timestamp) => {
        // ... (formatNotificationTime remains the same)
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    // Determine which notifications to display based on showAllNotifications state
    const notificationsToDisplay = showAllNotifications ? notifications : notifications.slice(0, INITIAL_NOTIFICATIONS_TO_SHOW);

    return (
        <header className={`customer-header ${isHomepage ? "homepage-header" : ""}`}>
            {/* ... (header-left remains the same) ... */}
            <div className="header-left">
                <Link to="/customer" className="logo">
                    WATCHDOG
                </Link>
                <nav className="nav-links">
                    <Link to="/customer" className={`nav-link ${location.pathname === "/customer" ? "active" : ""}`}>Home</Link>
                    <Link to="/customer/products" className={`nav-link ${location.pathname.startsWith("/customer/products") ? "active" : ""}`}>Products</Link>
                    <Link to="/customer/about" className={`nav-link ${location.pathname === "/customer/about" ? "active" : ""}`}>About Us</Link>
                    <Link to="/customer/contact" className={`nav-link ${location.pathname === "/customer/contact" ? "active" : ""}`}>Contact</Link>
                </nav>
            </div>
            <div className="header-right">
                {user && token && (
                    <div className="notification-icon" onClick={handleNotificationClick}>
                        <FaBell className="header-icon" size={20} />
                        {unreadNotificationCount > 0 && (
                            <span className="notification-badge" style={{
                                position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'red', color: 'white',
                                borderRadius: '50%', padding: '1px 5px', fontSize: '10px', fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '16px', height: '16px',
                            }}>
                                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                            </span>
                        )}
                        {isNotificationOpen && (
                            // VVVVVV MODIFIED: Added class for dynamic height and max-height for scroll
                            <div className={`notification-dropdown ${showAllNotifications ? 'expanded' : ''}`}>
                            {/* ^^^^^^ Add 'expanded' class conditionally ^^^^^^ */}
                                <div className="notification-dropdown-header">
                                    <span>Notifications</span>
                                </div>
                                {/* VVVVVV MODIFIED: Container for items, controls scrolling VVVVVV */}
                                <div className="notification-items-container">
                                {/* ^^^^^^ This div will handle max-height and overflow ^^^^^^ */}
                                    {isNotificationLoading && notifications.length === 0 && (
                                        <div className="notification-item loading">
                                            <FiLoader className="spinner" size={18}/> Loading...
                                        </div>
                                    )}
                                    {notificationError && (
                                        <div className="notification-item error">{notificationError}</div>
                                    )}
                                    {!isNotificationLoading && !notificationError && notificationsToDisplay.length === 0 && notifications.length === 0 && (
                                        <div className="notification-item">
                                            <p className="no-notifications">No new notifications.</p>
                                        </div>
                                    )}
                                    {/* Display notificationsToDisplay instead of notifications directly */}
                                    {!notificationError && notificationsToDisplay.map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`notification-item ${notif.is_read ? 'read' : 'unread-frontend'} clickable`}
                                            onClick={() => handleNotificationItemClick(notif)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNotificationItemClick(notif); }}
                                        >
                                            <p className="notification-message">{notif.message}</p>
                                            <span className="notification-time">{formatNotificationTime(notif.created_at)}</span>
                                        </div>
                                    ))}
                                </div>
                                {/* VVVVVV MODIFIED: "View All/Less Notifications" Button VVVVVV */}
                                {notifications.length > INITIAL_NOTIFICATIONS_TO_SHOW && (
                                    <div className="notification-dropdown-footer">
                                        <button
                                            className="view-all-notifications-btn"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent dropdown from closing
                                                setShowAllNotifications(!showAllNotifications);
                                            }}
                                        >
                                            {showAllNotifications ? (
                                                <>Show Less <FiChevronUp style={{ marginLeft: '4px' }} /></>
                                            ) : (
                                                <>View All ({notifications.length}) <FiChevronDown style={{ marginLeft: '4px' }} /></>
                                            )}
                                        </button>
                                    </div>
                                )}
                                {/* ^^^^^^ END MODIFIED BUTTON ^^^^^^ */}
                                 {!isNotificationLoading && !notificationError && notifications.length > 0 && notificationsToDisplay.length === 0 && showAllNotifications === false && (
                                    <div className="notification-item">
                                            <p className="no-notifications">No more notifications to show.</p> {/* This case might not be needed if footer button handles it */}
                                    </div>
                                 )}
                            </div>
                        )}
                    </div>
                )}

                {/* ... (Cart Icon and Profile Icon remain the same) ... */}
                <div className="cart-icon-container" onClick={handleCartClick} style={{ position: 'relative', cursor: 'pointer' }}>
                    <FaShoppingCart className="header-icon cart-icon" size={20} />
                    {cartItemCount > 0 && (
                        <span className="cart-badge" style={{
                            position: 'absolute', top: '-8px', right: '-10px', backgroundColor: '#007bff', color: 'white', borderRadius: '50%',
                            padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            minWidth: '18px', height: '18px', lineHeight: '1',
                        }}>
                            {cartItemCount}
                        </span>
                    )}
                </div>

                <div className="profile-icon" onClick={() => { setIsProfileOpen(!isProfileOpen); if (!isProfileOpen) { setIsNotificationOpen(false); setShowAllNotifications(false); } }}>
                    <FaUser className="header-icon" size={20} />
                    {isProfileOpen && (
                        <div className="profile-dropdown">
                            <Link to="/customer/personal-info" className="dropdown-item" onClick={() => setIsProfileOpen(false)}><FiUser className="dropdown-icon" /> Personal info</Link>
                            <Link to="/customer/login-security" className="dropdown-item" onClick={() => setIsProfileOpen(false)}><FiLock className="dropdown-icon" /> Login and security</Link>
                            <Link to="/customer/my-orders" className="dropdown-item" onClick={() => setIsProfileOpen(false)}><FiPackage className="dropdown-icon" /> My orders</Link>
                            <button onClick={handleLogout} className="dropdown-item logout"><FiLogOut className="dropdown-icon" /> Log Out</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;