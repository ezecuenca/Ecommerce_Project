// src/components/admin/Inventory.js
import React, { useState } from "react";
import { FaEdit, FaImage } from "react-icons/fa"; // Kept FaEdit and FaImage

const Inventory = () => {
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

    return (
        <div className="inventory-container">
            <h2 className="h2">Overview</h2>
            <div className="header-actions">
                <div className="search-bar">
                    <input type="text" placeholder="Search" className="search-input" />
                </div>
                <div className="button-group">
                    <button className="archive-button">Archive</button>
                    <button className="delete-button">Delete</button>
                </div>
            </div>
            <table className="inventory-table">
                <thead>
                    <tr className="thead">
                        <th className="th">
                            <input type="checkbox" className="checkbox select-all" checked={isSelectAll} onChange={handleSelectAll} />
                        </th>
                        <th className="th">Product Name</th>
                        <th className="th">Price</th>
                        <th className="th">Profit</th>
                        <th className="th">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(6)].map((_, index) => (
                        <tr className="tr" key={index}>
                            <td className="td">
                                <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                            </td>
                            <td className="td">
                                <div className="product-name-cell">
                                    <FaImage className="product-icon" size={20} color="#6b7280" />
                                    Product Name
                                </div>
                            </td>
                            <td className="td">₱ {index % 3 === 0 ? 200.12 : index % 3 === 1 ? 143.06 : 310.22}</td>
                            <td className="td">₱ 2000.12</td>
                            <td className={`td status ${index % 2 === 0 ? "in-stock" : "out-stock"}`}>
                                {index % 2 === 0 ? "In stock" : "Out of stock"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Inventory;