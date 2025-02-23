// src/components/admin/UserList.js
import React, { useState } from "react";
import { FaEdit } from "react-icons/fa"; // Kept FaEdit for consistency (no image needed for users)

const UserList = () => {
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
    const users = [
        { id: 1, username: "Username 1", email: "user1@gmail.com", role: "Admin", createdAt: "11/21/24" },
        { id: 2, username: "Username 2", email: "user2@gmail.com", role: "Admin", createdAt: "11/21/24" },
        { id: 3, username: "Username 3", email: "user3@gmail.com", role: "Customer", createdAt: "11/21/24" },
        { id: 4, username: "Username 4", email: "user4@gmail.com", role: "Admin", createdAt: "11/21/24" },
        { id: 5, username: "Username 5", email: "user5@gmail.com", role: "Customer", createdAt: "11/21/24" },
    ];

    return (
        <div className="users-container">
            <h2 className="h2">Users</h2>
            <div className="header-actions">
                <div className="search-bar">
                    <input type="text" placeholder="Search" className="search-input" />
                </div>
                <div className="button-group">
                    <button className="archive-button">Archive</button>
                    <button className="delete-button">Delete</button>
                </div>
            </div>
            <table className="users-table">
                <thead>
                    <tr className="thead">
                        <th className="th">
                            <input type="checkbox" className="checkbox select-all" checked={isSelectAll} onChange={handleSelectAll} />
                        </th> {/* Checkbox column header with "Select All" only, no Edit icon */}
                        <th className="th">Username</th>
                        <th className="th">Email</th>
                        <th className="th">Role</th>
                        <th className="th">Created at</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user, index) => (
                        <tr className="tr" key={user.id}>
                            <td className="td">
                                <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                            </td>
                            <td className="td">{user.username}</td>
                            <td className="td">{user.email}</td>
                            <td className="td">{user.role}</td>
                            <td className="td">{user.createdAt}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserList;