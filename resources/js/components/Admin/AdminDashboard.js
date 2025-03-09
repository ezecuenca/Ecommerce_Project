import React, { useState } from "react";
import { FaBell, FaUser } from "react-icons/fa"; 
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
            <AdminNav onNavigate={handleNavigation} />
            <div className="content">
                <header>
                    <div className="flex items-center space-x-4">
                        <FaBell className="text-gray-500 cursor-pointer hover:text-gray-700" size={20} />
                        <FaUser className="text-gray-500 cursor-pointer hover:text-gray-700" size={20} />
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