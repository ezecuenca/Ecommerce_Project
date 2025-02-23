// src/components/admin/AdminDashboard.js
import React, { useState } from "react";
import { FaBell, FaUser } from "react-icons/fa"; 
import AdminNav from "./AdminNav";
import Dashboard from "./Dashboard";
import PersonalInfo from "./PersonalIinfo";
import Orders from "./Orders";
import Inventory from "./Inventory";
import Reviews from "./Reviews";
import ProductList from "./ProductList";
import UserList from "./UserList";
import CustomerList from "./CustomerList";
import Categories from "./Categories";
import WatchColor from "./WatchColor";
import WristMeasurement from "./WristMeasurement";
import Roles from "./Roles";


const AdminDashboard = () => {
    const [activeSection, setActiveSection] = useState("dashboard"); // Default to Dashboard

    const handleNavigation = (section) => {
        setActiveSection(section);
    };

    const renderContent = () => {
        switch (activeSection) {
            case "dashboard":
                return <Dashboard />;
            case "personal-info":
                return <PersonalInfo />;
            case "orders":
                return <Orders />;
            case "inventory":
                return <Inventory />;
            case "reviews":
                return <Reviews />;
            case "product-list":
                return <ProductList />;
            case "user-list":
                return <UserList />;
            case "customer-list":
                return <CustomerList />;
            case "categories":
                return <Categories />;
            case "watch-color":
                return <WatchColor />;
            case "wrist-measurement":
                return <WristMeasurement />;
            case "roles":
                return <Roles />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex">
            {/* Sidebar */}
            <AdminNav onNavigate={handleNavigation} />

            {/* Content Area with Header on the Right */}
            <div className="content">
                {/* Header - Positioned on the right */}
                <header>
                    <div className="flex items-center space-x-4">
                        <FaBell className="text-gray-500 cursor-pointer hover:text-gray-700" size={20} />
                        <FaUser className="text-gray-500 cursor-pointer hover:text-gray-700" size={20} />
                    </div>
                </header>

                {/* Line/Border under the header */}
                <div className="border-b"></div>

                {/* Content */}
                <div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;