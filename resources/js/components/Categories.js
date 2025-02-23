// src/components/admin/CategoryList.js
import React, { useState } from "react";
import { FaEdit } from "react-icons/fa"; // Kept FaEdit for consistency (no image needed for categories)

const CategoryList = () => {
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
    const categories = [
        { id: 1, name: "Men", createdAt: "11/21/24", updatedAt: "11/21/24" },
        { id: 2, name: "Women", createdAt: "11/21/24", updatedAt: "11/21/24" },
        { id: 3, name: "Unisex", createdAt: "11/21/24", updatedAt: "11/21/24" },
    ];

    return (
        <div className="categories-container">
            <h2 className="h2">Category</h2>
            <div className="header-actions">
                <div className="search-bar">
                    <input type="text" placeholder="Search" className="search-input" />
                </div>
                <div className="button-group">
                    <button className="archive-button">Archive</button>
                    <button className="add-button">Add</button>
                    <button className="delete-button">Delete</button>
                </div>
            </div>
            <table className="categories-table">
                <thead>
                    <tr className="thead">
                        <th className="th">
                            <input type="checkbox" className="checkbox select-all" checked={isSelectAll} onChange={handleSelectAll} />
                        </th> {/* Checkbox column header with "Select All" only, no Edit icon */}
                        <th className="th">Category</th>
                        <th className="th">Created at</th>
                        <th className="th">Updated at</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category, index) => (
                        <tr className="tr" key={category.id}>
                            <td className="td">
                                <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                            </td>
                            <td className="td">{category.name}</td>
                            <td className="td">{category.createdAt}</td>
                            <td className="td">{category.updatedAt}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CategoryList;