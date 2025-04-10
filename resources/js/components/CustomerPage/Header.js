import React, { useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBell, FaShoppingCart, FaUser } from "react-icons/fa";
import { FiUser, FiLock, FiCreditCard, FiPackage, FiLogOut } from "react-icons/fi";
import { useCart } from "./ShoppingCart/CartContext";

const Header = ({ isHomepage = false }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const { cartItemCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        setIsProfileOpen(false);
        navigate("/");
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
                    <Link to="/customer" className={`nav-link ${location.pathname === "/customer" ? "active" : ""}`}>Home</Link>
                    <Link to="/customer/products" className={`nav-link ${location.pathname === "/customer/products" ? "active" : ""}`}>Products</Link>
                    <Link to="/customer/about" className={`nav-link ${location.pathname === "/customer/about" ? "active" : ""}`}>About Us</Link>
                    <Link to="/customer/contact" className={`nav-link ${location.pathname === "/customer/contact" ? "active" : ""}`}>Contact</Link>
                </nav>
            </div>
            <div className="header-right">
                <div className="notification-icon" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
                    <FaBell className="header-icon" size={20} />
                    {isNotificationOpen && (<div className="notification-dropdown"><p className="no-notifications">You have no new notifications.</p></div>)}
                </div>
                <div className="cart-icon-container" onClick={handleCartClick} style={{ position: 'relative', cursor: 'pointer' }}>
                    <FaShoppingCart className="header-icon" size={20} />
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
                <div className="profile-icon" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                    <FaUser className="header-icon" size={20} />
                    {isProfileOpen && (
                        <div className="profile-dropdown">
                            <Link to="/customer/personal-info" className="dropdown-item"><FiUser className="dropdown-icon" /> Personal info</Link>
                            <Link to="/customer/login-security" className="dropdown-item"><FiLock className="dropdown-icon" /> Login and security</Link>
                            <Link to="/customer/my-orders" className="dropdown-item"><FiPackage className="dropdown-icon" /> My orders</Link>
                            <button onClick={handleLogout} className="dropdown-item logout"><FiLogOut className="dropdown-icon" /> Log Out</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;