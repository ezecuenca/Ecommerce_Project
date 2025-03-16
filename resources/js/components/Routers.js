// File path: resources/js/Routers.js
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Admin/login";
import Register from "./Admin/register";
import AdminDashboard from "./Admin/AdminDashboard";
import CustomerLayout from "./CustomerPage/CustomerLayout";
import CustomerPage from "./CustomerPage/Homepage/Homepage";
import ProductInfo from "./CustomerPage/Products/ProductInfo";
import About from "./CustomerPage/AboutUs/About";
import Contact from "./CustomerPage/ContactUs/Contact";
import Products from "./CustomerPage/Products/Products";
import Team from "./CustomerPage/OurTeam/Team";
import Faq from "./CustomerPage/FAQ/Faq";
import Cart from "./CustomerPage/ShoppingCart/Cart";
import PaymentConfirmation from "./CustomerPage/PaymentandDelivery/PaymentConfirmation";
import OrderComplete from "./CustomerPage/PaymentandDelivery/OrderComplete";
import PersonalInfo from "./CustomerPage/ProfileSidebar/Personalnfo";
import LoginSecurity from "./CustomerPage/ProfileSidebar/LoginSecurity";
import MyPayments from "./CustomerPage/ProfileSidebar/MyPayments";
import MyOrders from "./CustomerPage/ProfileSidebar/MyOrders";

export default function Routers() {
    return (
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/customer" element={<CustomerLayout />}>
                        <Route index element={<CustomerPage />} />
                        <Route path="products" element={<Products />} />
                        <Route path="products/:productId" element={<ProductInfo />} />
                        <Route path="about" element={<About />} />
                        <Route path="contact" element={<Contact />} />
                        <Route path="team" element={<Team />} />
                        <Route path="faq" element={<Faq />} />
                        <Route path="cart" element={<Cart />} />
                        <Route path="payment-confirmation" element={<PaymentConfirmation />} />
                        <Route path="order-complete" element={<OrderComplete />} />
                        <Route path="personal-info" element={<PersonalInfo />} />
                        <Route path="login-security" element={<LoginSecurity />} />
                        <Route path="my-payments" element={<MyPayments />} />
                        <Route path="my-orders" element={<MyOrders />} />
                    </Route>
                </Routes>
            </Router>
    );
}

if (document.getElementById("root")) {
    const container = document.getElementById("root");
    const root = createRoot(container);
    root.render(<Routers />);
}