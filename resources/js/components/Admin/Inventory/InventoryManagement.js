import React, { useState, useEffect } from "react";

const InventoryManagement = ({ type, item, stock, onClose, onSave, onConfirm }) => {
    const [localStock, setLocalStock] = useState(stock || 0);
    const [error, setError] = useState("");

    useEffect(() => {
        console.log("InventoryManagement rendered with type:", type, "item:", item, "stock:", stock);
        if (type === "edit" && item) {
            setLocalStock(item.stock || 0);
            console.log("Initializing edit for item:", item);
        } else if (type === "restore" || type === "delete") {
            console.log("Initializing", type, "for item(s):", item);
        }
    }, [type, item, stock]);

    const validateStock = (stock) => {
        return stock >= 0; // Ensure stock is non-negative
    };

    const handleStockChange = (e) => {
        const value = e.target.value;
        // Validate that the input is a non-negative integer
        if (/^\d*$/.test(value)) {
            setLocalStock(value);
        }
        else{
            return
        }
    };

    const handleSave = () => {
        if (type === "edit") {
            if (!item) {
                alert("No item selected for editing.");
                return;
            }

            if (!validateStock(localStock)) {
                setError("Stock quantity must be 0 or greater.");
                return;
            }

            setError("");
            onSave(localStock);
            onClose();
        }
    };

    const handleConfirm = () => {
        if (type === "delete") {
            if (!item || (Array.isArray(item) && item.length === 0)) {
                alert("No item selected for deletion.");
                return;
            }
            console.log("Confirming delete for item(s):", item);
            onConfirm(item);
            onClose();
        } else if (type === "restore") {
            if (!item || (Array.isArray(item) && item.length === 0)) {
                alert("No item selected for restoration.");
                return;
            }
            console.log("Confirming restore for item(s):", item);
            onConfirm(item);
            onClose();
        }
    };

    const handleCancel = () => {
        console.log("Closing modal for type:", type);
        onClose();
    };

    if (type === "edit") {
        return (
            <div className="InventoryManagement">
                <div className="edit-modal-overlay" onClick={handleCancel}>
                    <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit Stocks for {item?.productName}</h3>
                        {error && <p className="error-message">{error}</p>}
                        <div className="edit-form">
                            <label>Stocks:</label>
                            <input
                                type="text"
                                value={localStock}
                                onChange={handleStockChange}
                                className="stock-input"
                                placeholder="Enter stock quantity"
                            />
                            <div className="button-group">
                                <button className="save-button" onClick={handleSave}>
                                    Save
                                </button>
                                <button className="cancel-button" onClick={handleCancel}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (type === "delete" || type === "restore") {
        const title = type === "delete" ? "Confirm Deletion" : "Confirm Restoration";
        const message =
            type === "delete"
                ? `Are you sure you want to delete ${
                      Array.isArray(item) ? item.length : 1
                  } item(s)? `
                : `Are you sure you want to restore ${
                      Array.isArray(item) ? item.length : 1
                  } item(s)?`;

        return (
            <div
                className={`${type === "delete" ? "delete" : "restore"}-modal-overlay`}
                onClick={handleCancel}
            >
                <div
                    className={`${type === "delete" ? "delete" : "restore"}-modal`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3>{title}</h3>
                    <p>{message}</p>
                    <div className="button-group">
                        <button className="save-button" onClick={handleConfirm}>
                            {type === "delete" ? "Delete" : "Restore"}
                        </button>
                        <button className="cancel-button" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default InventoryManagement;