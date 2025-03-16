// File path: resources/js/components/CustomerPage/Header.js
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBell, FaShoppingCart, FaUser } from "react-icons/fa";
import { FiUser, FiLock, FiCreditCard, FiPackage, FiLogOut } from "react-icons/fi";

const Header = ({ isHomepage = false }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation().pathname;

    const handleLogout = () => {
        setIsProfileOpen(false);
        navigate("/"); // Adjust to your login page route if needed
    };

    const handleCartClick = () => {
        navigate("/customer/cart");
    };

    return (
        <header className={`customer-header ${isHomepage ? "homepage-header" : ""}`}>
            <div className="header-left">
                <Link to="/customer" className="logo">
                    WATCHDOG
                </Link>
                <nav className="nav-links">
                    <Link
                        to="/customer"
                        className={`nav-link ${location === "/customer" ? "active" : ""}`}
                    >
                        Home
                    </Link>
                    <Link
                        to="/customer/products"
                        className={`nav-link ${location === "/customer/products" ? "active" : ""}`}
                    >
                        Products
                    </Link>
                    <Link
                        to="/customer/about"
                        className={`nav-link ${location === "/customer/about" ? "active" : ""}`}
                    >
                        About Us
                    </Link>
                    <Link
                        to="/customer/contact"
                        className={`nav-link ${location === "/customer/contact" ? "active" : ""}`}
                    >
                        Contact
                    </Link>
                </nav>
            </div>
            <div className="header-right">
                <div className="notification-icon" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
                    <FaBell className="header-icon" size={20} />
                    {isNotificationOpen && (
                        <div className="notification-dropdown">
                            <p className="no-notifications">You have no new notifications.</p>
                        </div>
                    )}
                </div>
                <div className="cart-icon" onClick={handleCartClick}>
                    <FaShoppingCart className="header-icon" size={20} />
                </div>
                <div className="profile-icon" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                    <FaUser className="header-icon" size={20} />
                    {isProfileOpen && (
                        <div className="profile-dropdown">
                            <Link to="/customer/personal-info" className="dropdown-item">
                                <FiUser className="dropdown-icon" />
                                Personal info
                            </Link>
                            <Link to="/customer/login-security" className="dropdown-item">
                                <FiLock className="dropdown-icon" />
                                Login and security
                            </Link>
                            <Link to="/customer/my-payments" className="dropdown-item">
                                <FiCreditCard className="dropdown-icon" />
                                My payments
                            </Link>
                            <Link to="/customer/my-orders" className="dropdown-item">
                                <FiPackage className="dropdown-icon" />
                                My orders
                            </Link>
                            <button onClick={handleLogout} className="dropdown-item logout">
                                <FiLogOut className="dropdown-icon" />
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;