import React, { useState, useEffect } from "react";
import Axios from 'axios';

const API_BASE_URL = "http://localhost:8000/api";

const ProductManagement = ({
    type,
    product,
    selectedProducts,
    onClose,
    onConfirm,
    onSave,
    makeAuthenticatedRequest,
    apiBaseUrl = API_BASE_URL,
    externalError
}) => {
    const [formData, setFormData] = useState({
        product_name: '', description: '', price: '', category_id: '', color_id: '', wrist_measurement_id: '', image: null,
    });
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [wristMeasurements, setWristMeasurements] = useState([]);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isDataReadyForEdit, setIsDataReadyForEdit] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchDropdownData = async (url, setter, name) => {
            try {
                const response = await Axios.get(url);
                if (!isMounted) return;
                const items = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                const activeItems = items.filter(item => item.status === 1 || String(item.status) === '1');
                setter(activeItems);
            } catch (fetchError) {
                if (!isMounted) return;
                console.error(`Error fetching ${name}:`, fetchError);
                setError(prev => `${prev} Failed to load ${name}.`.trim());
                setter([]);
            }
        };
        setIsDataReadyForEdit(false);
        Promise.all([
            fetchDropdownData(`${apiBaseUrl}/categories`, setCategories, 'categories'),
            fetchDropdownData(`${apiBaseUrl}/watch_colors`, setColors, 'colors'),
            fetchDropdownData(`${apiBaseUrl}/wrist_measurements`, setWristMeasurements, 'wrist measurements')
        ]).then(() => {
            if (isMounted) setIsDataReadyForEdit(true);
        });
        return () => { isMounted = false; };
    }, [apiBaseUrl]);

    useEffect(() => {
        setError(''); setValidationErrors({});
        if (type === 'edit' && product && isDataReadyForEdit) {
            const category = categories.find(cat => cat.category_name && product.category?.category_name && cat.category_name === product.category.category_name);
            const color = colors.find(col => col.color_name && product.color?.color_name && col.color_name === product.color.color_name);
            const wristMeasurement = wristMeasurements.find(wm => product.wristMeasurementValue && wm.measurement && wm.measurement === product.wristMeasurementValue);

            const newFormData = {
                product_name: product.product_name || '',
                description: product.description || '',
                price: String(product.price) || '',
                category_id: category ? String(category.id) : '',
                color_id: color ? String(color.id) : '',
                wrist_measurement_id: wristMeasurement ? String(wristMeasurement.id) : '',
                image: null,
            };
            setFormData(newFormData);
            console.log("FormData state SET for edit:", newFormData);
        } else if (type === 'add') {
            setFormData({ product_name: '', description: '', price: '', category_id: '', color_id: '', wrist_measurement_id: '', image: null });
        } else if (type === 'edit' && (!product || !isDataReadyForEdit)) {
            console.log("Edit mode, but waiting...");
            setFormData({ product_name: '', description: '', price: '', category_id: '', color_id: '', wrist_measurement_id: '', image: null });
        }
    }, [type, product, isDataReadyForEdit, categories, colors, wristMeasurements]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'price' && value && !/^\d*\.?\d{0,2}$/.test(value)) return;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }));
    };
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({ ...prev, image: file || null }));
        if (validationErrors.image) setValidationErrors(prev => ({ ...prev, image: '' }));
    };

    const validateForm = () => {
        console.log("Validating form data:", JSON.stringify(formData));
        const errors = {};
        if (!formData.product_name?.trim()) errors.product_name = "Product name is required.";
        if (!formData.description?.trim()) errors.description = "Description is required.";
        if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) errors.price = "Price must be a valid positive number.";
        if (!formData.category_id) errors.category_id = "Please select a category.";
        if (!formData.color_id) errors.color_id = "Please select a color.";
        if (!formData.wrist_measurement_id) errors.wrist_measurement_id = "Please select a wrist measurement.";
        setValidationErrors(errors);
        console.log("Validation result (errors):", errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setValidationErrors({});
        if (!validateForm()) { setError("Please fix the errors highlighted below."); return; }
        if (typeof makeAuthenticatedRequest !== 'function') { setError("Configuration error."); return; }
        setIsLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'image' && formData[key]) { data.append(key, formData[key]); }
                else if (key !== 'image' && formData[key] !== null && formData[key] !== undefined && formData[key] !== '') { data.append(key, formData[key]); }
            });
            let url, method;
            if (type === 'add') {
                method = 'post';
                url = `${apiBaseUrl}/products`;
            } else if (type === 'edit' && product) {
                method = 'post'; 
                url = `${apiBaseUrl}/products/${product.id}`;
                data.append('_method', 'PATCH'); 
            } else { throw new Error("Invalid operation type or missing product data."); }

            console.log(`Submitting (${type}) to ${url} via ${method}${type==='edit' ? ' (spoofing PUT)' : ''}...`);
            const response = await makeAuthenticatedRequest(method, url, data);
            console.log(`Response (${type}):`, response.data);
            alert(`Product ${type === 'add' ? 'created' : 'updated'} successfully!`);
            if (onSave && response.data.product) { onSave(response.data.product); }
            else if (onSave) { onSave(); }
        } catch (submitError) {
            console.error(`Error ${type === 'add' ? 'creating' : 'updating'} product:`, submitError);
            if (submitError.response) {
                 console.error("Error response data:", submitError.response.data);
                 console.error("Error response status:", submitError.response.status);
                 if (submitError.response.status === 401) {setError("Unauthenticated.");}
                 else if (submitError.response.status === 422) { const backendErrors = submitError.response.data.errors || {}; setValidationErrors(backendErrors); const errorMessages = Object.values(backendErrors).flat().join(' '); setError(`Validation failed: ${errorMessages || 'Check fields.'}`);}
                 else if (submitError.response.status === 405) {setError(`Operation not allowed (Method Not Allowed).`);}
                 else {setError(`Server error: ${submitError.response.data?.message || `Status ${submitError.response.status}`}`);}
            } else if (submitError.message?.startsWith("Unauthenticated")) {setError(submitError.message);}
            else if (submitError.request) {console.error("Error request:", submitError.request); setError("Network error.");}
            else {console.error('Generic error:', submitError.message); setError(`Unexpected error: ${submitError.message}`);}
        } finally { setIsLoading(false); }
    };

    const handleConfirm = () => {
        if (typeof onConfirm === 'function') { onConfirm(selectedProducts); }
        else { console.error("onConfirm prop is not a function!"); }
    };

    const handleCancel = () => { onClose(); };

    if (type === 'add' || type === 'edit') {
        return (
            <div className="pm-ProductManagement">
                <div className="pm-edit-modal-overlay" onClick={handleCancel}>
                    <div className="pm-edit-modal" onClick={e => e.stopPropagation()}>
                        <h2>{type === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
                        {externalError && <p className="pm-error-message" style={{color: 'orange'}}>{externalError}</p>}
                        {error && <p className="pm-error-message">{error}</p>}
                        <form className="pm-edit-form" onSubmit={handleSubmit} noValidate>
                            <div className="pm-form-group pm-full-width">
                                {/* Show image preview: either the newly selected image or the current product image */}
                                {(formData.image || (type === 'edit' && product?.image_url)) && (
                                    <div className="pm-product-image-wrapper">
                                        <img
                                            src={formData.image ? URL.createObjectURL(formData.image) : product.image_url}
                                            alt="Product Preview"
                                            className="pm-product-image-preview"
                                            onError={(e) => {
                                                console.warn(`Failed to load image: ${formData.image ? 'new image' : product.image_url}`);
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                <label htmlFor="image">Image:</label>
                                <input
                                    id="image"
                                    type="file"
                                    name="image"
                                    onChange={handleFileChange}
                                    className={validationErrors.image ? 'pm-input-error' : ''}
                                />
                                <p className="pm-file-info">
                                    {formData.image
                                        ? formData.image.name
                                        : (type === 'edit' && product?.image_url
                                            ? 'Current image exists'
                                            : 'No file chosen')}
                                </p>
                                {validationErrors.image && (
                                    <p className="pm-validation-error">
                                        {typeof validationErrors.image === 'string'
                                            ? validationErrors.image
                                            : validationErrors.image[0]}
                                    </p>
                                )}
                            </div>
                            <div className="pm-form-row">
                                <div className="pm-form-group">
                                    <label htmlFor="product_name">Product Name:</label>
                                    <input
                                        id="product_name"
                                        type="text"
                                        name="product_name"
                                        value={formData.product_name}
                                        onChange={handleInputChange}
                                        placeholder="Enter product name"
                                        required
                                        className={validationErrors.product_name ? 'pm-input-error' : ''}
                                    />
                                    {validationErrors.product_name && (
                                        <p className="pm-validation-error">
                                            {typeof validationErrors.product_name === 'string'
                                                ? validationErrors.product_name
                                                : validationErrors.product_name[0]}
                                        </p>
                                    )}
                                </div>
                                <div className="pm-form-group">
                                    <label htmlFor="price">Price (₱):</label>
                                    <input
                                        id="price"
                                        type="text"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 2500.00"
                                        required
                                        className={validationErrors.price ? 'pm-input-error' : ''}
                                    />
                                    {validationErrors.price && (
                                        <p className="pm-validation-error">
                                            {typeof validationErrors.price === 'string'
                                                ? validationErrors.price
                                                : validationErrors.price[0]}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="pm-form-row">
                                <div className="pm-form-group">
                                    <label htmlFor="category_id">Category:</label>
                                    <select
                                        id="category_id"
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleInputChange}
                                        required
                                        className={validationErrors.category_id ? 'pm-input-error' : ''}
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.category_name}
                                            </option>
                                        ))}
                                    </select>
                                    {validationErrors.category_id && (
                                        <p className="pm-validation-error">
                                            {typeof validationErrors.category_id === 'string'
                                                ? validationErrors.category_id
                                                : validationErrors.category_id[0]}
                                        </p>
                                    )}
                                </div>
                                <div className="pm-form-group">
                                    <label htmlFor="color_id">Color:</label>
                                    <select
                                        id="color_id"
                                        name="color_id"
                                        value={formData.color_id}
                                        onChange={handleInputChange}
                                        required
                                        className={validationErrors.color_id ? 'pm-input-error' : ''}
                                    >
                                        <option value="">Select a color</option>
                                        {colors.map(color => (
                                            <option key={color.id} value={color.id}>
                                                {color.color_name}
                                            </option>
                                        ))}
                                    </select>
                                    {validationErrors.color_id && (
                                        <p className="pm-validation-error">
                                            {typeof validationErrors.color_id === 'string'
                                                ? validationErrors.color_id
                                                : validationErrors.color_id[0]}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="pm-form-row">
                                <div className="pm-form-group">
                                    <label htmlFor="wrist_measurement_id">Wrist Measurement:</label>
                                    <select
                                        id="wrist_measurement_id"
                                        name="wrist_measurement_id"
                                        value={formData.wrist_measurement_id}
                                        onChange={handleInputChange}
                                        required
                                        className={validationErrors.wrist_measurement_id ? 'pm-input-error' : ''}
                                    >
                                        <option value="">Select a measurement</option>
                                        {wristMeasurements.map(wm => (
                                            <option key={wm.id} value={wm.id}>
                                                {wm.measurement || wm.wrist_size || `ID: ${wm.id}`}
                                            </option>
                                        ))}
                                    </select>
                                    {validationErrors.wrist_measurement_id && (
                                        <p className="pm-validation-error">
                                            {typeof validationErrors.wrist_measurement_id === 'string'
                                                ? validationErrors.wrist_measurement_id
                                                : validationErrors.wrist_measurement_id[0]}
                                        </p>
                                    )}
                                </div>
                                <div className="pm-form-group">
                                    {/* Empty div to maintain the double-column layout */}
                                </div>
                            </div>
                            <div className="pm-form-group pm-full-width">
                                <label htmlFor="description">Description:</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter product description"
                                    rows="3"
                                    required
                                    className={validationErrors.description ? 'pm-input-error' : ''}
                                />
                                {validationErrors.description && (
                                    <p className="pm-validation-error">
                                        {typeof validationErrors.description === 'string'
                                            ? validationErrors.description
                                            : validationErrors.description[0]}
                                        </p>
                                )}
                            </div>
                            <div className="pm-form-actions">
                                <button
                                    type="submit"
                                    className="pm-save-button"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    className="pm-cancel-button"
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
    else if (type === 'archive' || type === 'restore') {
         const action = type === 'archive' ? 'Archive' : 'Restore';
         const productsToAction = Array.isArray(selectedProducts) ? selectedProducts : [];
         const message = `Are you sure you want to ${action.toLowerCase()} ${productsToAction.length} product(s)?`;
         return (
             <div className="pm-ProductManagement">
                 <div className={`pm-${type}-modal-overlay`} onClick={handleCancel}>
                     <div className={`pm-${type}-modal`} onClick={e => e.stopPropagation()}>
                         <h3>Confirm {action}</h3>
                         {externalError && <p className="pm-error-message" style={{color: 'orange'}}>{externalError}</p>}
                         {error && <p className="pm-error-message">{error}</p>}
                         <p>{message}</p>
                         <div className="pm-button-group">
                             <button
                                 className="pm-confirm-button"
                                 onClick={handleConfirm}
                                 disabled={isLoading}
                             >
                                 {isLoading ? 'Processing...' : action}
                             </button>
                             <button
                                 className="pm-cancel-button"
                                 onClick={handleCancel}
                                 disabled={isLoading}
                             >
                                 Cancel
                             </button>
                         </div>
                     </div>
                 </div>
             </div>
         );
    }
    return null;
};

export default ProductManagement;