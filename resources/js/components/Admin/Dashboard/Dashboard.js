import React, { useState, useEffect } from "react";
import { FaBox, FaDollarSign, FaWarehouse, FaUsers, FaPrint } from "react-icons/fa";
import axios from 'axios';

const API_BASE_URL = "http://localhost:8000/api";

const formatLargeNumber = (num) => {
    if (num >= 1000000) { return `₱ ${(num / 1000000).toFixed(1)}M`; }
    else if (num >= 1000) { return `₱ ${(num / 1000).toFixed(1)}K`; }
    return `₱ ${Number(num || 0).toFixed(2)}`;
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    } catch (e) { return "Invalid Date"; }
};

const fetchApiData = async (url, config = {}) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
        console.error("fetchApiData: No token found in localStorage.");
        throw new Error("Unauthenticated: No token found.");
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(config.headers || {}),
    };

    return axios.get(url, { ...config, headers });
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
    const [recentLoading, setRecentLoading] = useState(true);
    const [recentError, setRecentError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchAnalytics = async () => {
            setAnalyticsLoading(true);
            setAnalyticsError("");
            try {
                const response = await fetchApiData(`${API_BASE_URL}/dashboard/inventory-analytics`);
                setAnalyticsData({
                    products_sold: response.data?.total_quantity_sold ?? 0,
                    gross_sales: response.data?.total_gross_revenue ?? 0,
                    total_stock: response.data?.total_current_stock ?? 0,
                    total_users: response.data?.total_user_count ?? 0,
                });
            } catch (error) {
                console.error("Error fetching analytics:", error);
                setAnalyticsError(error.message.startsWith("Unauthenticated") ? "Unauthenticated." : `Failed to load analytics: ${error.response?.data?.message || error.message}`);
                setAnalyticsData({ products_sold: 0, gross_sales: 0, total_stock: 0, total_users: 0 });
            } finally {
                setAnalyticsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    useEffect(() => {
        const fetchRecentlySold = async () => {
            setRecentLoading(true);
            setRecentError("");
            try {
                const response = await fetchApiData(`${API_BASE_URL}/dashboard/recently-sold`, {
                    params: { page: currentPage, per_page: itemsPerPage }
                });

                if (response.data && response.data.data) {
                    setRecentlySoldData(response.data.data);
                    setTotalPages(response.data.last_page || 1);
                } else if (Array.isArray(response.data)) {
                     setRecentlySoldData(response.data);
                     setTotalPages(1);
                } else {
                    console.warn("Dashboard: Received unexpected format for recently sold data.", response.data);
                    setRecentError("Invalid format for recently sold data.");
                    setRecentlySoldData([]); setTotalPages(1);
                }
            } catch (error) {
                console.error("Error fetching recently sold:", error);
                setRecentError(error.message.startsWith("Unauthenticated") ? "Unauthenticated." : `Failed to load recent sales: ${error.response?.data?.message || error.message}`);
                setRecentlySoldData([]); setTotalPages(1);
            } finally {
                setRecentLoading(false);
            }
        };
        fetchRecentlySold();
    }, [currentPage]);

    const handlePrintAnalytics = async () => {
        const printWindow = window.open('', '_blank', 'height=600,width=800');
        if (!printWindow) {
            alert("Please allow popups for this website to print the report.");
            return;
        }

        printWindow.document.write('<html><head><title>Generating Report...</title></head><body><p style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px;">Generating report, please wait...</p></body></html>');

        let allRecentlySoldData = [];
        let fetchAllError = null;

        try {
            const response = await fetchApiData(`${API_BASE_URL}/dashboard/recently-sold`, {
                params: { per_page: 1000 }
            });
            if (response.data && response.data.data) {
                allRecentlySoldData = response.data.data;
            } else if (Array.isArray(response.data)) {
                allRecentlySoldData = response.data;
            } else {
                console.warn("Print: Received unexpected format for all recently sold data.", response.data)
                allRecentlySoldData = [];
            }
        } catch (error) {
            console.error("Print: Error fetching all recently sold items:", error);
            fetchAllError = `Could not load complete list of recently sold items: ${error.message || 'Unknown Error'}`;
        }

        printWindow.document.head.innerHTML = '<title>Website Analytics Report</title>';
        printWindow.document.body.innerHTML = '';

        printWindow.document.write(`
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 25px; box-shadow: 0 2px 3px rgba(0,0,0,0.1); }
                th, td { border: 1px solid #ccc; padding: 10px; text-align: left; word-wrap: break-word; }
                th { background-color: #f8f8f8; font-weight: bold; }
                h1, h2 { text-align: center; color: #333; margin-bottom: 15px; }
                h1 { font-size: 24px; margin-bottom: 20px; }
                h2 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }
                .print-header { margin-bottom: 30px; text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 15px; }
                .print-header p { font-size: 0.9em; color: #555; }
                .print-footer { margin-top: 40px; font-size: 0.8em; text-align: center; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
                 @media print {
                    body { margin: 0.5in; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .export-button, .pagination, .non-printable { display: none !important; }
                    table { page-break-inside: auto; }
                    tr    { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    h1, h2 { page-break-after: avoid; }
                }
            </style>
        `);

        printWindow.document.write('<div class="print-header">');
        printWindow.document.write('<h1>Website Analytics Report</h1>');
        printWindow.document.write(`<p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US')}</p>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<h2>Summary Statistics</h2>');
        printWindow.document.write('<table>');
        printWindow.document.write('<thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>');
        printWindow.document.write(`<tr><td>Total Products Sold</td><td>${(analyticsData.products_sold || 0).toLocaleString()} units</td></tr>`);
        printWindow.document.write(`<tr><td>Total Gross Sales</td><td>₱${(analyticsData.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`);
        printWindow.document.write(`<tr><td>Current Total Stock</td><td>${(analyticsData.total_stock || 0).toLocaleString()} units</td></tr>`);
        printWindow.document.write(`<tr><td>Total Registered Users</td><td>${(analyticsData.total_users || 0).toLocaleString()}</td></tr>`);
        printWindow.document.write('</tbody></table>');

        printWindow.document.write('<h2>Recently Sold Items</h2>');
        if (fetchAllError) {
            printWindow.document.write(`<p style="color: red;">Error loading full list: ${fetchAllError}</p>`);
        } else if (allRecentlySoldData && allRecentlySoldData.length > 0) {
            printWindow.document.write('<table>');
            printWindow.document.write('<thead><tr><th>Product Name</th><th>Quantity</th><th>Total Price</th><th>Order Date</th></tr></thead><tbody>');
            allRecentlySoldData.forEach(item => {
                const productName = item.product_name || item.product?.product_name || 'N/A';
                const quantity = item.quantity || 'N/A';
                const price = parseFloat(item.line_total || item.price || 0).toFixed(2);
                const date = formatDate(item.order_date || item.created_at);

                printWindow.document.write(`
                    <tr>
                        <td>${productName}</td>
                        <td>${quantity}</td>
                        <td>₱${price}</td>
                        <td>${date}</td>
                    </tr>
                `);
            });
            printWindow.document.write('</tbody></table>');
        } else {
             printWindow.document.write('<p>No recently sold items data found.</p>');
        }

        printWindow.document.write('<div class="print-footer"><p>-- End of Report --</p></div>');

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            try {
                printWindow.print();
            } catch (e) {
                console.error("Error triggering print dialog:", e);
            }
        }, 500);
    };

    return (
        <div className="dashboard-container">
            <div>
                <h2 className="h2">Website Analytics</h2>
                <button
                    onClick={handlePrintAnalytics}
                    className="export-button"
                    disabled={analyticsLoading || recentLoading}
                    title="Export/Print Analytics Report"
                >
                    <FaPrint />
                    Export Report
                </button>
            </div>

            {analyticsError && <p className="error-message">{analyticsError}</p>}
            <div className="analytics-cards">
                <div className="analytics-card">
                    <FaBox className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2"> <span className="label">Products Sold</span> </div>
                    <span className="value">{analyticsLoading ? '...' : (analyticsData.products_sold || 0).toLocaleString()}</span>
                </div>
                <div className="analytics-card">
                    <FaDollarSign className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2"> <span className="label">Gross Sales</span> </div>
                    <span className="value">{analyticsLoading ? '...' : formatLargeNumber(analyticsData.gross_sales || 0)}</span>
                </div>
                <div className="analytics-card">
                    <FaWarehouse className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2"> <span className="label">Total Stock</span> </div>
                    <span className="value">{analyticsLoading ? '...' : (analyticsData.total_stock || 0).toLocaleString()}</span>
                </div>
                <div className="analytics-card">
                    <FaUsers className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2"> <span className="label">Total Users</span> </div>
                    <span className="value">{analyticsLoading ? '...' : (analyticsData.total_users || 0).toLocaleString()}</span>
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
                        {recentLoading && recentlySoldData.length === 0 ? (
                            <tr><td colSpan="5">Loading...</td></tr>
                        ) : recentlySoldData.length > 0 ? (
                            recentlySoldData.map((item, index) => (
                                <tr key={item.id || index} className="tr">
                                    <td className="td">
                                        <img src={item.product?.image_url || "/images/placeholder.svg"} alt="Product" className="product-icon" />
                                    </td>
                                    <td className="td">{item.product_name || item.product?.product_name || 'N/A'}</td>
                                    <td className="td">{item.quantity || 'N/A'}x</td>
                                    <td className="td">₱ {parseFloat(item.line_total || item.price || 0).toFixed(2)}</td>
                                    <td className="td">{formatDate(item.order_date || item.created_at)}</td>
                                </tr>
                            ))
                        ) : !recentLoading && recentlySoldData.length === 0 ? (
                            <tr><td colSpan="5">No recent sales data found.</td></tr>
                        ) : null}
                    </tbody>
                </table>
                {!recentLoading && (totalPages > 1 || (recentlySoldData.length > 0 && totalPages === 1)) ? (
                    <div className="pagination">
                        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1 || recentLoading}> Previous </button>
                        {totalPages > 1 && Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button key={page} onClick={() => setCurrentPage(page)} className={ currentPage === page ? "active" : "" } disabled={recentLoading}> {page} </button>
                        ))}
                        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || recentLoading}> Next </button>
                    </div>
                ) : null }
            </div>
        </div>
    );
};

export default Dashboard;