import React, { useState } from "react";
import { 
    FaUser, FaTachometerAlt, FaClipboardList, FaBoxOpen, 
    FaStar, FaList, FaUsers, FaCogs, FaPalette, FaRuler, 
    FaAngleDown, FaAngleUp 
} from "react-icons/fa";

const AdminNav = ({ onNavigate }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleClick = (section, e, isDropdownItem = false) => {
        e.preventDefault(); 
        onNavigate(section);

        if (!isDropdownItem && section !== "settings") {
            setSettingsOpen(false);
        }
    };

    const toggleSettings = (e) => {
        e.preventDefault(); 
        setSettingsOpen(!settingsOpen); 
    };

    return (
        <div className="admin-sidebar">
            <div className="admin-logo">
                <img src="/images/logo.svg" alt="Watchdogs Logo" className="logo-img" />
            </div>

            <ul className="admin-menu">
                <li>
                    <button onClick={(e) => handleClick("personal-info", e)} className="flex items-center p-4 hover:bg-gray-700 text-white w-full">
                        <FaUser className="icon mr-2" /> Personal Info
                    </button>
                </li>
                <li>
                    <button onClick={(e) => handleClick("dashboard", e)} className="flex items-center p-4 hover:bg-gray-700 text-white w-full">
                        <FaTachometerAlt className="icon mr-2" /> Dashboard
                    </button>
                </li>
                <li>
                    <button onClick={(e) => handleClick("orders", e)} className="flex items-center p-4 hover:bg-gray-700 text-white w-full">
                        <FaClipboardList className="icon mr-2" /> Orders
                    </button>
                </li>
                <li>
                    <button onClick={(e) => handleClick("inventory", e)} className="flex items-center p-4 hover:bg-gray-700 text-white w-full">
                        <FaBoxOpen className="icon mr-2" /> Inventory
                    </button>
                </li>
                <li>
                    <button onClick={(e) => handleClick("reviews", e)} className="flex items-center p-4 hover:bg-gray-700 text-white w-full">
                        <FaStar className="icon mr-2" /> Reviews
                    </button>
                </li>
                <li>
                    <button onClick={(e) => handleClick("product-list", e)} className="flex items-center p-4 hover:bg-gray-700 text-white w-full">
                        <FaList className="icon mr-2" /> Product List
                    </button>
                </li>
                <li>
                    <button onClick={(e) => handleClick("user-list", e)} className="flex items-center p-4 hover:bg-gray-700 text-white w-full">
                        <FaUsers className="icon mr-2" /> User List
                    </button>
                </li>
                <li>
                    <button onClick={(e) => handleClick("customer-list", e)} className="flex items-center p-4 hover:bg-gray-700 text-white w-full">
                        <FaUsers className="icon mr-2" /> Customer List
                    </button>
                </li>

                {/* Settings Dropdown */}
                <li className="settings">
                    <button onClick={toggleSettings} className="flex items-center p-4 hover:bg-gray-700 text-white w-full">
                        <FaCogs className="icon mr-2" /> Settings {settingsOpen ? <FaAngleUp className="arrow-icon ml-2" /> : <FaAngleDown className="arrow-icon ml-2" />}
                    </button>
                    {settingsOpen && (
                        <ul className="settings-dropdown">
                            <li>
                                <button onClick={(e) => handleClick("categories", e, true)} className="flex items-center p-4 hover:bg-gray-600 text-white w-full">
                                    <FaList className="icon mr-2" /> Categories
                                </button>
                            </li>
                            <li>
                                <button onClick={(e) => handleClick("watch-color", e, true)} className="flex items-center p-4 hover:bg-gray-600 text-white w-full">
                                    <FaPalette className="icon mr-2" /> Watch Color
                                </button>
                            </li>
                            <li>
                                <button onClick={(e) => handleClick("wrist-measurement", e, true)} className="flex items-center p-4 hover:bg-gray-600 text-white w-full">
                                    <FaRuler className="icon mr-2" /> Wrist Measurement
                                </button>
                            </li>
                            <li>
                                <button onClick={(e) => handleClick("roles", e, true)} className="flex items-center p-4 hover:bg-gray-600 text-white w-full">
                                    <FaUsers className="icon mr-2" /> Roles
                                </button>
                            </li>
                        </ul>
                    )}
                </li>
            </ul>
        </div>
    );
};

export default AdminNav;