import React, { useState, useEffect } from "react";
import Axios from 'axios';

const ProductManagement = ({ type, product, selectedProducts, onClose, onConfirm, onSave }) => {
    const [formData, setFormData] = useState({
        product_name: '',
        description: '',
        price: '',
        category_id: '',
        color_id: '',
        wrist_measurement_id: '',
        image: null,
    });

    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [wristMeasurements, setWristMeasurements] = useState([]);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        console.log("ProductManagement component mounted with props:", { type, product, selectedProducts });
        if (type === 'edit' && product) {
            console.log("Populating form with product data:", product);
            const category = categories.find(cat => cat.category_name === product.category);
            const color = colors.find(col => col.color_name === product.color);
            const wristMeasurement = wristMeasurements.find(wm => 
                (wm.measurement || wm.wrist_size) === product.wrist_measurement
            );

            setFormData({
                product_name: product.product_name || '',
                description: product.description || '',
                price: product.price || '',
                category_id: category ? category.id : '',
                color_id: color ? color.id : '',
                wrist_measurement_id: wristMeasurement ? wristMeasurement.id : '',
                image: null,
            });
        }
    }, [type, product, categories, colors, wristMeasurements]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                console.log("Fetching all categories from /api/categories...");
                const response = await Axios.get('http://localhost:8000/api/categories');
                console.log("Raw Categories Response:", response.data);
                const activeCategories = Array.isArray(response.data)
                    ? response.data.filter(category => category.status === 1 || category.status === '1' || category.status === 'active')
                    : [];
                console.log("Active categories after filtering:", activeCategories);
                if (activeCategories.length === 0) {
                    console.warn("No active categories found!");
                }
                setCategories(activeCategories);
            } catch (error) {
                console.error("Error fetching categories:", error);
                console.error("Error response:", error.response?.data);
                console.error("Error status:", error.response?.status);
                setError(`Failed to load categories: ${error.response?.data?.message || error.message}`);
                setCategories([]);
            }
        };

        const fetchColors = async () => {
            try {
                console.log("Fetching all colors from /api/watch_colors...");
                const response = await Axios.get('http://localhost:8000/api/watch_colors');
                console.log("Raw Colors Response:", response.data);
                const activeColors = Array.isArray(response.data)
                    ? response.data.filter(color => color.status === 1 || color.status === '1' || color.status === 'active')
                    : [];
                console.log("Active colors after filtering:", activeColors);
                if (activeColors.length === 0) {
                    console.warn("No active colors found!");
                }
                setColors(activeColors);
            } catch (error) {
                console.error("Error fetching colors:", error);
                console.error("Error response:", error.response?.data);
                console.error("Error status:", error.response?.status);
                setError(`Failed to load colors: ${error.response?.data?.message || error.message}`);
                setColors([]);
            }
        };

        const fetchWristMeasurements = async () => {
            try {
                console.log("Fetching all wrist measurements from /api/wrist_measurements...");
                const response = await Axios.get('http://localhost:8000/api/wrist_measurements');
                console.log("Raw Wrist Measurements Response:", response.data);
                const activeWristMeasurements = Array.isArray(response.data)
                    ? response.data.filter(wm => wm.status === 1 || wm.status === '1' || wm.status === 'active')
                    : [];
                console.log("Active wrist measurements after filtering:", activeWristMeasurements);
                if (activeWristMeasurements.length === 0) {
                    console.warn("No active wrist measurements found!");
                }
                setWristMeasurements(activeWristMeasurements);
            } catch (error) {
                console.error("Error fetching wrist measurements:", error);
                console.error("Error response:", error.response?.data);
                console.error("Error status:", error.response?.status);
                setError(`Failed to load wrist measurements: ${error.response?.data?.message || error.message}`);
                setWristMeasurements([]);
            }
        };

        fetchCategories();
        fetchColors();
        fetchWristMeasurements();
    }, []);

    useEffect(() => {
        console.log("Current categories state:", categories);
        console.log("Current colors state:", colors);
        console.log("Current wrist measurements state:", wristMeasurements);
    }, [categories, colors, wristMeasurements]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Only allow numbers and one decimal point
        if (name === 'price' && !/^\d*\.?\d{0,2}$/.test(value)) {
            return; // Ignore the input if it doesn't match the pattern
        }
        setFormData({ ...formData, [name]: value });
        setValidationErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, image: e.target.files[0] });
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.product_name.trim()) {
            errors.product_name = "Product name is required.";
        }
        if (!formData.description.trim()) {
            errors.description = "Description is required.";
        }
        if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
            errors.price = "Price must be a positive number.";
        }
        if (!formData.category_id) {
            errors.category_id = "Please select a category.";
        }
        if (!formData.color_id) {
            errors.color_id = "Please select a color.";
        }
        if (!formData.wrist_measurement_id) {
            errors.wrist_measurement_id = "Please select a wrist measurement.";
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submitted with data:", formData);

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setError("Please fix the errors in the form.");
            return;
        }

        try {
            const data = new FormData();
            data.append('product_name', formData.product_name);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('category_id', formData.category_id);
            data.append('color_id', formData.color_id);
            data.append('wrist_measurement_id', formData.wrist_measurement_id);
            if (type === 'edit') {
                data.append('stock', product.stock || 0);
                data.append('_method', 'PUT'); // Ensure the backend recognizes this as a PUT request
            }
            if (formData.image) {
                data.append('image', formData.image);
            }

            console.log("Submitting form data:", Object.fromEntries(data));

            let response;
            if (type === 'add') {
                response = await Axios.post('http://localhost:8000/api/products', data, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else if (type === 'edit') {
                response = await Axios.post(`http://localhost:8000/api/products/${product.id}`, data, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            console.log(`${type === 'add' ? 'Product created' : 'Product updated'}:`, response.data);

            if (onSave) {
                console.log("Calling onSave to refresh product list");
                onSave();
            }
            onClose();
        } catch (error) {
            console.error(`Error ${type === 'add' ? 'creating' : 'updating'} product:`, error);
            console.error("Full error response:", JSON.stringify(error.response?.data, null, 2));
            if (error.response?.status === 422) {
                const backendErrors = error.response.data.errors || {};
                console.log("Backend validation errors:", backendErrors);
                setValidationErrors(backendErrors);
                const errorMessages = Object.values(backendErrors).flat().join(' ');
                setError(`Validation failed: ${errorMessages || 'Please check the form.'}`);
            } else {
                setError(`Failed to ${type === 'add' ? 'create' : 'update'} product: ${error.response?.data?.message || error.message}`);
            }
        }
    };

    const handleConfirm = () => {
        console.log("Confirming action for type:", type, "with selectedProducts:", selectedProducts);
        onConfirm(selectedProducts);
        onClose();
    };

    const handleCancel = () => {
        console.log("Cancel button clicked, closing modal");
        onClose();
    };

    if (type === 'add' || type === 'edit') {
        return (
            <div className="ProductManagement">
                <div className="edit-modal-overlay" onClick={handleCancel}>
                    <div className="edit-modal" onClick={e => e.stopPropagation()}>
                        <h2>{type === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
                        {error && <p className="error-message">{error}</p>}
                        <form className="edit-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Product Name:</label>
                                <input
                                    type="text"
                                    name="product_name"
                                    value={formData.product_name}
                                    onChange={handleInputChange}
                                    placeholder="Enter product name"
                                    required
                                />
                                {validationErrors.product_name && <p className="error-message">{validationErrors.product_name}</p>}
                            </div>
                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter product description"
                                    rows="3"
                                    required
                                />
                                {validationErrors.description && <p className="error-message">{validationErrors.description}</p>}
                            </div>
                            <div className="form-group">
                                <label>Price:</label>
                                <input
                                    type="text"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="Enter price (₱)"
                                    required
                                />
                                {validationErrors.price && <p className="error-message">{validationErrors.price}</p>}
                            </div>
                            <div className="form-group">
                                <label>Category:</label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.length > 0 ? (
                                        categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.category_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No active categories available.</option>
                                    )}
                                </select>
                                {validationErrors.category_id && <p className="error-message">{validationErrors.category_id}</p>}
                            </div>
                            <div className="form-group">
                                <label>Color:</label>
                                <select
                                    name="color_id"
                                    value={formData.color_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a color</option>
                                    {colors.length > 0 ? (
                                        colors.map(color => (
                                            <option key={color.id} value={color.id}>
                                                {color.color_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No active colors available.</option>
                                    )}
                                </select>
                                {validationErrors.color_id && <p className="error-message">{validationErrors.color_id}</p>}
                            </div>
                            <div className="form-group">
                                <label>Wrist Measurement:</label>
                                <select
                                    name="wrist_measurement_id"
                                    value={formData.wrist_measurement_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a wrist measurement</option>
                                    {wristMeasurements.length > 0 ? (
                                        wristMeasurements.map(wm => (
                                            <option key={wm.id} value={wm.id}>
                                                {wm.measurement || wm.wrist_size || 'Unknown'}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No active wrist measurements available.</option>
                                    )}
                                </select>
                                {validationErrors.wrist_measurement_id && <p className="error-message">{validationErrors.wrist_measurement_id}</p>}
                            </div>
                            <div className="form-group">
                                <label>Image:</label>
                                <input
                                    type="file"
                                    name="image"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                />
                                <p>{formData.image ? formData.image.name : 'No file chosen'}</p>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="save-button">Save</button>
                                <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    } else if (type === 'archive' || type === 'restore') {
        const action = type === 'archive' ? 'Archive' : 'Restore';
        const message = `Are you sure you want to ${action.toLowerCase()} ${selectedProducts.length} product(s)?`;

        return (
            <div className="ProductManagement">
                <div className={`${type}-modal-overlay`} onClick={handleCancel}>
                    <div className={`${type}-modal`} onClick={e => e.stopPropagation()}>
                        <h3>Confirm {action}</h3>
                        {error && <p className="error-message">{error}</p>}
                        <p>{message}</p>
                        <div className="button-group">
                            <button className="confirm-button" onClick={handleConfirm}>{action}</button>
                            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default ProductManagement;