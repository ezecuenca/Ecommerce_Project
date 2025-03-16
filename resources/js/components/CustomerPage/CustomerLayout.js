import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import ProfileSidebar from "./ProfileSidebar/ProfileSidebar";

const CustomerLayout = () => {
    const location = useLocation();
    const isProfilePage = [
        "/customer/personal-info",
        "/customer/login-security",
        "/customer/my-payments",
        "/customer/my-orders",
    ].includes(location.pathname);

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
        </div>
    );
};

export default CustomerLayout;