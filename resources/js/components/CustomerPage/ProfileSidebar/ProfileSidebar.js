// File path: resources/js/components/CustomerPage/ProfileSidebar/ProfileSidebar.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiUser, FiLock, FiCreditCard, FiPackage } from "react-icons/fi";

const ProfileSidebar = () => {
    const location = useLocation().pathname;

    return (
        <aside className="profile-sidebar">
            <nav className="sidebar-nav">
                <Link
                    to="/customer/personal-info"
                    className={`sidebar-item ${location === "/customer/personal-info" ? "active" : ""}`}
                >
                    <FiUser className="sidebar-icon" />
                    Personal info
                </Link>
                <Link
                    to="/customer/login-security"
                    className={`sidebar-item ${location === "/customer/login-security" ? "active" : ""}`}
                >
                    <FiLock className="sidebar-icon" />
                    Login and security
                </Link>
                <Link
                    to="/customer/my-payments"
                    className={`sidebar-item ${location === "/customer/my-payments" ? "active" : ""}`}
                >
                    <FiCreditCard className="sidebar-icon" />
                    My payments
                </Link>
                <Link
                    to="/customer/my-orders"
                    className={`sidebar-item ${location === "/customer/my-orders" ? "active" : ""}`}
                >
                    <FiPackage className="sidebar-icon" />
                    My orders
                </Link>
            </nav>
        </aside>
    );
};

export default ProfileSidebar;