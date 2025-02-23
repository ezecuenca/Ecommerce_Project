// src/components/admin/Dashboard.js
import React from "react";
import { FaRegImage, FaBox, FaDollarSign, FaWarehouse, FaUsers } from "react-icons/fa"; 

const Dashboard = () => {
    return (
        <div className="dashboard-container">
            <h2 className="h2">Website Analytics</h2>

            <div className="analytics-cards">
                <div className="analytics-card">
                    <FaBox className="text-gray-600" size={20} /> {/* Icon above the title */}
                    <div className="flex items-center mb-2">
                        <span className="label">Products Sold</span>
                    </div>
                    <span className="value">2,145</span>
                </div>
                <div className="analytics-card">
                    <FaDollarSign className="text-gray-600" size={20} /> {/* Icon above the title */}
                    <div className="flex items-center mb-2">
                        <span className="label">Gross Sales</span>
                    </div>
                    <span className="value">₱ 221.45K</span>
                </div>
                <div className="analytics-card">
                    <FaWarehouse className="text-gray-600" size={20} /> {/* Icon above the title */}
                    <div className="flex items-center mb-2">
                        <span className="label">Total Stock</span>
                    </div>
                    <span className="value">1,342</span>
                </div>
                <div className="analytics-card">
                    <FaUsers className="text-gray-600" size={20} /> {/* Icon above the title */}
                    <div className="flex items-center mb-2">
                        <span className="label">Total Users</span>
                    </div>
                    <span className="value">5,678</span>
                </div>
            </div>

            <h2 className="h2">Recently Sold</h2>
            <table className="recently-sold">
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
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td>
                        <td className="td">Product Name</td>
                        <td className="td">1x</td>
                        <td className="td">₱ 200.12</td>
                        <td className="td">10/03/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td>
                        <td className="td">Product Name</td>
                        <td className="td">1x</td>
                        <td className="td">₱ 143.06</td>
                        <td className="td">10/03/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td>
                        <td className="td">Product Name</td>
                        <td className="td">2x</td>
                        <td className="td">₱ 310.22</td>
                        <td className="td">10/03/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td>
                        <td className="td">Product Name</td>
                        <td className="td">1x</td>
                        <td className="td">₱ 450.50</td>
                        <td className="td">10/02/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td>
                        <td className="td">Product Name</td>
                        <td className="td">3x</td>
                        <td className="td">₱ 89.99</td>
                        <td className="td">10/01/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td>
                        <td className="td">Product Name</td>
                        <td className="td">1x</td>
                        <td className="td">₱ 175.30</td>
                        <td className="td">09/30/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td>
                        <td className="td">Product Name</td>
                        <td className="td">2x</td>
                        <td className="td">₱ 299.75</td>
                        <td className="td">09/29/24</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default Dashboard;