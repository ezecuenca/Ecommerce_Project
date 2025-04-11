import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoutes";
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
import MyOrders from "./CustomerPage/ProfileSidebar/MyOrders";
import { CartProvider } from "./CustomerPage/ShoppingCart/CartContext";

export default function Routers() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<Navigate replace to="/login" />} />

                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute requiredRole={1}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/customer"
                            element={
                                <ProtectedRoute requiredRole={2}>
                                    <CustomerLayout />
                                </ProtectedRoute>
                            }
                        >
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
                            <Route path="my-orders" element={<MyOrders />} />
                            <Route path="login-security" element={<LoginSecurity />} />

                            <Route path="personal-info" element={<PersonalInfo />} />

                            <Route path="profile">
                                <Route index element={<Navigate replace to="/customer/personal-info" />} />
                                <Route path="*" element={<Navigate replace to="/customer/personal-info" />} />
                            </Route>

                        </Route>

                    </Routes>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

if (document.getElementById("root")) {
    const container = document.getElementById("root");
    const root = createRoot(container);
    root.render(<Routers />);
}