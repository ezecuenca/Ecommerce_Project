import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa"; // Added FaUndo for Restore
import RolesManagement from "./RolesManagement"; // Assume a similar RolesManagement component

const Roles = () => {
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active"); // Roles can now have active/archived views
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedRole, setSelectedRole] = useState(null);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 5; // Match CategoryList pagination

    const [initialRoles, setInitialRoles] = useState([
        { id: 1, name: "Customer", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: false },
        { id: 2, name: "Admin", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: false },
        // Added an archived role for testing
        { id: 3, name: "Moderator", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: true },
    ]);

    const [roles, setRoles] = useState(initialRoles);
    const tableRef = useRef(null);

    useEffect(() => {
        const savedRoles = localStorage.getItem("roles");
        let updatedRoles = [...initialRoles];
        if (savedRoles) {
            try {
                updatedRoles = JSON.parse(savedRoles).map(role => ({
                    ...role,
                    isArchived: role.isArchived !== undefined ? role.isArchived : false,
                    createdAt: role.createdAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                    updatedAt: role.updatedAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                }));
                console.log("Loaded roles from localStorage:", updatedRoles);
            } catch (error) {
                console.error("Error parsing roles from localStorage:", error);
                updatedRoles = [...initialRoles];
                localStorage.setItem("roles", JSON.stringify(updatedRoles));
            }
        } else {
            console.log("Initialized with static roles:", initialRoles);
            localStorage.setItem("roles", JSON.stringify(initialRoles));
        }
        setRoles(updatedRoles);
        setInitialRoles(updatedRoles);
        setCheckedRows({});
        setIsSelectAll(false);
    }, []);

    const getCurrentData = () => {
        if (!roles || roles.length === 0) {
            console.warn("No roles data available, returning empty array.");
            return [];
        }
        let filteredRoles = roles.filter(role => role.isArchived === (viewType === "archived"));
        if (searchQuery.trim()) {
            filteredRoles = filteredRoles.filter(role =>
                role.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filteredRoles;
    };

    const currentData = getCurrentData();
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const currentItems = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        if (isChecked) {
            currentItems.forEach((_, index) => {
                newCheckedRows[index] = true;
            });
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.role-checkbox').forEach(checkbox => checkbox.checked = true);
            }
        } else {
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.role-checkbox').forEach(checkbox => checkbox.checked = false);
            }
        }
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (index, e) => {
        const isChecked = e.target.checked;
        setCheckedRows((prev) => ({
            ...prev,
            [index]: isChecked,
        }));
        const allChecked = currentItems.length ===
            (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.role-checkbox')).filter(cb => cb.checked).length : 0);
        setIsSelectAll(allChecked);
    };

    const handleDelete = (roleToDelete = null) => {
        console.log("Attempting to delete - viewType:", viewType, "roleToDelete:", roleToDelete, "checkedRows:", checkedRows);
        const selectedIndices = Object.keys(checkedRows)
            .filter(index => checkedRows[index])
            .map(index => parseInt(index, 10));

        if (roleToDelete) {
            if (viewType !== "active") {
                alert("You can only delete from Active Roles.");
                return;
            }
            setManagementType("delete");
            setSelectedRole([roleToDelete]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 1) {
            alert("Please select at least one role to delete.");
            return;
        }

        if (viewType !== "active") {
            alert("You can only delete from Active Roles.");
            return;
        }

        setManagementType("delete");
        setSelectedRole(getSelectedRoles());
        setManagementModalOpen(true);
    };

    const handleRestore = (roleToRestore = null) => {
        console.log("Attempting to restore - viewType:", viewType, "roleToRestore:", roleToRestore, "checkedRows:", checkedRows);
        const selectedIndices = Object.keys(checkedRows)
            .filter(index => checkedRows[index])
            .map(index => parseInt(index, 10));

        if (roleToRestore) {
            if (viewType !== "archived") {
                alert("You can only restore from Archived Roles.");
                return;
            }
            console.log("Opening restore modal for single role:", roleToRestore);
            setManagementType("restore");
            setSelectedRole([roleToRestore]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 1) {
            alert("Please select at least one role to restore.");
            return;
        }

        if (viewType !== "archived") {
            alert("You can only restore from Archived Roles.");
            return;
        }

        console.log("Opening restore modal for multiple roles:", getSelectedRoles());
        setManagementType("restore");
        setSelectedRole(getSelectedRoles());
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        console.log("Current viewType:", viewType, "Opening Add modal");
        setManagementType("add");
        setName("");
        setSelectedRole(null);
        setManagementModalOpen(true);
    };

    const handleEdit = (role) => {
        console.log("Opening edit for role:", role);
        setSelectedRole(role);
        setName(role.name || "");
        setManagementType("edit");
        setManagementModalOpen(true);
    };

    const validateName = (name) => {
        return name.trim().length > 0; // Simple validation for role name
    };

    const handleNameChange = (e) => setName(e.target.value);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleSaveEditOrAdd = (newOrUpdatedRole) => {
        if (managementType === "edit") {
            if (!selectedRole) {
                alert("No role selected for editing.");
                return;
            }

            if (!validateName(newOrUpdatedRole.name)) {
                setError("Role name is required.");
                return;
            }

            setError("");
            const updatedRoles = roles.map(r =>
                r.id === selectedRole.id ? { ...newOrUpdatedRole, id: selectedRole.id, createdAt: selectedRole.createdAt, isArchived: selectedRole.isArchived } : r
            );
            setRoles(updatedRoles);
            setInitialRoles(updatedRoles);
            localStorage.setItem("roles", JSON.stringify(updatedRoles));
            setManagementModalOpen(false);
            setSelectedRole(null);
            setName("");
            console.log("Edited role, updated roles:", updatedRoles);
            setForceUpdate(prev => prev + 1);
        } else if (managementType === "add") {
            if (!validateName(newOrUpdatedRole.name)) {
                setError("Role name is required.");
                return;
            }

            setError("");
            const newRole = {
                id: Date.now(),
                name: newOrUpdatedRole.name.trim(),
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                isArchived: false, // New roles are active by default
            };
            const updatedRoles = [newRole, ...roles];
            setRoles(updatedRoles);
            setInitialRoles(updatedRoles);
            localStorage.setItem("roles", JSON.stringify(updatedRoles));
            setManagementModalOpen(false);
            setName("");
            console.log("Added new role, updated roles:", updatedRoles);
            setForceUpdate(prev => prev + 1);
            setCurrentPage(1);
        }
    };

    const handleConfirmDeleteOrRestore = (items) => {
        console.log("Confirming action - managementType:", managementType, "items:", items);
        if (managementType === "delete") {
            const updatedRoles = roles.map(role => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === role.id)) {
                        return { ...role, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === role.id) {
                        return { ...role, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return role;
            });
            setRoles(updatedRoles);
            setInitialRoles(updatedRoles);
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current && viewType === "active") {
                tableRef.current.querySelectorAll('.role-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            setForceUpdate(prev => prev + 1);
            localStorage.setItem("roles", JSON.stringify(updatedRoles));
            console.log("Roles after delete:", updatedRoles);
        } else if (managementType === "restore") {
            const updatedRoles = roles.map(role => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === role.id)) {
                        return { ...role, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === role.id) {
                        return { ...role, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return role;
            });
            setRoles(updatedRoles);
            setInitialRoles(updatedRoles);
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current && viewType === "archived") {
                tableRef.current.querySelectorAll('.role-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            setForceUpdate(prev => prev + 1);
            localStorage.setItem("roles", JSON.stringify(updatedRoles));
            console.log("Roles after restore:", updatedRoles);
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedRole(null);
        setName("");
        setError("");
    };

    const getSelectedRoles = () => {
        const selectedIndices = Object.keys(checkedRows)
            .filter(index => checkedRows[index])
            .map(index => parseInt(index, 10));
        return selectedIndices.map(index => currentItems[index]);
    };

    const checkedCount = Object.keys(checkedRows).filter(index => checkedRows[index]).length;

    return (
        <div className="Roles">
            <h2 className="roles-header">{viewType === "active" ? "Active Roles" : "Archived Roles"}</h2>
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
                            Active Roles
                        </button>
                        <button
                            className={`view-button ${viewType === "archived" ? "active" : ""}`}
                            onClick={() => setViewType("archived")}
                        >
                            Archived Roles
                        </button>
                    </div>
                </div>
                <table ref={tableRef} className="roles-table">
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header">
                                <input type="checkbox" className="role-checkbox" checked={isSelectAll} onChange={handleSelectAll} />
                            </th>
                            <th className="table-header roles-action-column">Action</th>
                            <th className="table-header">Role</th>
                            <th className="table-header">Created At</th>
                            <th className="table-header">Updated At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((role, index) => (
                                <tr className="table-row" key={role.id + index + forceUpdate}>
                                    <td className="table-cell">
                                        <input type="checkbox" className="role-checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                    </td>
                                    <td className="table-cell roles-action-column">
                                        <div className="action-buttons">
                                            {viewType === "active" ? (
                                                <>
                                                    <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(role)} />
                                                    <FaTrash className="delete-icon" size={20} onClick={() => handleDelete(role)} />
                                                </>
                                            ) : (
                                                <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(role)} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell">{role.name}</td>
                                    <td className="table-cell">{role.createdAt}</td>
                                    <td className="table-cell">{role.updatedAt}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="table-row">
                                <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                    {roles.length === 0
                                        ? "No roles available. Please check your data or refresh the page."
                                        : viewType === "active"
                                        ? "No active roles match your search."
                                        : "No archived roles match your search."}
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
                <RolesManagement
                    type={managementType}
                    role={managementType === "edit" || managementType === "add" ? selectedRole : (managementType === "restore" || managementType === "delete" && !Array.isArray(selectedRole) ? selectedRole : null)}
                    selectedRoles={managementType === "restore" || managementType === "delete" ? (selectedRole || getSelectedRoles()) : []}
                    name={name}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmDeleteOrRestore}
                    onSave={handleSaveEditOrAdd}
                />
            )}
        </div>
    );
};

export default Roles;