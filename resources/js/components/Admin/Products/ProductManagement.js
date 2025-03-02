import React, { useState, useEffect } from "react";

const ProductManagement = ({ type, product, selectedProducts, onClose, onConfirm, onSave }) => {
    const [name, setName] = useState(product?.name || "");
    const [description, setDescription] = useState(product?.description || "");
    const [stock, setStock] = useState(product?.stock || "");
    const [price, setPrice] = useState(product?.price || "");
    const [image, setImage] = useState(product?.image || null); // Store file or base64 URL
    const [fileName, setFileName] = useState(product?.image ? "File chosen" : "No file chosen"); // Track file name for display
    const [category, setCategory] = useState(product?.category || "Unisex"); // New state for Category (Men, Women, Unisex)
    const [color, setColor] = useState(product?.color || "Black"); // New state for Color
    const [wristMeasurement, setWristMeasurement] = useState(product?.wristMeasurement || "18cm"); // New state for Wrist Measurement
    const [error, setError] = useState("");

    useEffect(() => {
        if (type === "edit" || type === "add") {
            setName(product?.name || "");
            setDescription(product?.description || "");
            setStock(product?.stock || "");
            setPrice(product?.price || "");
            setImage(product?.image || null); // Reset to null or existing image URL (base64 or path)
            setFileName(product?.image ? "File chosen" : "No file chosen");
            setCategory(product?.category || "Unisex"); // Set default Category
            setColor(product?.color || "Black"); // Set default Color
            setWristMeasurement(product?.wristMeasurement || "18cm"); // Set default Wrist Measurement
            setError("");
        }
    }, [type, product]);

    const validateStock = (value) => {
        const numValue = parseInt(value) || 0;
        return numValue >= 0 && !isNaN(numValue); // Stock must be a non-negative integer
    };

    const validatePrice = (value) => {
        const numValue = parseFloat(value) || 0;
        return numValue >= 0 && !isNaN(numValue); // Price must be a non-negative number
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        console.log("Product name input changed to:", value);
        setName(value);
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        console.log("Description input changed to:", value);
        setDescription(value);
    };

    const handleStockChange = (e) => {
        const value = e.target.value;
        console.log("Stock input changed to:", value);
        if (value === "") {
            setStock("");
            setError("");
            return;
        }
        if (validateStock(value)) {
            setStock(value);
            setError("");
        } else {
            setError("Stock must be a non-negative integer.");
        }
    };

    const handlePriceChange = (e) => {
        const value = e.target.value;
        console.log("Price input changed to:", value);
        if (value === "") {
            setPrice("");
            setError("");
            return;
        }
        if (validatePrice(value)) {
            setPrice(value);
            setError("");
        } else {
            setError("Price must be a non-negative number.");
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log("Image file selected:", file.name);
            setFileName(file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name || "File chosen");
            // Convert file to base64 for storage/display and preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result); // Store base64 string for saving and preview
            };
            reader.readAsDataURL(file); // Read file as base64
        } else {
            setImage(null);
            setFileName("No file chosen");
            setError("Please select an image file.");
        }
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        console.log("Category input changed to:", value);
        setCategory(value);
    };

    const handleColorChange = (e) => {
        const value = e.target.value;
        console.log("Color input changed to:", value);
        setColor(value);
    };

    const handleWristMeasurementChange = (e) => {
        const value = e.target.value;
        console.log("Wrist Measurement input changed to:", value);
        setWristMeasurement(value);
    };

    const handleSave = () => {
        if (type === "edit") {
            if (!name.trim()) {
                setError("Product name is required.");
                return;
            }
            if (description.length > 1000) {
                setError("Description is too long (max 1000 characters).");
                return;
            }
            if (!validateStock(stock)) {
                setError("Stock must be a non-negative integer.");
                return;
            }
            if (!validatePrice(price)) {
                setError("Price must be a non-negative number.");
                return;
            }
            if (!image) {
                setError("Image is required.");
                return;
            }

            setError("");
            const updatedProduct = {
                id: product.id,
                name: name.trim(),
                description: description,
                stock: stock,
                price: price,
                image: typeof image === "string" ? image : image, // Ensure image is a string (base64)
                isArchived: product.isArchived,
                createdAt: product.createdAt, // Preserve original createdAt
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                category: category, // New field
                color: color, // New field
                wristMeasurement: wristMeasurement // New field
            };
            onSave(updatedProduct);
            onClose();
        } else if (type === "add") {
            if (!name.trim()) {
                setError("Product name is required.");
                return;
            }
            if (description.length > 1000) {
                setError("Description is too long (max 1000 characters).");
                return;
            }
            if (!validateStock(stock)) {
                setError("Stock must be a non-negative integer.");
                return;
            }
            if (!validatePrice(price)) {
                setError("Price must be a non-negative number.");
                return;
            }
            if (!image) {
                setError("Image is required.");
                return;
            }

            setError("");
            const newProduct = {
                id: Date.now(), // Use timestamp as a simple unique ID
                name: name.trim(),
                description: description,
                stock: stock,
                price: price,
                image: typeof image === "string" ? image : image, // Ensure image is a string (base64)
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                isArchived: false,
                category: category, // New field
                color: color, // New field
                wristMeasurement: wristMeasurement // New field
            };
            onSave(newProduct);
            onClose();
        }
    };

    const handleConfirm = () => {
        if (type === "delete" || type === "restore") {
            if (!selectedProducts || selectedProducts.length === 0) {
                alert("Please select at least one product to " + (type === "delete" ? "delete" : "restore") + ".");
                return;
            }
            onConfirm(selectedProducts);
            onClose();
        }
    };

    const handleCancel = () => {
        if (type === "edit" || type === "add") {
            console.log(`Canceling ${type} for product:`, product || "new product");
        } else if (type === "delete" || type === "restore") {
            console.log(`Canceling ${type} for selected products:`, selectedProducts);
        }
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Product for ${product?.name}` : "Add New Product";
        return (
            <div className="edit-modal-overlay" onClick={handleCancel}>
                <div className="edit-modal" onClick={e => e.stopPropagation()}>
                    <h3 className="edit-modal-header">{title}</h3>
                    {error && <p className="error-message">{error}</p>}
                    <div className="edit-form" style={{ maxHeight: "70vh", overflowY: "auto" }}> {/* Add scrolling if content exceeds height */}
                        <div className="form-row">
                            <div className="form-column">
                                <label className="edit-form-label">Product Name:</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={handleNameChange}
                                    className="product-input"
                                    placeholder="Enter product name"
                                    style={{ cursor: "text", pointerEvents: "auto", userSelect: "text", width: "100%", boxSizing: "border-box" }} /* Explicitly ensure full width */
                                />
                            </div>
                            <div className="form-column">
                                <label className="edit-form-label">Stock:</label>
                                <input
                                    type="number"
                                    value={stock}
                                    onChange={handleStockChange}
                                    className="product-input"
                                    placeholder="Enter stock quantity"
                                    min="0"
                                    style={{ cursor: "text", pointerEvents: "auto", userSelect: "text", width: "100%", boxSizing: "border-box" }} /* Explicitly ensure full width */
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-column">
                                <label className="edit-form-label">Description:</label>
                                <textarea
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    className="product-input description-input"
                                    placeholder="Enter product description"
                                    style={{ cursor: "text", pointerEvents: "auto", userSelect: "text", width: "100%", boxSizing: "border-box", maxHeight: "100px", minHeight: "60px" }} /* Adjusted height for better fit, allow scrolling within */
                                />
                            </div>
                            <div className="form-column">
                                <label className="edit-form-label">Price:</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={handlePriceChange}
                                    className="product-input"
                                    placeholder="Enter price (₱)"
                                    step="0.01"
                                    min="0"
                                    style={{ cursor: "text", pointerEvents: "auto", userSelect: "text", width: "100%", boxSizing: "border-box" }} /* Explicitly ensure full width */
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-column">
                                <label className="edit-form-label">Category:</label>
                                <select
                                    value={category}
                                    onChange={handleCategoryChange}
                                    className="product-input"
                                    style={{ cursor: "text", pointerEvents: "auto", userSelect: "text", width: "100%", boxSizing: "border-box" }}
                                >
                                    <option value="Men">Men</option>
                                    <option value="Women">Women</option>
                                    <option value="Unisex">Unisex</option>
                                </select>
                            </div>
                            <div className="form-column">
                                <label className="edit-form-label">Color:</label>
                                <input
                                    type="text"
                                    value={color}
                                    onChange={handleColorChange}
                                    className="product-input"
                                    placeholder="Enter color (e.g., Black, Silver)"
                                    style={{ cursor: "text", pointerEvents: "auto", userSelect: "text", width: "100%", boxSizing: "border-box" }} /* Explicitly ensure full width */
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-column">
                                <label className="edit-form-label">Wrist Measurement:</label>
                                <input
                                    type="text"
                                    value={wristMeasurement}
                                    onChange={handleWristMeasurementChange}
                                    className="product-input"
                                    placeholder="Enter wrist measurement (e.g., 18cm)"
                                    style={{ cursor: "text", pointerEvents: "auto", userSelect: "text", width: "100%", boxSizing: "border-box" }} /* Explicitly ensure full width */
                                />
                            </div>
                            <div className="form-column">
                                <label className="edit-form-label">Image:</label>
                                <div className="file-input-wrapper" style={{ width: "100%", boxSizing: "border-box", maxWidth: "100%", overflow: "hidden" }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="product-file-input"
                                        id="image-upload"
                                        style={{ cursor: "pointer", pointerEvents: "auto", userSelect: "none" }} /* Ensure file input is clickable and opens file explorer */
                                    />
                                    <label htmlFor="image-upload" className="file-input-label" style={{ width: "100%", boxSizing: "border-box", maxWidth: "100%", overflow: "hidden", cursor: "pointer" }}>
                                        {fileName}
                                    </label>
                                </div>
                                {image && (
                                    <div className="image-preview">
                                        <img src={image} alt="Preview" className="preview-image" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="button-group">
                            <button className="save-button" onClick={handleSave}>Save</button>
                            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (type === "delete" || type === "restore") {
        const title = type === "delete" ? "Confirm Delete" : "Confirm Restore";
        const message = type === "delete" 
            ? `Are you sure you want to delete ${Array.isArray(selectedProducts) ? selectedProducts.length : 1} product(s)?`
            : `Are you sure you want to restore ${selectedProducts.length} product(s)?`;

        return (
            <div className={`${type}-modal-overlay`} onClick={handleCancel} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className={`${type}-modal`} onClick={e => e.stopPropagation()} style={{ position: 'relative', margin: 'auto', width: "400px", boxSizing: "border-box", maxHeight: "80vh", overflowY: "auto" }}> {/* Limit height and add scrolling if needed */}
                    <h3>{title}</h3>
                    <p>{message}</p>
                    <div className="button-group">
                        <button className="save-button" onClick={handleConfirm}>
                            {type === "delete" ? "Delete" : "Restore"}
                        </button>
                        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default ProductManagement;