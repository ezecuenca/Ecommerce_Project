import React, { useState, useEffect, useRef } from "react";
import { FaUser } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import AdminNav from "./AdminNav";
import Dashboard from "./Dashboard/Dashboard";
import PersonalInfo from "./Info/PersonalIinfo";
import Orders from "./Orders/Orders";
import Inventory from "./Inventory/Inventory";
import Reviews from "./Reviews/Reviews";
import ProductList from "./Products/ProductList";
import UserList from "./User/UserList";
import CustomerList from "./Customer/CustomerList";
import Categories from "./Categories/Categories";
import WatchColor from "./Color/WatchColor";
import WristMeasurement from "./Measurement/WristMeasurement";
import Roles from "./Roles/Roles";


const AdminDashboard = () => {
    const [activeSection, setActiveSection] = useState("dashboard");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const handleNavigation = (section) => {
        setActiveSection(section);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

    const handleLogout = () => {
        console.log("Logging out...");
        setIsDropdownOpen(false);
        navigate('/');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                 const userIcon = dropdownRef.current.querySelector('.user-profile-icon'); // Find icon inside ref
                 if (userIcon && userIcon.contains(event.target)) {
                     return;
                 }
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) { document.addEventListener("mousedown", handleClickOutside); }
        else { document.removeEventListener("mousedown", handleClickOutside); }
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [isDropdownOpen]);

    const renderContent = () => {
        switch (activeSection) {
            case "dashboard": return <Dashboard />;
            case "personal-info": return <PersonalInfo />;
            case "orders": return <Orders />;
            case "inventory": return <Inventory />;
            case "reviews": return <Reviews />;
            case "product-list": return <ProductList />;
            case "user-list": return <UserList />;
            case "customer-list": return <CustomerList />;
            case "categories": return <Categories />;
            case "watch-color": return <WatchColor />;
            case "wrist-measurement": return <WristMeasurement />;
            case "roles": return <Roles />;
            default: return <Dashboard />;
        }
    };

    // Inline styles removed

    return (
        <div className="flex">
            <AdminNav onNavigate={handleNavigation} />
            <div className="content">
                <header>
                    {/* Removed inline style */}
                    <div className="flex items-center justify-end space-x-4">
                         {/* Added class user-icon-container */}
                         <div className="user-icon-container" ref={dropdownRef}>
                             <FaUser
                                 className="text-gray-500 cursor-pointer hover:text-gray-700 user-profile-icon" // Added class for easier selection
                                 size={24}
                                 onClick={toggleDropdown}
                                 aria-haspopup="true"
                                 aria-expanded={isDropdownOpen}
                             />
                             {/* Added class dropdown-menu and conditional show/hide */}
                             <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}> {/* Toggle display via class potentially */}
                                 <li>
                                     {/* Added class dropdown-item */}
                                     <button onClick={handleLogout} className="dropdown-item logout">
                                         <FiLogOut className="dropdown-icon" /> Log Out
                                     </button>
                                 </li>
                             </ul>
                         </div>
                    </div>
                </header>
                <div className="border-b"></div>
                <div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;