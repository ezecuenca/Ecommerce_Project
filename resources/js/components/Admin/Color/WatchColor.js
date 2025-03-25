import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import WatchColorManagement from "./WatchColorManangement";
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
    const [isLoading, setIsLoading] = useState(true);
    const itemsPerPage = 5;

    const [colors, setColors] = useState([]);
    const tableRef = useRef(null);

    useEffect(() => {
        const fetchColors = async () => {
            try {
                console.log("Fetching watch colors...");
                const response = await Axios.get("http://localhost:8000/api/watch-colors");
                console.log("API Response:", response.data);
                const fetchedColors = response.data.map(color => {
                    const mappedColor = {
                        id: color.id,
                        name: color.color_name,
                        createdAt: new Date(color.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                        updatedAt: new Date(color.updated_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                        isArchived: parseInt(color.status, 10) === 0,
                    };
                    console.log(`Color ${color.color_name}: status=${color.status}, isArchived=${mappedColor.isArchived}`);
                    return mappedColor;
                });
                setColors(fetchedColors);
                console.log("Updated colors state:", fetchedColors);
                setCheckedRows({});
                setIsSelectAll(false);
            } catch (error) {
                console.error("Error fetching watch colors:", error);
                if (error.response) {
                    console.log("Response data:", error.response.data);
                    console.log("Response status:", error.response.status);
                    const errorMessage = error.response.data.errors
                        ? Object.values(error.response.data.errors).flat().join(" ")
                        : "Failed to load watch colors.";
                    setError(errorMessage);
                } else if (error.request) {
                    console.log("No response received:", error.request);
                    setError("No response from server while fetching watch colors. Please try again.");
                } else {
                    console.log("Error message:", error.message);
                    setError(`Error fetching watch colors: ${error.message}`);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchColors();
    }, [forceUpdate]);

    const getCurrentData = () => {
        if (!colors || colors.length === 0) {
            console.warn("No colors data available, returning empty array.");
            return [];
        }
        console.log(`Filtering colors for viewType=${viewType}`);
        let filteredColors = colors.filter(color => {
            const shouldInclude = color.isArchived === (viewType === "archived");
            console.log(`Color ${color.name}: isArchived=${color.isArchived}, shouldInclude=${shouldInclude}`);
            return shouldInclude;
        });
        if (searchQuery.trim()) {
            filteredColors = filteredColors.filter(color =>
                color.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        console.log(`Filtered colors:`, filteredColors.map(color => color.name));
        return filteredColors;
    };

    const currentData = getCurrentData();
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const currentItems = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSelectAll = (e) => {
        try {
            const isChecked = e.target.checked;
            setIsSelectAll(isChecked);
            const newCheckedRows = {};
            if (isChecked) {
                currentItems.forEach((_, index) => {
                    newCheckedRows[index] = true;
                });
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.color-checkbox').forEach(checkbox => (checkbox.checked = true));
                }
            } else {
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.color-checkbox').forEach(checkbox => (checkbox.checked = false));
                }
            }
            setCheckedRows(newCheckedRows);
        } catch (error) {
            console.error("Error in handleSelectAll:", error);
        }
    };

    const handleRowCheckbox = (index, e) => {
        try {
            const isChecked = e.target.checked;
            setCheckedRows((prev) => ({
                ...prev,
                [index]: isChecked,
            }));
            const allChecked = currentItems.length ===
                (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.color-checkbox')).filter(cb => cb.checked).length : 0);
            setIsSelectAll(allChecked);
        } catch (error) {
            console.error("Error in handleRowCheckbox:", error);
        }
    };

    const handleDelete = (colorToDelete = null) => {
        try {
            const selectedIndices = Object.keys(checkedRows)
                .filter(index => checkedRows[index])
                .map(index => parseInt(index, 10));

            if (colorToDelete) {
                if (viewType !== "active") {
                    alert("You can only archive from Active Colors.");
                    return;
                }
                setManagementType("delete");
                setSelectedColor([colorToDelete]);
                setManagementModalOpen(true);
                return;
            }

            const selectedCount = selectedIndices.length;
            if (selectedCount < 1) {
                alert("Please select at least one color to archive.");
                return;
            }

            if (viewType !== "active") {
                alert("You can only archive from Active Colors.");
                return;
            }

            setManagementType("delete");
            setSelectedColor(getSelectedColors());
            setManagementModalOpen(true);
        } catch (error) {
            console.error("Error in handleDelete:", error);
        }
    };

    const handleRestore = (colorToRestore = null) => {
        try {
            const selectedIndices = Object.keys(checkedRows)
                .filter(index => checkedRows[index])
                .map(index => parseInt(index, 10));

            if (colorToRestore) {
                if (viewType !== "archived") {
                    alert("You can only restore from Archived Colors.");
                    return;
                }
                setManagementType("restore");
                setSelectedColor([colorToRestore]);
                setManagementModalOpen(true);
                return;
            }

            const selectedCount = selectedIndices.length;
            if (selectedCount < 1) {
                alert("Please select at least one color to restore.");
                return;
            }

            if (viewType !== "archived") {
                alert("You can only restore from Archived Colors.");
                return;
            }

            setManagementType("restore");
            setSelectedColor(getSelectedColors());
            setManagementModalOpen(true);
        } catch (error) {
            console.error("Error in handleRestore:", error);
        }
    };

    const handleAdd = () => {
        try {
            setManagementType("add");
            setName("");
            setSelectedColor(null);
            setManagementModalOpen(true);
        } catch (error) {
            console.error("Error in handleAdd:", error);
        }
    };

    const handleEdit = (color) => {
        try {
            setSelectedColor(color);
            setName(color.name || "");
            setManagementType("edit");
            setManagementModalOpen(true);
        } catch (error) {
            console.error("Error in handleEdit:", error);
        }
    };

    const handleSearchChange = (e) => {
        try {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error in handleSearchChange:", error);
        }
    };

    const handleConfirmDeleteOrRestore = async (items) => {
        if (!items?.length) {
            alert(`Please select at least one color to ${managementType === "delete" ? "archive" : "restore"}.`);
            return;
        }
        try {
            const colorIds = items.map(item => item.id);
            console.log(`Color IDs to ${managementType}:`, colorIds);

            if (!colorIds.every(id => Number.isInteger(id) && id > 0)) {
                throw new Error("Invalid color IDs detected. All IDs must be positive integers.");
            }

            if (managementType === "delete") {
                console.log("Sending archive request with data:", { data: { ids: colorIds } });
                await Axios.put('http://localhost:8000/api/watch-colors/archive', { data: { ids: colorIds } });
            } else if (managementType === "restore") {
                console.log("Sending restore request with data:", { data: { ids: colorIds } });
                await Axios.put('http://localhost:8000/api/watch-colors/restore', { data: { ids: colorIds } });
            }
            console.log(`Successfully ${managementType === "delete" ? "archived" : "restored"} colors. Triggering re-fetch...`);
            setColors([]); // Clear colors before re-fetch
            setIsLoading(true); // Show loading state
            setForceUpdate(prev => prev + 1); // Trigger re-fetch
            setCheckedRows({});
            setIsSelectAll(false);
            if (tableRef.current) {
                tableRef.current.querySelectorAll('.color-checkbox').forEach(checkbox => (checkbox.checked = false));
            }
            setManagementModalOpen(false);
            if (currentData.length <= itemsPerPage) setCurrentPage(1);
        } catch (error) {
            console.error(`Error ${managementType === "delete" ? "archiving" : "restoring"} colors:`, error);
            if (error.response) {
                console.log("Response data:", error.response.data);
                console.log("Response status:", error.response.status);
                const errorMessage = error.response.data.errors
                    ? Object.values(error.response.data.errors).flat().join(" ")
                    : `Failed to ${managementType === "delete" ? "archive" : "restore"} colors.`;
                setError(errorMessage);
            } else if (error.request) {
                console.log("No response received:", error.request);
                setError(`No response from server while ${managementType === "delete" ? "archiving" : "restoring"} colors. Please try again.`);
            } else {
                console.log("Error message:", error.message);
                setError(`Error ${managementType === "delete" ? "archiving" : "restoring"} colors: ${error.message}`);
            }
            setIsLoading(false);
        }
    };

    const handleCloseManagement = () => {
        try {
            setManagementModalOpen(false);
            setManagementType("");
            setSelectedColor(null);
            setName("");
            setError("");
        } catch (error) {
            console.error("Error in handleCloseManagement:", error);
        }
    };

    const getSelectedColors = () => {
        try {
            const selectedIndices = Object.keys(checkedRows)
                .filter(index => checkedRows[index])
                .map(index => parseInt(index, 10));
            return selectedIndices.map(index => currentItems[index]);
        } catch (error) {
            console.error("Error in getSelectedColors:", error);
            return [];
        }
    };

    const checkedCount = Object.keys(checkedRows).filter(index => checkedRows[index]).length;

    return (
        <div className="WatchColor">
            <h2 className="colors-header">{viewType === "active" ? "Active Colors" : "Archived Colors"}</h2>
            {error && <p className="error-message">{error}</p>}
            {isLoading ? (
                <p>Loading watch colors...</p>
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
                                currentItems.map((color, index) => (
                                    <tr className="table-row" key={color.id + index + forceUpdate}>
                                        <td className="table-cell">
                                            <input type="checkbox" className="color-checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                        </td>
                                        <td className="table-cell colors-action-column">
                                            <div className="action-buttons">
                                                {viewType === "active" ? (
                                                    <>
                                                        <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(color)} />
                                                        <FaTrash className="delete-icon" size={20} onClick={() => handleDelete(color)} />
                                                    </>
                                                ) : (
                                                    <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(color)} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="table-cell">{color.name}</td>
                                        <td className="table-cell">{color.createdAt}</td>
                                        <td className="table-cell">{color.updatedAt}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="table-row">
                                    <td colSpan="5" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                        {colors.length === 0
                                            ? "No colors available. Please check your data or refresh the page."
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
            )}
            {managementModalOpen && (
                <WatchColorManagement
                    type={managementType}
                    color={managementType === "edit" || managementType === "add" ? selectedColor : (managementType === "restore" || managementType === "delete" && !Array.isArray(selectedColor) ? selectedColor : null)}
                    selectedColors={managementType === "restore" || managementType === "delete" ? (selectedColor || getSelectedColors()) : []}
                    name={name}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmDeleteOrRestore}
                    onSave={() => {
                        setColors([]); // Clear colors before re-fetch
                        setIsLoading(true); // Show loading state
                        setForceUpdate(prev => prev + 1); // Trigger re-fetch
                    }}
                />
            )}
        </div>
    );
};

export default WatchColor;