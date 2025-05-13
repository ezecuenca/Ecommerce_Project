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
import AdminChatBubble from './Chatbox/Adminchatbubble';

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
        // Add actual token removal logic here if needed
        localStorage.removeItem("access_token"); // Example: remove token on logout
        navigate('/');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                 const userIcon = dropdownRef.current.querySelector('.user-profile-icon');
                 // Check if the click was on the icon itself which triggers the dropdown
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

    return (
        // Use React Fragment <>...</> if you don't want an extra div wrapper
        <>
            <div className="flex">
                <AdminNav onNavigate={handleNavigation} />
                <div className="content">
                    <header>
                        {/* Removed redundant flex container */}
                        <div className="flex items-center justify-end space-x-4"> {/* Added flex here */}
                             <div className="user-icon-container" ref={dropdownRef}>
                                 <FaUser
                                     className="text-gray-500 cursor-pointer hover:text-gray-700 user-profile-icon"
                                     size={24}
                                     onClick={toggleDropdown}
                                     aria-haspopup="true"
                                     aria-expanded={isDropdownOpen}
                                 />
                                 {/* Ensure dropdown-menu has appropriate CSS for positioning */}
                                 <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                                     <li>
                                         <button onClick={handleLogout} className="dropdown-item logout">
                                             <FiLogOut className="dropdown-icon" /> Log Out
                                         </button>
                                     </li>
                                     {/* Add other dropdown items here if needed */}
                                 </ul>
                             </div>
                        </div>
                    </header>
                    <div className="border-b"></div> {/* Consider adding margin/padding for spacing */}
                    <div>
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Render the AdminChatBubble component */}
            {/* It will position itself based on its own CSS */}
            <AdminChatBubble />
        </>
    );
};

export default AdminDashboard;