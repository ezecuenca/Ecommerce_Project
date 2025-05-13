import React, { useState, useEffect } from "react";

const AddressModal = ({ isOpen, onClose, onSave, address, isEditMode, isSubmitting: externalIsSubmitting, externalError }) => { // Added externalIsSubmitting and externalError
    const [formData, setFormData] = useState({
        phoneNumber: "",
        street: "",
        country: "Philippines", // Default to Philippines
        postalCode: "",
        city: "",
        region: "",
        isDefault: false,
    });
    const [internalError, setInternalError] = useState(null); // For modal-specific errors

    // Reset form when opening for "Add New" or when address prop changes for "Edit"
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && address) {
                setFormData({
                    phoneNumber: address.phoneNumber ? address.phoneNumber.replace(/^\+63/, '') : "",
                    street: address.streetAddress || "",
                    country: address.country || "Philippines", // Fallback to Philippines
                    postalCode: address.postalCode || "",
                    city: address.city || "",
                    region: address.region || "",
                    isDefault: address.isDefault || false,
                });
            } else { // For "Add New" mode, reset to initial (or default)
                setFormData({
                    phoneNumber: "",
                    street: "",
                    country: "Philippines",
                    postalCode: "",
                    city: "",
                    region: "",
                    isDefault: false,
                });
            }
            setInternalError(null); // Clear internal errors when modal opens/re-initializes
        }
    }, [isOpen, isEditMode, address]); // Rerun when isOpen changes too

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setInternalError(null); // Clear error on change

        if (name === "phoneNumber") {
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length > 10) return;
            setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }));
        }
    };

    const validateForm = () => {
        if (!formData.street.trim()) return "Street is required.";
        if (!formData.country.trim()) return "Country is required.";
        if (!formData.postalCode.trim()) return "Postal Code is required.";
        if (!formData.city.trim()) return "City is required.";
        if (!formData.region.trim()) return "Region is required.";
        if (!formData.phoneNumber.trim()) return "Phone number is required.";
        // Add more client-side checks if needed
        return null; // No errors
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setInternalError(null); // Clear previous internal errors
        const validationError = validateForm();
        if (validationError) {
            setInternalError(validationError);
            return;
        }

        const newAddressPayloadForParent = {
            // Keys here should match what `handleSaveAddress` in PersonalInfo.js expects
            phoneNumber: formData.phoneNumber ? `+63${formData.phoneNumber}` : "",
            streetAddress: formData.street, // This will become 'street' in PersonalInfo.js
            country: formData.country,
            postalCode: formData.postalCode,
            city: formData.city,
            region: formData.region,
            isDefault: formData.isDefault,
        };
        onSave(newAddressPayloadForParent); // This calls handleSaveAddress in PersonalInfo.js
        // onClose(); // Let parent decide to close on success
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{isEditMode ? "Edit Address" : "New Address"}</h2>
                    <span className="modal-close" onClick={!externalIsSubmitting ? onClose : undefined}> {/* Prevent closing while parent is submitting */}
                        ×
                    </span>
                </div>
                {/* Display internal modal errors */}
                {internalError && <p className="error-message" style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{internalError}</p>}
                {/* Display errors from parent (e.g., API errors) */}
                {externalError && !internalError && <p className="error-message" style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{externalError}</p>}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Phone Number <span style={{color: 'red'}}>*</span></label>
                        <div className="phone-input-wrapper">
                            <span className="phone-prefix">(+63)</span>
                            <input
                                type="text"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="9123456789"
                                disabled={externalIsSubmitting}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Street <span style={{color: 'red'}}>*</span></label>
                            <input
                                type="text"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                placeholder="Street Name, Building, House No."
                                disabled={externalIsSubmitting}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Country <span style={{color: 'red'}}>*</span></label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                placeholder="Country"
                                disabled={externalIsSubmitting}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Postal Code <span style={{color: 'red'}}>*</span></label>
                            <input
                                type="text"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={handleChange}
                                placeholder="Postal Code"
                                disabled={externalIsSubmitting}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>City <span style={{color: 'red'}}>*</span></label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="City"
                                disabled={externalIsSubmitting}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Region <span style={{color: 'red'}}>*</span></label>
                            <input
                                type="text"
                                name="region"
                                value={formData.region} // CORRECTED
                                onChange={handleChange}
                                placeholder="Region"
                                disabled={externalIsSubmitting}
                                required
                            />
                        </div>
                         {/* You can add an empty div here for spacing if needed for single item row */}
                         <div className="form-group" style={{ visibility: 'hidden' }}></div>
                    </div>
                    <div className="form-group default-toggle">
                        <label>Set as Default Address</label>
                        <label className="switch">
                            <input
                                type="checkbox"
                                name="isDefault"
                                checked={formData.isDefault}
                                onChange={handleChange}
                                disabled={externalIsSubmitting}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <button type="submit" className="submit-btn" disabled={externalIsSubmitting}>
                        {externalIsSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddressModal;