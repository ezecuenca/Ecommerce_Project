// src/components/admin/Roles.js
import React, { useState } from "react";
import { FaEdit } from "react-icons/fa"; // Kept FaEdit for consistency (no image needed for roles)

const Roles = () => {
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
    const roles = [
        { id: 1, name: "Customer", createdAt: "11/21/24", updatedAt: "11/21/24" },
        { id: 2, name: "Admin", createdAt: "11/21/24", updatedAt: "11/21/24" },
    ];

    return (
        <div className="roles-container">
            <h2 className="h2">Roles</h2>
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
            <table className="roles-table">
                <thead>
                    <tr className="thead">
                        <th className="th">
                            <input type="checkbox" className="checkbox select-all" checked={isSelectAll} onChange={handleSelectAll} />
                        </th> {/* Checkbox column header with "Select All" only, no Edit icon */}
                        <th className="th">Role</th>
                        <th className="th">Created at</th>
                        <th className="th">Updated at</th>
                    </tr>
                </thead>
                <tbody>
                    {roles.map((role, index) => (
                        <tr className="tr" key={role.id}>
                            <td className="td">
                                <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                            </td>
                            <td className="td">{role.name}</td>
                            <td className="td">{role.createdAt}</td>
                            <td className="td">{role.updatedAt}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Roles;