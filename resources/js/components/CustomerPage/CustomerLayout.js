// resources/js/components/CustomerPage/CustomerLayout.js
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";


const CustomerLayout = () => {
    return (
        <div className="customer-layout">
            <Header />
            <main className="main-content">
                <Outlet />
            </main>
            <Footer /> {/* Verify this line is present */}
        </div>
    );
};

export default CustomerLayout;