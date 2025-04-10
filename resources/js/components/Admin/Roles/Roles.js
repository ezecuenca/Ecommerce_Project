import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import axios from 'axios';
import RolesManagement from "./RolesManagement";

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedRole, setSelectedRole] = useState(null);
    const [name, setName] = useState("");
    const [modalError, setModalError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewType, setViewType] = useState("active");
    const itemsPerPage = 5;
    const tableRef = useRef(null);

    const dateTimeOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric', 
        minute: 'numeric', 
        hour12: true 
    };

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        setCheckedRows({});
        setIsSelectAll(false);
        setCurrentPage(1);

        try {
            const response = await axios.get('/api/roles');
            console.log("API Response (All Roles):", response.data);

            let fetchedRoles = [];
            if (Array.isArray(response.data)) {
                fetchedRoles = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                fetchedRoles = response.data.data;
            } else {
                 console.error("Received data is not in expected array format:", response.data);
                 throw new Error("Unexpected data format received from server.");
            }

             const formattedRoles = fetchedRoles.map(role => ({
                ...role,
                isArchived: role.status === 0,
                // Use toLocaleString() with options for specific date AND time format
                created_at_formatted: role.created_at ? new Date(role.created_at).toLocaleString(undefined, dateTimeOptions) : 'N/A',
                updated_at_formatted: role.updated_at ? new Date(role.updated_at).toLocaleString(undefined, dateTimeOptions) : 'N/A'
             }));

            setRoles(formattedRoles);

        } catch (err) {
            console.error(`Error fetching roles:`, err);
             let errorMessage = `Failed to load roles. Please try again.`;
             if (err.response && err.response.status === 404) {
                 errorMessage = `Error: API endpoint /api/roles not found (404).`;
             } else if (err.message) {
                 errorMessage = err.message;
             }
            setFetchError(errorMessage);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);


    const getCurrentData = () => {
        if (!roles || roles.length === 0) {
            return [];
        }

         let filteredRoles = roles.filter(role => {
              return viewType === 'active' ? role.status === 1 : role.status === 0;
          });

        if (searchQuery.trim()) {
            filteredRoles = filteredRoles.filter(role =>
                role.role_name && role.role_name.toLowerCase().includes(searchQuery.toLowerCase())
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
            currentItems.forEach((item) => {
                newCheckedRows[item.id] = true;
            });
        }

        if (tableRef.current) {
             tableRef.current.querySelectorAll('.role-checkbox').forEach(checkbox => {
                 checkbox.checked = isChecked;
             });
         }

        setCheckedRows(newCheckedRows);
    };


    const handleRowCheckbox = (roleId, e) => {
         const isChecked = e.target.checked;
         setCheckedRows((prev) => {
             const updated = { ...prev };
             if (isChecked) {
                 updated[roleId] = true;
             } else {
                 delete updated[roleId];
             }
             return updated;
         });

          const allCurrentIds = currentItems.map(item => item.id);
          const currentlyCheckedIds = Object.keys(checkedRows).filter(id => checkedRows[id]).map(id => parseInt(id, 10));
          if(isChecked && !currentlyCheckedIds.includes(roleId)) currentlyCheckedIds.push(roleId);
          if(!isChecked) { const index = currentlyCheckedIds.indexOf(roleId); if (index > -1) currentlyCheckedIds.splice(index, 1); }

          const allVisibleChecked = allCurrentIds.length > 0 && allCurrentIds.every(id => currentlyCheckedIds.includes(id));
          setIsSelectAll(allVisibleChecked);
      };

     const handleDelete = (roleToArchive = null) => {
         if (viewType !== 'active') {
             alert("Roles can only be archived from the Active view.");
             return;
         }

         const rolesToArchive = roleToArchive ? [roleToArchive] : getSelectedRoles();
         if (rolesToArchive.length === 0) {
             alert("Please select at least one role to archive.");
             return;
         }
         console.log("Attempting to archive roles:", rolesToArchive);
         setSelectedRole(rolesToArchive);
         setManagementType("archive");
         setManagementModalOpen(true);
     };

    const handleRestore = (roleToRestore = null) => {
         if (viewType !== 'archived') {
             alert("Roles can only be restored from the Archived view.");
             return;
         }
         const rolesToRestore = roleToRestore ? [roleToRestore] : getSelectedRoles();
          if (rolesToRestore.length === 0) {
              alert("Please select at least one role to restore.");
              return;
          }
         console.log("Attempting to restore roles:", rolesToRestore);
         setSelectedRole(rolesToRestore);
         setManagementType("restore");
         setManagementModalOpen(true);
      };

    const handleAdd = () => {
        if (viewType !== 'active') {
             alert("New roles can only be added in the Active view.");
             setViewType('active');
             return;
         }
        setManagementType("add");
        setName("");
        setSelectedRole(null);
        setManagementModalOpen(true);
    };

    const handleEdit = (role) => {
         if (viewType !== 'active' || role.status !== 1) {
             alert("Only active roles can be edited.");
             return;
         }
        setSelectedRole(role);
        setName(role.role_name || "");
        setManagementType("edit");
        setManagementModalOpen(true);
    };

    const validateName = (nameToValidate) => {
        return nameToValidate.trim().length > 0;
    };

    const handleNameChange = (e) => setName(e.target.value);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleSaveEditOrAdd = async (newOrUpdatedRoleData) => {
        setModalError("");
        if (!validateName(newOrUpdatedRoleData.role_name)) {
             setModalError("Role name is required.");
             return;
         }
        setLoading(true);

        if (managementType === 'add') {
            try {
                 const response = await axios.post('/api/roles', { role_name: newOrUpdatedRoleData.role_name, status: 1 });
                 console.log("Add Role Response:", response.data);
                 handleCloseManagement();
                 await fetchRoles();
            } catch (err) {
                 console.error("Error adding role:", err);
                 setModalError(err.response?.data?.message || 'Failed to add role.');
                 setLoading(false);
            }
        } else if (managementType === 'edit') {
             if (!selectedRole || !selectedRole.id) {
                 setModalError("Cannot edit role: ID missing.");
                 setLoading(false);
                 return;
             }
             try {
                  const response = await axios.put(`/api/roles/${selectedRole.id}`, { role_name: newOrUpdatedRoleData.role_name });
                  console.log("Edit Role Response:", response.data);
                  handleCloseManagement();
                  await fetchRoles();
             } catch (err) {
                  console.error("Error editing role:", err);
                  setModalError(err.response?.data?.message || 'Failed to update role.');
                  setLoading(false);
             }
        }
    };

     const handleConfirmAction = async (items) => {
         setLoading(true);
         const rolesToAction = Array.isArray(items) ? items : [items];
         const idsToAction = rolesToAction.map(item => item.id);
         const isArchiving = managementType === 'archive';
         const newStatus = isArchiving ? 0 : 1;

         if (idsToAction.length === 0) {
             alert("No valid IDs found for action.");
             setLoading(false);
             return;
         }

         console.log(`${isArchiving ? 'Archiving' : 'Restoring'} role IDs:`, idsToAction, `to status: ${newStatus}`);

         const updatePromises = idsToAction.map(id =>
             axios.put(`/api/roles/${id}`, { status: newStatus })
         );

         try {
             await Promise.all(updatePromises);
             console.log(`Roles successfully ${isArchiving ? 'archived' : 'restored'}.`);
             handleCloseManagement();
             await fetchRoles();
         } catch (err) {
             console.error(`Error ${isArchiving ? 'archiving' : 'restoring'} role(s):`, err);
             alert(`Failed to ${isArchiving ? 'archive' : 'restore'} one or more roles. Please check console for details.`);
             setLoading(false);
         }
     };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedRole(null);
        setName("");
        setModalError("");
    };

     const getSelectedRoles = () => {
         const selectedIds = Object.keys(checkedRows)
             .filter(id => checkedRows[id])
             .map(id => parseInt(id, 10));
         return roles.filter(role => selectedIds.includes(role.id));
     };

     const checkedCount = Object.keys(checkedRows).filter(id => checkedRows[id]).length;

    const changeViewType = (newType) => {
        if (viewType !== newType) {
             setViewType(newType);
             setCurrentPage(1);
             setSearchQuery('');
             setCheckedRows({});
             setIsSelectAll(false);
         }
    };

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
                            placeholder="Search Roles"
                            className="search-input"
                        />
                    </div>
                    <div className="button-group" style={{ marginLeft: 'auto' }}>
                         {viewType === "active" ? (
                             <>
                                 <button className="add-button" onClick={handleAdd} disabled={loading}>Add</button>
                                 <button
                                     className="delete-button"
                                     onClick={() => handleDelete()}
                                     disabled={checkedCount === 0 || loading}
                                     title="Archive selected roles"
                                 >
                                     Delete {checkedCount > 0 ? `(${checkedCount})` : ''}
                                 </button>
                             </>
                         ) : (
                             <button
                                 className="restore-button"
                                 onClick={() => handleRestore()}
                                 disabled={checkedCount === 0 || loading}
                             >
                                 Restore {checkedCount > 0 ? `(${checkedCount})` : ''}
                             </button>
                         )}
                    </div>
                    <div className="view-toggle">
                         <button
                             className={`view-button ${viewType === "active" ? "active" : ""}`}
                             onClick={() => changeViewType("active")}
                             disabled={loading}
                         >
                             Active Roles
                         </button>
                         <button
                             className={`view-button ${viewType === "archived" ? "active" : ""}`}
                             onClick={() => changeViewType("archived")}
                             disabled={loading}
                         >
                             Archived Roles
                         </button>
                     </div>
                </div>

                 {loading && <p>Loading roles...</p>}
                 {fetchError && <p style={{ color: 'red' }}>Error: {fetchError}</p>}

                {!loading && !fetchError && (
                    <>
                        <table ref={tableRef} className="roles-table">
                            <thead>
                                <tr className="table-header-row">
                                    <th className="table-header">
                                        <input
                                            type="checkbox"
                                            className="role-checkbox"
                                            checked={isSelectAll && currentItems.length > 0}
                                            onChange={handleSelectAll}
                                            disabled={currentItems.length === 0}
                                         />
                                    </th>
                                    <th className="table-header roles-action-column">Action</th>
                                    <th className="table-header">Role</th>
                                    <th className="table-header">Created At</th>
                                    <th className="table-header">Updated At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length > 0 ? (
                                    currentItems.map((role) => (
                                        <tr className="table-row" key={role.id}>
                                            <td className="table-cell">
                                                <input
                                                    type="checkbox"
                                                    className="role-checkbox"
                                                    checked={!!checkedRows[role.id]}
                                                    onChange={(e) => handleRowCheckbox(role.id, e)}
                                                 />
                                            </td>
                                            <td className="table-cell roles-action-column">
                                                <div className="action-buttons">
                                                     {role.status === 1 ? (
                                                         <>
                                                             <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(role)} title="Edit Role"/>
                                                             <FaTrash className="delete-icon" size={20} onClick={() => handleDelete(role)} title="Archive Role"/>
                                                         </>
                                                     ) : (
                                                         <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(role)} title="Restore Role"/>
                                                     )}
                                                </div>
                                            </td>
                                            <td className="table-cell">{role.role_name}</td>
                                            <td className="table-cell">{role.created_at_formatted}</td>
                                            <td className="table-cell">{role.updated_at_formatted}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="table-row">
                                        <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                             {searchQuery
                                                 ? `No ${viewType} roles match your search.`
                                                 : `No ${viewType} roles found.`}
                                         </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="table-pagination">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || totalPages === 0}
                                className="table-pagination-button"
                            >
                                Previous
                            </button>
                            {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="table-pagination-button"
                            >
                                Next
                            </button>
                        </div>
                    </>
                 )}
            </div>
            {managementModalOpen && (
                <RolesManagement
                    type={managementType}
                    role={managementType === "edit" ? selectedRole : null}
                    selectedRoles={managementType === "archive" || managementType === "restore" ? (Array.isArray(selectedRole) ? selectedRole : [selectedRole]) : []}
                    name={name}
                    error={modalError}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmAction}
                    onSave={handleSaveEditOrAdd}
                />
            )}
        </div>
    );
};

export default Roles;