// src/components/admin/Orders.js
import React from "react";
import { FaRegImage } from "react-icons/fa"; // Kept FaRegImage

const Orders = () => {
    return (
        <div className="orders-container">
            <h2 className="h2">Pending Orders</h2>

            <div className="header-actions">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search"
                        className="search-input"
                    />
                </div>
            </div>

            <table className="orders-table">
                <thead>
                    <tr className="thead">
                        <th className="th"></th> 
                        <th className="th">Order ID</th>
                        <th className="th">Payment Method</th>
                        <th className="th">Total Amount</th>
                        <th className="th">Status</th>
                        <th className="th">Created At</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td> 
                        <td className="td">123456</td>
                        <td className="td">Cash on Delivery</td>
                        <td className="td">₱ 200.12</td>
                        <td className="td">
                            <select className="status-dropdown">
                                <option value="pending">Pending</option>
                            </select>
                        </td>
                        <td className="td">10/03/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td> 
                        <td className="td">111209</td>
                        <td className="td">Paypal</td>
                        <td className="td">₱ 143.06</td>
                        <td className="td">
                            <select className="status-dropdown">
                                <option value="processing">Processing</option>
                            </select>
                        </td>
                        <td className="td">10/02/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td> 
                        <td className="td">433532</td>
                        <td className="td">Card</td>
                        <td className="td">₱ 310.22</td>
                        <td className="td">
                            <select className="status-dropdown">
                                <option value="on-delivery">On Delivery</option>
                            </select>
                        </td>
                        <td className="td">10/01/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td> 
                        <td className="td">121212</td>
                        <td className="td">Cash on Delivery</td>
                        <td className="td">₱ 310.22</td>
                        <td className="td">
                            <select className="status-dropdown">
                                <option value="pending">Pending</option>
                            </select>
                        </td>
                        <td className="td">09/30/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td"><FaRegImage className="product-icon" size={20} /></td> 
                        <td className="td">121212</td>
                        <td className="td">Paypal</td>
                        <td className="td">₱ 310.22</td>
                        <td className="td">
                            <select className="status-dropdown">
                                <option value="pending">Pending</option>
                            </select>
                        </td>
                        <td className="td">09/29/24</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default Orders;