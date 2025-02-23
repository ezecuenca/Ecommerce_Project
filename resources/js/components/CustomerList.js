// src/components/admin/CustomerList.js
import React, { useState } from "react";
import { FaEdit } from "react-icons/fa"; // Kept FaEdit for consistency (no image needed for customers)

const CustomerList = () => {
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [checkedRows, setCheckedRows] = useState({});

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        if (isChecked) {
            // Check all rows
            document.querySelectorAll('.checkbox').forEach((checkbox, index) => {
                newCheckedRows[index] = true;
                checkbox.checked = true;
            });
        } else {
            // Uncheck all rows
            document.querySelectorAll('.checkbox').forEach((checkbox) => {
                checkbox.checked = false;
            });
        }
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (index, e) => {
        const isChecked = e.target.checked;
        setCheckedRows((prev) => ({
            ...prev,
            [index]: isChecked,
        }));
        const allChecked = document.querySelectorAll('.checkbox').length ===
            document.querySelectorAll('.checkbox:checked').length;
        setIsSelectAll(allChecked);
    };

    // Sample data from the screenshot
    const customers = [
        { id: 1, name: "Customer Name 1", email: "user1@gmail.com", address: "user address", status: "Active", createdAt: "11/21/24" },
        { id: 2, name: "Customer Name 1", email: "user2@gmail.com", address: "user address", status: "Active", createdAt: "11/21/24" },
        { id: 3, name: "Customer Name 1", email: "user3@gmail.com", address: "user address", status: "Active", createdAt: "11/21/24" },
        { id: 4, name: "Customer Name 1", email: "user4@gmail.com", address: "user address", status: "Active", createdAt: "11/21/24" },
        { id: 5, name: "Customer Name 1", email: "user5@gmail.com", address: "user address", status: "Active", createdAt: "11/21/24" },
        { id: 6, name: "Customer Name 1", email: "user6@gmail.com", address: "user address", status: "Active", createdAt: "11/21/24" },
    ];

    return (
        <div className="customers-container">
            <h2 className="h2">Customer</h2>
            <div className="header-actions">
                <div className="search-bar">
                    <input type="text" placeholder="Search" className="search-input" />
                </div>
                <div className="button-group">
                    <button className="archive-button">Archive</button>
                    <button className="delete-button">Delete</button>
                </div>
            </div>
            <table className="customers-table">
                <thead>
                    <tr className="thead">
                        <th className="th">
                            <input type="checkbox" className="checkbox select-all" checked={isSelectAll} onChange={handleSelectAll} />
                        </th> {/* Checkbox column header with "Select All" only, no Edit icon */}
                        <th className="th">Customer Name</th>
                        <th className="th">Email</th>
                        <th className="th">Address</th>
                        <th className="th">Status</th>
                        <th className="th">Created at</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((customer, index) => (
                        <tr className="tr" key={customer.id}>
                            <td className="td">
                                <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                            </td>
                            <td className="td">{customer.name}</td>
                            <td className="td">{customer.email}</td>
                            <td className="td">{customer.address}</td>
                            <td className="td status">{customer.status}</td>
                            <td className="td">{customer.createdAt}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CustomerList;