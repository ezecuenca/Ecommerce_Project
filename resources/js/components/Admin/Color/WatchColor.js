import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa"; // Added FaUndo for Restore
import WatchColorManagement from "./WatchColorManangement";

const WatchColor = () => {
    const [checkedRows, setCheckedRows] = useState({});
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active"); // Colors can now have active/archived views
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedColor, setSelectedColor] = useState(null);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 5; // Match CategoryList pagination

    const [initialColors, setInitialColors] = useState([
        { id: 1, name: "Red", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: false },
        { id: 2, name: "Green", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: false },
        { id: 3, name: "Blue", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: false },
        // Added an archived color for testing
        { id: 4, name: "Yellow", createdAt: "11/21/24", updatedAt: "11/21/24", isArchived: true },
    ]);

    const [colors, setColors] = useState(initialColors);
    const tableRef = useRef(null);

    useEffect(() => {
        const savedColors = localStorage.getItem("watchColors");
        let updatedColors = [...initialColors];
        if (savedColors) {
            try {
                updatedColors = JSON.parse(savedColors).map(color => ({
                    ...color,
                    isArchived: color.isArchived !== undefined ? color.isArchived : false,
                    createdAt: color.createdAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                    updatedAt: color.updatedAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                }));
                console.log("Loaded colors from localStorage:", updatedColors);
            } catch (error) {
                console.error("Error parsing colors from localStorage:", error);
                updatedColors = [...initialColors];
                localStorage.setItem("watchColors", JSON.stringify(updatedColors));
            }
        } else {
            console.log("Initialized with static colors:", initialColors);
            localStorage.setItem("watchColors", JSON.stringify(initialColors));
        }
        setColors(updatedColors);
        setInitialColors(updatedColors);
        setCheckedRows({});
        setIsSelectAll(false);
    }, []);

    const getCurrentData = () => {
        if (!colors || colors.length === 0) {
            console.warn("No colors data available, returning empty array.");
            return [];
        }
        let filteredColors = colors.filter(color => color.isArchived === (viewType === "archived"));
        if (searchQuery.trim()) {
            filteredColors = filteredColors.filter(color =>
                color.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        try {
            const isChecked = e.target.checked;
            setIsSelectAll(isChecked);
            const newCheckedRows = {};
            if (isChecked) {
                currentItems.forEach((_, index) => {
                    newCheckedRows[index] = true;
                });
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.color-checkbox').forEach(checkbox => checkbox.checked = true);
                }
            } else {
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.color-checkbox').forEach(checkbox => checkbox.checked = false);
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
            console.log("Attempting to delete - viewType:", viewType, "colorToDelete:", colorToDelete, "checkedRows:", checkedRows);
            const selectedIndices = Object.keys(checkedRows)
                .filter(index => checkedRows[index])
                .map(index => parseInt(index, 10));

            if (colorToDelete) {
                if (viewType !== "active") {
                    alert("You can only delete from Active Colors.");
                    return;
                }
                setManagementType("delete");
                setSelectedColor([colorToDelete]);
                setManagementModalOpen(true);
                return;
            }

            const selectedCount = selectedIndices.length;
            if (selectedCount < 1) {
                alert("Please select at least one color to delete.");
                return;
            }

            if (viewType !== "active") {
                alert("You can only delete from Active Colors.");
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
            console.log("Attempting to restore - viewType:", viewType, "colorToRestore:", colorToRestore, "checkedRows:", checkedRows);
            const selectedIndices = Object.keys(checkedRows)
                .filter(index => checkedRows[index])
                .map(index => parseInt(index, 10));

            if (colorToRestore) {
                if (viewType !== "archived") {
                    alert("You can only restore from Archived Colors.");
                    return;
                }
                console.log("Opening restore modal for single color:", colorToRestore);
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

            console.log("Opening restore modal for multiple colors:", getSelectedColors());
            setManagementType("restore");
            setSelectedColor(getSelectedColors());
            setManagementModalOpen(true);
        } catch (error) {
            console.error("Error in handleRestore:", error);
        }
    };

    const handleAdd = () => {
        try {
            console.log("Current viewType:", viewType, "Opening Add modal");
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
            console.log("Opening edit for color:", color);
            setSelectedColor(color);
            setName(color.name || "");
            setManagementType("edit");
            setManagementModalOpen(true);
        } catch (error) {
            console.error("Error in handleEdit:", error);
        }
    };

    const validateName = (name) => {
        return name.trim().length > 0; // Simple validation for color name
    };

    const handleNameChange = (e) => setName(e.target.value);

    const handleSearchChange = (e) => {
        try {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error in handleSearchChange:", error);
        }
    };

    const handleSaveEditOrAdd = (newOrUpdatedColor) => {
        try {
            if (managementType === "edit") {
                if (!selectedColor) {
                    alert("No color selected for editing.");
                    return;
                }

                if (!validateName(newOrUpdatedColor.name)) {
                    setError("Color name is required.");
                    return;
                }

                setError("");
                const updatedColors = colors.map(c =>
                    c.id === selectedColor.id ? { ...newOrUpdatedColor, id: selectedColor.id, createdAt: selectedColor.createdAt, isArchived: selectedColor.isArchived } : c
                );
                setColors(updatedColors);
                setInitialColors(updatedColors);
                localStorage.setItem("watchColors", JSON.stringify(updatedColors));
                setManagementModalOpen(false);
                setSelectedColor(null);
                setName("");
                console.log("Edited color, updated colors:", updatedColors);
                setForceUpdate(prev => prev + 1);
            } else if (managementType === "add") {
                if (!validateName(newOrUpdatedColor.name)) {
                    setError("Color name is required.");
                    return;
                }

                setError("");
                const newColor = {
                    id: Date.now(),
                    name: newOrUpdatedColor.name.trim(),
                    createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                    updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                    isArchived: false, // New colors are active by default
                };
                const updatedColors = [newColor, ...colors];
                setColors(updatedColors);
                setInitialColors(updatedColors);
                localStorage.setItem("watchColors", JSON.stringify(updatedColors));
                setManagementModalOpen(false);
                setName("");
                console.log("Added new color, updated colors:", updatedColors);
                setForceUpdate(prev => prev + 1);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error("Error in handleSaveEditOrAdd:", error);
        }
    };

    const handleConfirmDeleteOrRestore = (items) => {
        try {
            console.log("Confirming action - managementType:", managementType, "items:", items);
            if (managementType === "delete") {
                const updatedColors = colors.map(color => {
                    if (Array.isArray(items)) {
                        if (items.some(item => item.id === color.id)) {
                            return { ...color, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                        }
                    } else {
                        if (items.id === color.id) {
                            return { ...color, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                        }
                    }
                    return color;
                });
                setColors(updatedColors);
                setInitialColors(updatedColors);
                setCheckedRows({});
                setIsSelectAll(false);
                if (tableRef.current && viewType === "active") {
                    tableRef.current.querySelectorAll('.color-checkbox').forEach(checkbox => checkbox.checked = false);
                }
                setManagementModalOpen(false);
                if (currentData.length === 0) {
                    setCurrentPage(1);
                }
                setForceUpdate(prev => prev + 1);
                localStorage.setItem("watchColors", JSON.stringify(updatedColors));
                console.log("Colors after delete:", updatedColors);
            } else if (managementType === "restore") {
                const updatedColors = colors.map(color => {
                    if (Array.isArray(items)) {
                        if (items.some(item => item.id === color.id)) {
                            return { ...color, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                        }
                    } else {
                        if (items.id === color.id) {
                            return { ...color, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                        }
                    }
                    return color;
                });
                setColors(updatedColors);
                setInitialColors(updatedColors);
                setCheckedRows({});
                setIsSelectAll(false);
                if (tableRef.current && viewType === "archived") {
                    tableRef.current.querySelectorAll('.color-checkbox').forEach(checkbox => checkbox.checked = false);
                }
                setManagementModalOpen(false);
                if (currentData.length === 0) {
                    setCurrentPage(1);
                }
                setForceUpdate(prev => prev + 1);
                localStorage.setItem("watchColors", JSON.stringify(updatedColors));
                console.log("Colors after restore:", updatedColors);
            }
        } catch (error) {
            console.error("Error in handleConfirmDeleteOrRestore:", error);
        }
    };

    const handleCloseManagement = () => {
        try {
            console.log("Closing management modal - managementType:", managementType);
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
            <h2 className="colors-header">{viewType === "active" ? "Colors" : "Archived Colors"}</h2>
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
            {managementModalOpen && (
                <WatchColorManagement
                    type={managementType}
                    color={managementType === "edit" || managementType === "add" ? selectedColor : (managementType === "restore" || managementType === "delete" && !Array.isArray(selectedColor) ? selectedColor : null)}
                    selectedColors={managementType === "restore" || managementType === "delete" ? (selectedColor || getSelectedColors()) : []}
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