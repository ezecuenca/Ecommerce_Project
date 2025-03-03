import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import UserManagement from "./UserManagement";

const UserList = () => {
    const [activeCheckedRows, setActiveCheckedRows] = useState({});
    const [activeIsSelectAll, setActiveIsSelectAll] = useState(false);
    const [archivedCheckedRows, setArchivedCheckedRows] = useState({});
    const [archivedIsSelectAll, setArchivedIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Customer");
    const [error, setError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 5;

    const [initialUsers, setInitialUsers] = useState([
        { id: 1, username: "Username 1", email: "user1@gmail.com", role: "Admin", isArchived: false, createdAt: "11/21/24", updatedAt: "11/22/24" },
        { id: 2, username: "Username 2", email: "user2@gmail.com", role: "Admin", isArchived: false, createdAt: "11/21/24", updatedAt: "11/22/24" },
        { id: 3, username: "Username 3", email: "user3@gmail.com", role: "Customer", isArchived: false, createdAt: "11/21/24", updatedAt: "11/22/24" },
        { id: 4, username: "Username 4", email: "user4@gmail.com", role: "Admin", isArchived: false, createdAt: "11/21/24", updatedAt: "11/22/24" },
        { id: 5, username: "Username 5", email: "user5@gmail.com", role: "Customer", isArchived: false, createdAt: "11/21/24", updatedAt: "11/22/24" },
    ]);

    const [users, setUsers] = useState(initialUsers);
    const navigate = useNavigate();
    const tableRef = useRef(null);

    useEffect(() => {
        const savedUsers = localStorage.getItem("users");
        let updatedUsers = [...initialUsers];
        if (savedUsers) {
            try {
                updatedUsers = JSON.parse(savedUsers).map(user => ({
                    ...user,
                    isArchived: user.isArchived !== undefined ? user.isArchived : false,
                    createdAt: user.createdAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                    updatedAt: user.updatedAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                }));
            } catch (error) {
                updatedUsers = [...initialUsers];
                localStorage.setItem("users", JSON.stringify(updatedUsers));
            }
        } else {
            localStorage.setItem("users", JSON.stringify(initialUsers));
        }
        setUsers(updatedUsers);
        setInitialUsers(updatedUsers);
        setActiveCheckedRows({});
        setActiveIsSelectAll(false);
        setArchivedCheckedRows({});
        setArchivedIsSelectAll(false);
    }, []);

    const getCurrentData = () => {
        if (!users || users.length === 0) {
            return [];
        }
        let filteredUsers = users.filter(user => user.isArchived === (viewType === "archived"));
        if (searchQuery.trim()) {
            filteredUsers = filteredUsers.filter(user =>
                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.createdAt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.updatedAt.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filteredUsers;
    };

    const currentData = getCurrentData();
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const currentItems = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        if (viewType === "active") {
            setActiveIsSelectAll(isChecked);
            const newCheckedRows = {};
            if (isChecked) {
                currentItems.forEach((_, index) => {
                    newCheckedRows[index] = true;
                });
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.user-checkbox').forEach(checkbox => checkbox.checked = true);
                }
            } else {
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.user-checkbox').forEach(checkbox => checkbox.checked = false);
                }
            }
            setActiveCheckedRows(newCheckedRows);
        } else if (viewType === "archived") {
            setArchivedIsSelectAll(isChecked);
            const newCheckedRows = {};
            if (isChecked) {
                currentItems.forEach((_, index) => {
                    newCheckedRows[index] = true;
                });
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.user-checkbox').forEach(checkbox => checkbox.checked = true);
                }
            } else {
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.user-checkbox').forEach(checkbox => checkbox.checked = false);
                }
            }
            setArchivedCheckedRows(newCheckedRows);
        }
    };

    const handleRowCheckbox = (index, e) => {
        const isChecked = e.target.checked;
        if (viewType === "active") {
            setActiveCheckedRows((prev) => ({
                ...prev,
                [index]: isChecked,
            }));
            const allChecked = currentItems.length ===
                (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.user-checkbox')).filter(cb => cb.checked).length : 0);
            setActiveIsSelectAll(allChecked);
        } else if (viewType === "archived") {
            setArchivedCheckedRows((prev) => ({
                ...prev,
                [index]: isChecked,
            }));
            const allChecked = currentItems.length ===
                (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.user-checkbox')).filter(cb => cb.checked).length : 0);
            setArchivedIsSelectAll(allChecked);
        }
    };

    const handleDelete = (userToDelete = null) => {
        const selectedIndices = viewType === "active" ? Object.keys(activeCheckedRows)
            .filter(index => activeCheckedRows[index])
            .map(index => parseInt(index, 10)) : [];

        if (userToDelete) {
            if (viewType !== "active") {
                alert("You can only delete from Active Users.");
                return;
            }
            setManagementType("delete");
            setSelectedUser([userToDelete]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 2) {
            return;
        }

        if (viewType !== "active") {
            alert("You can only delete from Active Users.");
            return;
        }

        setManagementType("delete");
        setSelectedUser(getSelectedUsers());
        setManagementModalOpen(true);
    };

    const handleRestore = (userToRestore = null) => {
        const selectedIndices = viewType === "archived" ? Object.keys(archivedCheckedRows)
            .filter(index => archivedCheckedRows[index])
            .map(index => parseInt(index, 10)) : [];

        if (userToRestore) {
            if (viewType !== "archived") {
                alert("You can only restore from Archived Users.");
                return;
            }
            setManagementType("restore");
            setSelectedUser([userToRestore]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 2) {
            return;
        }

        if (viewType !== "archived") {
            alert("You can only restore from Archived Users.");
            return;
        }

        setManagementType("restore");
        setSelectedUser(getSelectedUsers());
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        if (viewType !== "active") {
            alert("You can only add users to Active Users.");
            return;
        }
        setManagementType("add");
        setUsername("");
        setEmail("");
        setRole("Customer");
        setSelectedUser(null);
        setManagementModalOpen(true);
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setUsername(user.username || "");
        setEmail(user.email || "");
        setRole(user.role || "Customer");
        setManagementType("edit");
        setManagementModalOpen(true);
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleUsernameChange = (e) => setUsername(e.target.value);
    const handleEmailChange = (e) => setEmail(e.target.value);
    const handleRoleChange = (e) => setRole(e.target.value);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleSaveEditOrAdd = (newOrUpdatedUser) => {
        if (managementType === "edit") {
            if (!selectedUser) {
                alert("No user selected for editing.");
                return;
            }

            if (!newOrUpdatedUser.username.trim()) {
                setError("Username is required.");
                return;
            }

            if (!validateEmail(newOrUpdatedUser.email)) {
                setError("Please enter a valid email address.");
                return;
            }

            if (!newOrUpdatedUser.role) {
                setError("Role is required.");
                return;
            }

            setError("");
            const updatedUsers = users.map(u =>
                u.id === selectedUser.id ? { ...newOrUpdatedUser, id: selectedUser.id, isArchived: selectedUser.isArchived, createdAt: selectedUser.createdAt, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) } : u
            );
            setUsers(updatedUsers);
            setInitialUsers(updatedUsers);
            localStorage.setItem("users", JSON.stringify(updatedUsers));
            setManagementModalOpen(false);
            setSelectedUser(null);
            setUsername("");
            setEmail("");
            setRole("Customer");
            setForceUpdate(prev => prev + 1);
        } else if (managementType === "add") {
            if (!newOrUpdatedUser.username.trim()) {
                setError("Username is required.");
                return;
            }

            if (!validateEmail(newOrUpdatedUser.email)) {
                setError("Please enter a valid email address.");
                return;
            }

            if (!newOrUpdatedUser.role) {
                setError("Role is required.");
                return;
            }

            setError("");
            const newUser = {
                id: Date.now(),
                username: newOrUpdatedUser.username.trim(),
                email: newOrUpdatedUser.email,
                role: newOrUpdatedUser.role,
                isArchived: false,
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            };
            const updatedUsers = [newUser, ...users];
            setUsers(updatedUsers);
            setInitialUsers(updatedUsers);
            localStorage.setItem("users", JSON.stringify(updatedUsers));
            setManagementModalOpen(false);
            setUsername("");
            setEmail("");
            setRole("Customer");
            setForceUpdate(prev => prev + 1);
            setCurrentPage(1);
        }
    };

    const handleConfirmDeleteOrRestore = (items) => {
        if (managementType === "delete") {
            const updatedUsers = users.map(user => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === user.id)) {
                        return { ...user, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === user.id) {
                        return { ...user, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return user;
            });
            setUsers(updatedUsers);
            setInitialUsers(updatedUsers);
            setActiveCheckedRows({});
            setActiveIsSelectAll(false);
            if (tableRef.current && viewType === "active") {
                tableRef.current.querySelectorAll('.user-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            setForceUpdate(prev => prev + 1);
            localStorage.setItem("users", JSON.stringify(updatedUsers));
        } else if (managementType === "restore") {
            const updatedUsers = users.map(user => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === user.id)) {
                        return { ...user, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === user.id) {
                        return { ...user, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return user;
            });
            setUsers(updatedUsers);
            setInitialUsers(updatedUsers);
            setArchivedCheckedRows({});
            setArchivedIsSelectAll(false);
            if (tableRef.current && viewType === "archived") {
                tableRef.current.querySelectorAll('.user-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            setForceUpdate(prev => prev + 1);
            localStorage.setItem("users", JSON.stringify(updatedUsers));
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedUser(null);
        setUsername("");
        setEmail("");
        setRole("Customer");
        setError("");
    };

    const getSelectedUsers = () => {
        const selectedIndices = viewType === "active" ? Object.keys(activeCheckedRows)
            .filter(index => activeCheckedRows[index])
            .map(index => parseInt(index, 10)) : Object.keys(archivedCheckedRows)
            .filter(index => archivedCheckedRows[index])
            .map(index => parseInt(index, 10));
        return selectedIndices.map(index => currentItems[index]);
    };

    const isSelectAll = viewType === "active" ? activeIsSelectAll : archivedIsSelectAll;
    const checkedCount = viewType === "active" ? Object.keys(activeCheckedRows).filter(index => activeCheckedRows[index]).length : Object.keys(archivedCheckedRows).filter(index => archivedCheckedRows[index]).length;

    return (
        <div className="users-container">
            <h2 className="users-header">{viewType === "active" ? "Users" : "Archived Users"}</h2>
            <div className="table-container">
                <div className="table-header-actions">
                    <div className="search-bar">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search"
                            className="search-input"
                        />
                    </div>
                    <div className="button-group" style={{ marginLeft: 'auto' }}>
                        {viewType === "active" && (
                            <>
                                <button className="add-button" onClick={handleAdd}>Add</button>
                                <button
                                    className="delete-button"
                                    onClick={() => handleDelete()}
                                    disabled={checkedCount < 2}
                                >
                                    Delete
                                </button>
                            </>
                        )}
                        {viewType === "archived" && (
                            <button
                                className="restore-button"
                                onClick={() => handleRestore()}
                                disabled={checkedCount < 2}
                            >
                                Restore
                            </button>
                        )}
                    </div>
                    <div className="view-toggle">
                        <button
                            className={`view-button ${viewType === "active" ? "active" : ""}`}
                            onClick={() => setViewType("active")}
                        >
                            Active Users
                        </button>
                        <button
                            className={`view-button ${viewType === "archived" ? "active" : ""}`}
                            onClick={() => setViewType("archived")}
                        >
                            Archived Users
                        </button>
                    </div>
                </div>
                <table ref={tableRef} className={`users-table ${viewType === "archived" ? 'view-type="archived"' : 'view-type="active"'}`}>
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header">
                                <input type="checkbox" className="user-checkbox" checked={isSelectAll} onChange={handleSelectAll} />
                            </th>
                            <th className="table-header users-action-column">Action</th>
                            <th className="table-header">Username</th>
                            <th className="table-header">Email</th>
                            <th className="table-header">Status</th>
                            <th className="table-header">Role</th>
                            <th className="table-header">Created At</th>
                            <th className="table-header">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((user, index) => (
                                <tr className={`table-row ${viewType === "archived" ? 'view-type="archived"' : ''}`} key={user.id + index + forceUpdate}>
                                    <td className="table-cell">
                                        <input type="checkbox" className="user-checkbox" onChange={(e) => handleRowCheckbox((currentPage - 1) * itemsPerPage + index, e)} />
                                    </td>
                                    <td className="table-cell users-action-column">
                                        <div className="action-buttons">
                                            {viewType === "active" ? (
                                                <>
                                                    <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(user)} />
                                                    <FaTrash className="delete-icon" size={20} onClick={() => handleDelete(user)} />
                                                </>
                                            ) : (
                                                <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(user)} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell">{user.username}</td>
                                    <td className="table-cell">{user.email}</td>
                                    <td className={`table-cell status-${user.isArchived ? "inactive" : "active"}`}>
                                        {user.isArchived ? "Inactive" : "Active"}
                                    </td>
                                    <td className="table-cell">{user.role}</td>
                                    <td className="table-cell">{user.createdAt}</td>
                                    <td className="table-cell">{user.updatedAt}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="table-row">
                                <td colSpan="8" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                    {users.length === 0
                                        ? "No users available. Please check your data or refresh the page."
                                        : viewType === "active"
                                        ? "No active users match your search."
                                        : "No archived users match your search."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="table-pagination">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="table-pagination-button"
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="table-pagination-button"
                    >
                        Next
                    </button>
                </div>
            </div>
            {managementModalOpen && (
                <UserManagement
                    type={managementType}
                    user={managementType === "edit" || managementType === "add" ? selectedUser : (managementType === "restore" && !Array.isArray(selectedUser) ? selectedUser : null)}
                    selectedUsers={managementType === "delete" || (managementType === "restore" && Array.isArray(selectedUser)) ? (selectedUser || getSelectedUsers()) : []}
                    username={username}
                    email={email}
                    role={role}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmDeleteOrRestore}
                    onSave={handleSaveEditOrAdd}
                />
            )}
        </div>
    );
};

export default UserList;