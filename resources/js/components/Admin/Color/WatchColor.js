import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import WatchColorManagement from "./WatchColorManagement";
import Axios from 'axios';

const WatchColor = () => {
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedColor, setSelectedColor] = useState(null);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [colors, setColors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const tableRef = useRef(null);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchColors = async () => {
            try {
                const response = await Axios.get('/api/watch_colors');
                console.log("API Response:", response.data);
                setColors(response.data);
            } catch (error) {
                console.error("Error fetching colors:", error);
                setError("Failed to load colors. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchColors();
    }, []);

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A"; 
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        });
    };

    const getCurrentData = () => {
        if (!colors.length) return [];
        let filteredColors = colors.filter(color => 
            viewType === "active" ? color.status === 1 : color.status === 0
        );
        if (searchQuery.trim()) {
            filteredColors = filteredColors.filter(color =>
                color.color_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filteredColors;
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
        currentItems.forEach(color => {
            newCheckedRows[color.id] = isChecked;
        });
        setCheckedRows(newCheckedRows);
        if (tableRef.current) {
            tableRef.current.querySelectorAll('.color-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        }
    };

    const handleRowCheckbox = (color, e) => {
        setCheckedRows(prev => ({
            ...prev,
            [color.id]: e.target.checked
        }));
        setIsSelectAll(currentItems.every(cat => checkedRows[cat.id] || (cat.id === color.id && e.target.checked)));
    };

    const getSelectedItems = (singleItem = null) => {
        if (singleItem) return [singleItem];
        return currentItems.filter(color => checkedRows[color.id]);
    };

    const handleArchive = (colorToArchive = null) => {
        const selectedItems = getSelectedItems(colorToArchive);
        if (viewType !== "active") {
            alert("You can only archive from Active Colors.");
            return;
        }
        if (!selectedItems.length) {
            alert("Please select at least one color to archive.");
            return;
        }
        setManagementType("archive");
        setSelectedColor(selectedItems);
        setManagementModalOpen(true);
    };

    const handleRestore = (colorToRestore = null) => {
        const selectedItems = getSelectedItems(colorToRestore);
        if (viewType !== "archived") {
            alert("You can only restore from Archived Colors.");
            return;
        }
        if (!selectedItems.length) {
            alert("Please select at least one color to restore.");
            return;
        }
        setManagementType("restore");
        setSelectedColor(selectedItems);
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        setManagementType("add");
        setName("");
        setSelectedColor(null);
        setManagementModalOpen(true);
    };

    const handleEdit = (color) => {
        setSelectedColor(color);
        setName(color.color_name || "");
        setManagementType("edit");
        setManagementModalOpen(true);
    };

    const validateName = (name) => name.trim().length > 0;

    const handleNameChange = (e) => setName(e.target.value);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleSaveEditOrAdd = async (newOrUpdatedColor) => {
        if (!validateName(newOrUpdatedColor.color_name)) {
            setError("Color name is required.");
            return;
        }
        setError("");
        try {
            if (managementType === "edit") {
                if (!selectedColor) throw new Error("No color selected for editing.");
                await Axios.put(`/api/watch_colors/${selectedColor.id}`, {
                    color_name: newOrUpdatedColor.color_name,
                    updated_at: new Date().toISOString(),
                    status: 1
                });
            } else if (managementType === "add") {
                await Axios.post('/api/watch_colors', {
                    color_name: newOrUpdatedColor.color_name,
                    created_at: new Date().toISOString(),
                    status: 1
                });
            }
            const response = await Axios.get('/api/watch_colors');
            setColors(response.data);
            setManagementModalOpen(false);
            setSelectedColor(null);
            setName("");
            setForceUpdate(prev => prev + 1);
            setCurrentPage(1);
        } catch (error) {
            console.error(`Error ${managementType}ing color:`, error);
            setError(`Failed to ${managementType} color. Please try again.`);
        }
    };

    const handleConfirmDeleteOrRestore = async (items) => {
        if (!items?.length) {
            alert(`Please select at least one color to ${managementType}.`);
            return;
        }
        try {
            const colorIds = items.map(item => item.id);
            console.log(`${managementType} payload:`, managementType === "archive" ? { data: { ids: colorIds } } : { ids: colorIds });
            if (managementType === "archive") {
                const response = await Axios.put('/api/watch_colors/archive', { data: { ids: colorIds } });
                console.log("Archive response:", response.data);
            } else if (managementType === "restore") {
                const response = await Axios.put('/api/watch_colors/restore', { ids: colorIds });
                console.log("Restore response:", response.data);
            }
            const response = await Axios.get('/api/watch_colors');
            setColors(response.data);
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.color-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length <= itemsPerPage) setCurrentPage(1);
            setForceUpdate(prev => prev + 1);
        } catch (error) {
            console.error(`Error ${managementType}ing colors:`, error.response?.data || error.message);
            setError(`Failed to ${managementType} colors: ${error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : error.message}`);
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedColor(null);
        setName("");
        setError("");
    };

    const checkedCount = Object.values(checkedRows).filter(Boolean).length;

    return (
        <div className="WatchColor">
            <h2 className="colors-header">{viewType === "active" ? "Active Colors" : "Archived Colors"}</h2>
            {error && <p className="error-message">{error}</p>}
            {isLoading ? (
                <p>Loading colors...</p>
            ) : (
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
                                        onClick={() => handleArchive()}
                                        disabled={checkedCount < 1}
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                            {viewType === "archived" && (
                                <button
                                    className="restore-button"
                                    onClick={() => handleRestore()}
                                    disabled={checkedCount < 1}
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
                                Active Colors
                            </button>
                            <button
                                className={`view-button ${viewType === "archived" ? "active" : ""}`}
                                onClick={() => setViewType("archived")}
                            >
                                Archived Colors
                            </button>
                        </div>
                    </div>
                    <table ref={tableRef} className="colors-table">
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header">
                                    <input type="checkbox" className="color-checkbox" checked={isSelectAll} onChange={handleSelectAll} />
                                </th>
                                <th className="table-header colors-action-column">Action</th>
                                <th className="table-header">Color</th>
                                <th className="table-header">Created At</th>
                                <th className="table-header">Updated At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map(color => (
                                    <tr className="table-row" key={color.id}>
                                        <td className="table-cell">
                                            <input
                                                type="checkbox"
                                                className="color-checkbox"
                                                checked={!!checkedRows[color.id]}
                                                onChange={e => handleRowCheckbox(color, e)}
                                            />
                                        </td>
                                        <td className="table-cell colors-action-column">
                                            <div className="action-buttons">
                                                {viewType === "active" ? (
                                                    <>
                                                        <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(color)} />
                                                        <FaTrash className="delete-icon" size={20} onClick={() => handleArchive(color)} />
                                                    </>
                                                ) : (
                                                    <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(color)} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="table-cell">{color.color_name}</td>
                                        <td className="table-cell">{formatDateTime(color.created_at)}</td>
                                        <td className="table-cell">{formatDateTime(color.updated_at)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="table-row">
                                    <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                        {colors.length === 0
                                            ? "No colors available."
                                            : viewType === "active"
                                            ? "No active colors match your search."
                                            : "No archived colors match your search."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="table-pagination">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="table-pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="table-pagination-button"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
            {managementModalOpen && (
                <WatchColorManagement
                    type={managementType}
                    color={managementType === "edit" || managementType === "add" ? selectedColor : null}
                    selectedColors={managementType === "restore" || managementType === "archive" ? selectedColor : []}
                    name={name}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmDeleteOrRestore}
                    onSave={handleSaveEditOrAdd}
                />
            )}
        </div>
    );
};

export default WatchColor;