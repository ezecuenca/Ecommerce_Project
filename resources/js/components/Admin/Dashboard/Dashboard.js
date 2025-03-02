import React, { useState } from "react";
import { FaRegImage, FaBox, FaDollarSign, FaWarehouse, FaUsers } from "react-icons/fa";

const Dashboard = () => {
    const recentlySoldData = [
        { name: "Product Name 1", qty: "1x", price: "₱ 200.12", date: "10/03/24" },
        { name: "Product Name 2", qty: "1x", price: "₱ 143.06", date: "10/03/24" },
        { name: "Product Name 3", qty: "2x", price: "₱ 310.22", date: "10/03/24" },
        { name: "Product Name 4", qty: "1x", price: "₱ 450.50", date: "10/02/24" },
        { name: "Product Name 5", qty: "3x", price: "₱ 89.99", date: "10/01/24" },
        { name: "Product Name 6", qty: "1x", price: "₱ 175.30", date: "09/30/24" },
        { name: "Product Name 7", qty: "2x", price: "₱ 299.75", date: "09/29/24" },
        { name: "Product Name 8", qty: "1x", price: "₱ 250.00", date: "09/28/24" },
        { name: "Product Name 9", qty: "2x", price: "₱ 180.50", date: "09/27/24" },
        { name: "Product Name 10", qty: "3x", price: "₱ 120.75", date: "09/26/24" },
        { name: "Product Name 11", qty: "1x", price: "₱ 220.30", date: "09/25/24" },
        { name: "Product Name 12", qty: "2x", price: "₱ 150.45", date: "09/24/24" },
        { name: "Product Name 13", qty: "3x", price: "₱ 99.99", date: "09/23/24" },
        { name: "Product Name 14", qty: "1x", price: "₱ 300.00", date: "09/22/24" },
        { name: "Product Name 15", qty: "2x", price: "₱ 275.60", date: "09/21/24" },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(recentlySoldData.length / itemsPerPage);
    const currentItems = recentlySoldData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="dashboard-container">
            <h2 className="h2">Website Analytics</h2>

            <div className="analytics-cards">
                <div className="analytics-card">
                    <FaBox className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2">
                        <span className="label">Products Sold</span>
                    </div>
                    <span className="value">2,145</span>
                </div>
                <div className="analytics-card">
                    <FaDollarSign className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2">
                        <span className="label">Gross Sales</span>
                    </div>
                    <span className="value">₱ 221.45K</span>
                </div>
                <div className="analytics-card">
                    <FaWarehouse className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2">
                        <span className="label">Total Stock</span>
                    </div>
                    <span className="value">1,342</span>
                </div>
                <div className="analytics-card">
                    <FaUsers className="text-gray-600" size={20} />
                    <div className="flex items-center mb-2">
                        <span className="label">Total Users</span>
                    </div>
                    <span className="value">5,678</span>
                </div>
            </div>

            <h2 className="h2">Recently Sold</h2>
            <div className="table-container">
                <table className="dashboard-recently-sold">
                    <thead>
                        <tr className="thead">
                            <th className="th"></th>
                            <th className="th">Product Name</th>
                            <th className="th">Qty.</th>
                            <th className="th">Price</th>
                            <th className="th">Created at</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((item, index) => (
                            <tr key={index} className="tr">
                                <td className="td">
                                    <img src="/images/watchprod.svg" alt="Product Icon" className="product-icon" style={{ width: 36, height: 36 }} />
                                </td>
                                <td className="td">{item.name}</td>
                                <td className="td">{item.qty}</td>
                                <td className="td">{item.price}</td>
                                <td className="td">{item.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pagination">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "active" : ""}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;