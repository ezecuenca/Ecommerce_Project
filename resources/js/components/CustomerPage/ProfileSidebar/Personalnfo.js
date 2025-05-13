import React, { useState, useEffect, useCallback } from "react";
import AddressModal from "./AddressModal";
import Axios from 'axios';
import { FaSpinner } from "react-icons/fa";

// --- API Base URL ---
const API_BASE_URL = "http://localhost:8000/api"; // Adjust if needed

// --- Authentication Helper ---
const makeAuthenticatedRequest = async (method, url, data = null, config = {}) => {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("Unauthenticated: No token found.");
    const headers = {
        'Authorization': `Bearer ${token}`, 'Accept': 'application/json',
        ...(!(data instanceof FormData) && data ? { 'Content-Type': 'application/json' } : {}),
        ...(config.headers || {}),
    };
    if (data instanceof FormData) delete headers['Content-Type'];
    const fullConfig = { ...config, headers };
    try {
        const response = await Axios({ method: method.toLowerCase(), url, data, ...fullConfig });
        return response;
    } catch (error) {
        console.error(`Axios Error: ${method.toUpperCase()} ${url}`, error.response?.data || error.message, error);
        throw error;
    }
};

// --- Helper to format date for input type="date" ---
const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split('T')[0]; // Extracts YYYY-MM-DD
    } catch (e) {
        return "";
    }
};


const PersonalInfo = () => {
    // --- State ---
    const [accountInfo, setAccountInfo] = useState({
        firstName: "", middleName: "", lastName: "", suffix: "",
        birthday: "", // Stores YYYY-MM-DD for the input
        // Removed age state
        gender: "", phoneNumber: "", email: "",
    });
    const [addresses, setAddresses] = useState([]);
    // const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1); // Removed state for radio selection
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [forceUpdate, setForceUpdate] = useState(0);

    // --- Fetch Data ---
    const fetchProfileData = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            console.log("Fetching user profile data...");
            const response = await makeAuthenticatedRequest('get', `${API_BASE_URL}/user/profile`);
            const userData = response.data;
            console.log("Fetched data:", userData);

            const profileData = userData.profile; // Can be null

            setAccountInfo({
                firstName: profileData?.first_name || "",
                middleName: profileData?.middle_name || "",
                lastName: profileData?.last_name || "",
                suffix: profileData?.suffix || "",
                birthday: formatDateForInput(profileData?.birthday), // Format fetched birthday
                gender: profileData?.gender || "",
                phoneNumber: profileData?.contact_no ? profileData.contact_no.replace(/^\+63/, '') : "",
                email: userData.email || "",
                // age removed
            });

            const fetchedAddresses = profileData?.addresses || [];
            const profileFullName = [
                profileData?.first_name, profileData?.middle_name,
                profileData?.last_name, profileData?.suffix
            ].filter(Boolean).join(" ").trim();

            const formattedAddresses = fetchedAddresses.map(addr => ({
                id: addr.id,
                fullName: profileFullName,
                phoneNumber: addr.contact_no || "",
                streetAddress: addr.street || "",
                district: "", // Keep blank as per original
                city: addr.city || "",
                region: addr.region || "",
                postalCode: addr.postal_code || "",
                country: addr.country || "Philippines",
                isDefault: !!addr.is_default,
            }));
            setAddresses(formattedAddresses);

            // No need to track selected index if radio buttons are removed
            // const defaultIndex = formattedAddresses.findIndex(addr => addr.isDefault);
            // setSelectedAddressIndex(defaultIndex >= 0 ? defaultIndex : (formattedAddresses.length > 0 ? 0 : -1));

        } catch (error) {
             console.error("Error fetching profile data:", error);
             setFetchError(error.message || "Failed to load profile information.");
             setAccountInfo({ firstName: "", middleName: "", lastName: "", suffix: "", birthday: "", gender: "", phoneNumber: "", email: "" });
             setAddresses([]);
            //  setSelectedAddressIndex(-1); // Removed
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData, forceUpdate]);

    // --- Event Handlers ---
     const handleAccountInfoChange = (e) => {
        const { name, value } = e.target;
        if (name === "phoneNumber") {
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length > 10) return;
            setAccountInfo((prev) => ({ ...prev, [name]: digitsOnly }));
        } else {
             setAccountInfo((prev) => ({ ...prev, [name]: value }));
         }
        if (actionError) setActionError(null);
    };

    // --- UPDATE PROFILE ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setActionError(null);
        const payload = {
            first_name: accountInfo.firstName,
            middle_name: accountInfo.middleName || null,
            last_name: accountInfo.lastName,
            suffix: accountInfo.suffix || null,
            gender: accountInfo.gender || null,
            contact_no: accountInfo.phoneNumber ? `+63${accountInfo.phoneNumber}` : null,
            email: accountInfo.email,
            birthday: accountInfo.birthday || null,
        };
        console.log("Attempting to update profile info with payload:", payload);
        try {
            await makeAuthenticatedRequest('put', `${API_BASE_URL}/user/profile`, payload);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            const errorData = error.response?.data;
            if (errorData?.errors) {
                 const messages = Object.values(errorData.errors).flat().join('\n');
                 setActionError(`Validation Failed:\n${messages}`);
            } else {
                 setActionError(errorData?.message || error.message || "Failed to update profile.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Other Handlers ---
    const handleClear = () => {
        setAccountInfo({ firstName: "", middleName: "", lastName: "", suffix: "", birthday: "", gender: "", phoneNumber: "", email: "" });
        setActionError(null);
    };
    const handleAddAddress = () => {
        setActionError(null);
        setIsEditMode(false);
        setEditIndex(null);
        setIsModalOpen(true);
    };
    const handleEditAddress = (index) => {
         setActionError(null);
        setIsEditMode(true);
        setEditIndex(index);
        setIsModalOpen(true);
    };
    const handleSaveAddress = async (addressDataFromModal) => {
        setIsSubmitting(true);
        setActionError(null);
        const payload = {
             street: addressDataFromModal.streetAddress,
             country: addressDataFromModal.country,
             postal_code: addressDataFromModal.postalCode,
             city: addressDataFromModal.city,
             region: addressDataFromModal.region,
             contact_no: addressDataFromModal.phoneNumber,
             is_default: !!addressDataFromModal.isDefault
        };
        console.log("Payload for save address:", payload);
        try {
            let url;
            let method;
            if (isEditMode && editIndex !== null && addresses[editIndex]?.id) {
                const addressId = addresses[editIndex].id;
                url = `${API_BASE_URL}/user/addresses/${addressId}`;
                method = 'put';
                await makeAuthenticatedRequest(method, url, payload);
                alert("Address updated successfully!");
            } else {
                url = `${API_BASE_URL}/user/addresses`;
                method = 'post';
                await makeAuthenticatedRequest(method, url, payload);
                alert("Address added successfully!");
            }
            setIsModalOpen(false);
            setForceUpdate(f => f + 1);
        } catch (error) {
             console.error(`Error ${isEditMode ? 'updating' : 'adding'} address:`, error);
             setActionError(error.response?.data?.message || error.message || `Failed to ${isEditMode ? 'update' : 'add'} address.`);
        } finally {
             setIsSubmitting(false);
        }
    };
    const handleRemoveAddress = async (index) => {
        if (index < 0 || index >= addresses.length) return;
        const addressToRemove = addresses[index];
        if (!addressToRemove?.id) return;
        setIsSubmitting(true);
        setActionError(null);
        try {
            await makeAuthenticatedRequest('delete', `${API_BASE_URL}/user/addresses/${addressToRemove.id}`);
            alert("Address removed successfully!");
            setForceUpdate(f => f + 1);
        } catch (error) {
             console.error("Error removing address:", error);
             setActionError(error.response?.data?.message || error.message || "Failed to remove address.");
             alert(`Error removing address: ${actionError || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleSetDefault = async (index) => {
        if (index < 0 || index >= addresses.length || addresses[index].isDefault) return;
        const addressToSetDefault = addresses[index];
        if (!addressToSetDefault?.id) return;
        setIsSubmitting(true);
        setActionError(null);
        try {
             await makeAuthenticatedRequest('put', `${API_BASE_URL}/user/addresses/${addressToSetDefault.id}/set-default`);
             alert("Default address updated!");
             setForceUpdate(f => f + 1);
        } catch (error) {
             console.error("Error setting default address:", error);
             setActionError(error.response?.data?.message || error.message || "Failed to set default address.");
             alert(`Error setting default address: ${actionError || 'Unknown error'}`);
        } finally {
             setIsSubmitting(false);
        }
    };
    // Removed handleSelectAddress as it's no longer needed
    // const handleSelectAddress = (index) => {
    //     setSelectedAddressIndex(index);
    // };

    // --- Render ---
    if (isLoading) {
        return <div className="personal-info-content"><FaSpinner className="spinner" /> Loading Profile...</div>;
    }
    if (fetchError) {
        return <div className="personal-info-content error-message" style={{ color: 'red' }}>Error: {fetchError}</div>;
    }

    return (
        <div className="personal-info-content">
            <h1>Personal info</h1>
            {/* ACCOUNT INFO SECTION */}
            <div className="account-info-header">
                <h2>Account info</h2>
                <div className="form-actions">
                    <button type="submit" form="info-form" className="update-btn" disabled={isSubmitting}>
                        {isSubmitting ? <FaSpinner className="spinner-btn"/> : 'Update profile'}
                    </button>
                    <button type="button" onClick={handleClear} className="clear-btn" disabled={isSubmitting}>
                        Clear all
                    </button>
                </div>
            </div>
            {actionError && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{actionError}</p>}
            <form id="info-form" onSubmit={handleSubmit} className="info-form">
                {/* Names */}
                 <div className="form-row">
                    <div className="form-group">
                        <label>First name</label>
                        <input type="text" name="firstName" value={accountInfo.firstName} onChange={handleAccountInfoChange} disabled={isSubmitting}/>
                    </div>
                    <div className="form-group">
                        <label>Middle name</label>
                        <input type="text" name="middleName" value={accountInfo.middleName} onChange={handleAccountInfoChange} disabled={isSubmitting}/>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Last name</label>
                        <input type="text" name="lastName" value={accountInfo.lastName} onChange={handleAccountInfoChange} disabled={isSubmitting}/>
                    </div>
                    <div className="form-group">
                        <label>Suffix</label>
                        <input type="text" name="suffix" value={accountInfo.suffix} onChange={handleAccountInfoChange} disabled={isSubmitting}/>
                    </div>
                </div>

                 {/* Birthday and Gender */}
                 <div className="form-row">
                    <div className="form-group">
                        <label>Birthday</label>
                        <input
                            type="date"
                            name="birthday"
                            value={accountInfo.birthday} // Bound to state (expects YYYY-MM-DD)
                            onChange={handleAccountInfoChange}
                            disabled={isSubmitting}
                        />
                    </div>
                     <div className="form-group">
                         <label>Gender</label>
                         <select
                             name="gender"
                             value={accountInfo.gender}
                             onChange={handleAccountInfoChange}
                             disabled={isSubmitting}
                         >
                             <option value="" disabled>Select Gender...</option>
                             <option value="Male">Male</option>
                             <option value="Female">Female</option>
                             <option value="Others">Others</option>
                             {accountInfo.gender && !['Male', 'Female', 'Others', ''].includes(accountInfo.gender) && (
                                 <option value={accountInfo.gender}>{accountInfo.gender}</option>
                             )}
                         </select>
                     </div>
                </div>
                 {/* Contact Info */}
                <div className="form-row">
                     <div className="form-group">
                         <label>Phone number</label>
                         <div className="phone-input-wrapper">
                             <span className="phone-prefix">(+63)</span>
                             <input
                                 type="text"
                                 name="phoneNumber"
                                 value={accountInfo.phoneNumber}
                                 onChange={handleAccountInfoChange}
                                 disabled={isSubmitting}
                                 placeholder="9371083345"
                                 maxLength="10" // Kept maxLength
                             />
                         </div>
                     </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={accountInfo.email} onChange={handleAccountInfoChange} disabled={isSubmitting}/>
                    </div>
                </div>
            </form>

            {/* ADDRESS SECTION */}
            <div className="address-section-wrapper">
                <h3>Address</h3>
                <div className="address-section">
                    {addresses.map((address, index) => (
                        <React.Fragment key={address.id || index}>
                            {index > 0 && <hr className="address-divider" />}
                            <div className="address-card">
                                {/* Add padding or margin if needed after removing radio */}
                                <div className="address-details" style={{ paddingLeft: '10px' }}> {/* Example padding */}
                                    <div className="address-header">
                                        <span className="address-phone">
                                            {address.fullName} | {address.phoneNumber}
                                            {/* Optionally indicate default address more clearly */}
                                            {address.isDefault && <span style={{ fontWeight: 'bold', marginLeft: '10px' }}>(Default)</span>}
                                        </span>
                                    </div>
                                    <div className="address-text">
                                        {[ address.streetAddress, address.district, address.city, address.region, address.country, address.postalCode ]
                                            .filter(Boolean).join(", ")}
                                    </div>
                                </div>
                                <div className="address-actions">
                                    <span className="edit-link" onClick={() => !isSubmitting && handleEditAddress(index)} >
                                        Edit
                                    </span>
                                    <label className="switch" title="Set as default address">
                                        <input
                                            type="checkbox"
                                            checked={address.isDefault}
                                            onChange={() => !isSubmitting && handleSetDefault(index)}
                                            disabled={isSubmitting || address.isDefault}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                    <button
                                        className="remove-btn"
                                        onClick={() => !isSubmitting && handleRemoveAddress(index)}
                                        disabled={isSubmitting || (address.isDefault && addresses.length <= 1)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </React.Fragment>
                    ))}
                     {addresses.length === 0 && !isLoading && (
                         <p style={{ padding: '20px', textAlign: 'center', color: 'grey' }}>No addresses found.</p>
                     )}
                    <div className="add-address">
                        <span onClick={!isSubmitting ? handleAddAddress : undefined} className={`add-address-link ${isSubmitting ? 'disabled' : ''}`}>
                            <span className="plus-icon">+</span> Add a new address
                        </span>
                    </div>
                </div>
            </div>

            {/* Address Modal */}
            <AddressModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAddress}
                address={isEditMode && editIndex !== null ? addresses[editIndex] : null}
                isEditMode={isEditMode}
                externalError={actionError}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default PersonalInfo;