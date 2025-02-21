// AdminDashboard.js
import React, { useState } from "react";
import AdminNav from "./AdminNav";

const AdminDashboard = () => {
    const [content, setContent] = useState("Welcome to the Admin Dashboard"); // Default content

    const handleNavigation = (section) => {
        if (section === "dashboard") {
            setContent("DASHBOARD TEXT"); // Update content for Dashboard
        } else if (section === "personal-info") {
            setContent("PERSONAL INFO TEXT"); // Example for other sections (customize as needed)
        } else if (section === "orders") {
            setContent("ORDERS TEXT");
        } else if (section === "inventory") {
            setContent("INVENTORY TEXT");
        } else if (section === "reviews") {
            setContent("REVIEWS TEXT");
        } else if (section === "product-list") {
            setContent("PRODUCT LIST TEXT");
        } else if (section === "user-list") {
            setContent("USER LIST TEXT");
        } else if (section === "customer-list") {
            setContent("CUSTOMER LIST TEXT");
        } else if (section === "categories") {
            setContent("CATEGORIES TEXT");
        } else if (section === "watch-color") {
            setContent("WATCH COLOR TEXT");
        } else if (section === "wrist-measurement") {
            setContent("WRIST MEASUREMENT TEXT");
        } else if (section === "roles") {
            setContent("ROLES TEXT");
        }
    };

    return (
        <div className="flex">
            {/* Sidebar */}
            <AdminNav onNavigate={handleNavigation} />

            {/* Content Area */}
            <div className="content" style={{ marginLeft: "250px", padding: "20px", minHeight: "100vh", backgroundColor: "#f7fafc" }}>
                <h1>{content}</h1>
            </div>
        </div>
    );
};

export default AdminDashboard;