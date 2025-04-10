import React, { useState, useEffect } from "react";
import { FaBox, FaDollarSign, FaWarehouse, FaUsers } from "react-icons/fa";
import axios from 'axios';

const API_BASE_URL = "http://localhost:8000/api";

const formatLargeNumber = (num) => {
    if (num >= 1000000) { return `₱ ${(num / 1000000).toFixed(1)}M`; }
    else if (num >= 1000) { return `₱ ${(num / 1000).toFixed(1)}K`; }
    return `₱ ${num.toFixed(2)}`;
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${month}/${day}/${year}`;
    } catch (e) { return "Invalid Date"; }
};

const Dashboard = () => {
    const [analyticsData, setAnalyticsData] = useState({
        products_sold: 0,
        gross_sales: 0,
        total_stock: 0,
        total_users: 0,
    });
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState("");

    const [recentlySoldData, setRecentlySoldData] = useState([]);
    const [recentLoading, setRecentLoading] = useState(true); // Still used for initial load and button disabling
    const [recentError, setRecentError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchAnalytics = async () => {
            setAnalyticsLoading(true);
            setAnalyticsError("");
            try {
                const response = await axios.get(`${API_BASE_URL}/dashboard/inventory-analytics`);
                setAnalyticsData({
                    products_sold: response.data?.total_quantity_sold ?? 0,
                    gross_sales: response.data?.total_gross_revenue ?? 0,
                    total_stock: response.data?.total_current_stock ?? 0,
                    total_users: response.data?.total_user_count ?? 0,
                });
            } catch (error) {
                console.error("Error fetching analytics:", error);
                setAnalyticsError(`Failed to load analytics: ${error.response?.data?.message || error.message}`);
                setAnalyticsData({ products_sold: 0, gross_sales: 0, total_stock: 0, total_users: 0 });
            } finally {
                setAnalyticsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    useEffect(() => {
        const fetchRecentlySold = async () => {
            // Only show full table loading on initial load (when data is empty)
            if (recentlySoldData.length === 0) {
                 setRecentLoading(true);
            }
            setRecentError("");
            try {
                const response = await axios.get(`${API_BASE_URL}/dashboard/recently-sold`, {
                    params: { page: currentPage, per_page: itemsPerPage }
                });
                if (response.data && response.data.data) {
                    setRecentlySoldData(response.data.data);
                    setTotalPages(response.data.last_page || 1);
                } else if (Array.isArray(response.data)) {
                     setRecentlySoldData(response.data);
                     setTotalPages(1);
                } else {
                    setRecentError("Invalid format for recently sold data.");
                    setRecentlySoldData([]); setTotalPages(1);
                }
            } catch (error) {
                console.error("Error fetching recently sold:", error);
                setRecentError(`Failed to load recent sales: ${error.response?.data?.message || error.message}`);
                setRecentlySoldData([]); setTotalPages(1);
            } finally {
                // Always set loading false after fetch attempt completes
                setRecentLoading(false);
            }
        };
        fetchRecentlySold();
    }, [currentPage]); // Keep currentPage as the dependency

    return (
        <div className="dashboard-container">
            <h2 className="h2">Website Analytics</h2>

            {analyticsError && <p className="error-message">{analyticsError}</p>}
            <div className="analytics-cards">
                <div className="analytics-card">
                    <FaBox className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2"> <span className="label">Products Sold</span> </div>
                    <span className="value">{analyticsLoading ? '...' : analyticsData.products_sold.toLocaleString()}</span>
                </div>
                <div className="analytics-card">
                    <FaDollarSign className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2"> <span className="label">Gross Sales</span> </div>
                    <span className="value">{analyticsLoading ? '...' : formatLargeNumber(analyticsData.gross_sales)}</span>
                </div>
                <div className="analytics-card">
                    <FaWarehouse className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2"> <span className="label">Total Stock</span> </div>
                    <span className="value">{analyticsLoading ? '...' : analyticsData.total_stock.toLocaleString()}</span>
                </div>
                <div className="analytics-card">
                    <FaUsers className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2"> <span className="label">Total Users</span> </div>
                    <span className="value">{analyticsLoading ? '...' : analyticsData.total_users.toLocaleString()}</span>
                </div>
            </div>

            <h2 className="h2">Recently Sold</h2>
            {recentError && <p className="error-message">{recentError}</p>}
            <div className="table-container">
                <table className="dashboard-recently-sold">
                    <thead>
                        <tr className="thead">
                            <th className="th"></th>
                            <th className="th">Product Name</th>
                            <th className="th">Qty.</th>
                            <th className="th">Price</th>
                            <th className="th">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Show loading message ONLY if it's the initial load and data is empty */}
                        {recentLoading && recentlySoldData.length === 0 ? (
                             <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                         ) : recentlySoldData.length > 0 ? (
                            recentlySoldData.map((item, index) => (
                                <tr key={item.id || index} className="tr">
                                    <td className="td">
                                        <img src={item.product?.image_url || "/images/placeholder.svg"} alt="Product" className="product-icon" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                                    </td>
                                    <td className="td">{item.product_name || item.product?.product_name || 'N/A'}</td>
                                    <td className="td">{item.quantity || 'N/A'}x</td>
                                    <td className="td">₱ {parseFloat(item.line_total || item.price || 0).toFixed(2)}</td>
                                    <td className="td">{formatDate(item.order_date || item.created_at)}</td>
                                </tr>
                            ))
                        // Show "No data" only if NOT loading and data is empty
                        ) : !recentLoading && recentlySoldData.length === 0 ? (
                             <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No recent sales data found.</td></tr>
                        // Render nothing in tbody while loading subsequent pages (avoids flicker)
                        ) : null}
                    </tbody>
                </table>
                {/* Buttons are disabled based on recentLoading state */}
                {!recentLoading && recentlySoldData.length === 0 && totalPages <= 1 ? null : ( // Hide pagination if loading or no data/pages
                     <div className="pagination">
                        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1 || recentLoading}> Previous </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => ( <button key={page} onClick={() => setCurrentPage(page)} className={ currentPage === page ? "active" : "" } disabled={recentLoading}> {page} </button> ))}
                        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || recentLoading}> Next </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;