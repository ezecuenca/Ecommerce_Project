import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import ProfileSidebar from "./ProfileSidebar/ProfileSidebar";
import ChatBox from "./Chatbox/Chatbox";
import ChatBubble from "./Chatbox/Chatbubble"; // Updated import path

const CustomerLayout = () => {
    const location = useLocation();
    const isProfilePage = [
        "/customer/personal-info",
        "/customer/login-security",
        "/customer/my-orders",
    ].includes(location.pathname);
    const [chatVisible, setChatVisible] = useState(false);

    return (
        <div className="customer-layout">
            <Header />
            <main className="main-content">
                {isProfilePage ? (
                    <div className="profile-layout">
                        <ProfileSidebar />
                        <div className="profile-content">
                            <Outlet />
                        </div>
                    </div>
                ) : (
                    <Outlet />
                )}
            </main>
            <Footer />
            <ChatBubble onClick={() => setChatVisible(true)} />
            <ChatBox visible={chatVisible} onClose={() => setChatVisible(false)} userId="123" />
        </div>
    );
};

export default CustomerLayout;