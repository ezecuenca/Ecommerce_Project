import React, { useState, useEffect } from "react";
import Axios from 'axios';

const ProductManagement = ({ type, product, selectedProducts, onClose, onConfirm, onSave }) => {
    const [formData, setFormData] = useState({
        product_name: '',
        description: '',
        price: '',
        category: 'Men',
        color_id: '',
        wrist_measurement: '',
        image: null,
    });

    const [colors, setColors] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        console.log("ProductManagement component mounted with props:", { type, product, selectedProducts });
        if (type === 'edit' && product) {
            console.log("Populating form with product data:", product);
            setFormData({
                product_name: product.product_name || '',
                description: product.description || '',
                price: product.price || '',
                category: product.category === 'Women' ? 'Women' : 'Men',
                color_id: product.color_id || '',
                wrist_measurement: product.wrist_measurement || '',
                image: null,
            });
        }
    }, [type, product]);

    useEffect(() => {
        const fetchColors = async () => {
            try {
                console.log("Fetching all colors from /api/watch_colors...");
                const response = await Axios.get('http://localhost:8000/api/watch_colors');
                console.log("Raw Colors Response:", response.data);

                const activeColors = Array.isArray(response.data)
                    ? response.data.filter(color => {
                          console.log("Color:", color);
                          return color.status === 1 || color.status === '1' || color.status === 'active';
                      })
                    : [];
                console.log("Active colors after filtering:", activeColors);
                setColors(activeColors);
            } catch (error) {
                console.error("Error fetching colors:", error);
                console.error("Error response:", error.response?.data);
                console.error("Error status:", error.response?.status);
                setError(`Failed to load colors: ${error.response?.data?.message || error.message}`);
                setColors([]);
            }
        };
        fetchColors();
    }, []);

    useEffect(() => {
        console.log("Current colors state:", colors);
    }, [colors]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, image: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submitted with data:", formData);

        if (!formData.color_id) {
            setError("Please select a color.");
            return;
        }

        try {
            const data = new FormData();
            data.append('product_name', formData.product_name);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('category_id', formData.category === 'Men' ? 1 : 2);
            data.append('color_id', formData.color_id);
            data.append('wrist_measurement', formData.wrist_measurement);
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
                response = await Axios.put(`http://localhost:8000/api/products/${product.id}`, {
                    product_name: formData.product_name,
                    description: formData.description,
                    price: formData.price,
                    image_url: product.image_url,
                    color_id: formData.color_id,
                    category_id: formData.category === 'Men' ? 1 : 2,
                    wrist_measurement_id: product.wrist_measurement_id,
                    stock: product.stock,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
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
            console.error("Error response:", error.response?.data);
            setError(`Failed to ${type === 'add' ? 'create' : 'update'} product: ${error.response?.data?.message || error.message}`);
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
                            </div>
                            <div className="form-group">
                                <label>Price:</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="Enter price (₱)"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category:</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="Men">Men</option>
                                    <option value="Women">Women</option>
                                </select>
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
                            </div>
                            <div className="form-group">
                                <label>Wrist Measurement:</label>
                                <input
                                    type="text"
                                    name="wrist_measurement"
                                    value={formData.wrist_measurement}
                                    onChange={handleInputChange}
                                    placeholder="Enter wrist measurement (e.g., 18cm)"
                                    required
                                />
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