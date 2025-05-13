import React, { useState, useEffect, useCallback, useContext } from "react";
import axios from 'axios';
import { AuthContext } from "../../AuthContext"; 

const API_BASE_URL = 'http://localhost:8000/api';

const INITIAL_INFO_STATE = {
    first_name: "", middle_name: "", suffix: "", last_name: "",
    birthday: "", gender: "", 
    contact_no: "", email: "",
    street_address: "", city: "", region: "", postal_code: "",
   
};

const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split('T')[0];
    } catch (e) {
        return "";
    }
};

const PersonalInfo = () => {
    const { user: authContextUser, token, loading: authLoading } = useContext(AuthContext);

    const [personalInfo, setPersonalInfo] = useState(INITIAL_INFO_STATE);
    const [initialData, setInitialData] = useState(INITIAL_INFO_STATE); 
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const fetchProfile = useCallback(async () => {
        if (authLoading || !authContextUser || !token) {
            if (!authLoading && !authContextUser) {
                setPersonalInfo(INITIAL_INFO_STATE);
                setInitialData(INITIAL_INFO_STATE);
                setIsLoading(false);
            }
            return;
        }

        setIsLoading(true);
        setError(null);
        setValidationErrors({});

        try {
            const config = {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            };
            const response = await axios.get(`${API_BASE_URL}/user/profile`, config);

            const apiUser = response.data;
            const profile = apiUser?.profile;
            const userApiEmail = apiUser?.email;

            if (profile) {
                let defaultAddress = null;
                if (profile.addresses && profile.addresses.length > 0) {
                    defaultAddress = profile.addresses.find(addr => addr.is_default === 1 || addr.is_default === true);
                    if (!defaultAddress && profile.addresses.length > 0) {
                        defaultAddress = profile.addresses[0];
                    }
                }

                const fetchedData = {
                    first_name: profile.first_name ?? "",
                    middle_name: profile.middle_name ?? "",
                    suffix: profile.suffix ?? "",
                    last_name: profile.last_name ?? "",
                    birthday: formatDateForInput(profile.birthday),
                    gender: profile.gender ?? "",
                    contact_no: defaultAddress?.contact_no ?? profile.contact_no ?? "",
                    email: userApiEmail ?? authContextUser.email ?? "",
                    street_address: defaultAddress?.street ?? "",
                    city: defaultAddress?.city ?? "",
                    region: defaultAddress?.region ?? "",
                    postal_code: defaultAddress?.postal_code ?? "",
                };
                setPersonalInfo(fetchedData);
                setInitialData(fetchedData);
            } else {
                const baseEmail = userApiEmail ?? authContextUser?.email ?? "";
                setPersonalInfo({ ...INITIAL_INFO_STATE, email: baseEmail });
                setInitialData({ ...INITIAL_INFO_STATE, email: baseEmail });
                console.warn("Admin Page: Profile data not found in API response. User Email:", baseEmail);
            }
        } catch (err) {
            console.error("Admin Page: Failed to fetch profile:", err.response?.data || err.message || err);
            setError("Failed to load profile information.");
            const baseEmailOnError = authContextUser?.email ?? "";
            setPersonalInfo({...INITIAL_INFO_STATE, email: baseEmailOnError});
            setInitialData({...INITIAL_INFO_STATE, email: baseEmailOnError});
        } finally {
            setIsLoading(false);
        }
    }, [authContextUser, token, authLoading]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPersonalInfo(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
        if (error) setError(null);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!authContextUser || !token) {
            setError("Authentication required.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setValidationErrors({});

        const payload = {
            first_name: personalInfo.first_name,
            middle_name: personalInfo.middle_name || null,
            suffix: personalInfo.suffix || null,
            last_name: personalInfo.last_name,
            birthday: personalInfo.birthday || null,
            gender: personalInfo.gender || null,
            contact_no: personalInfo.contact_no || null,
            email: personalInfo.email,
            ...(personalInfo.street_address && {
                street: personalInfo.street_address,
                city: personalInfo.city || null,
                region: personalInfo.region || null,
                postal_code: personalInfo.postal_code || null,
                country: "Philippines",
            })
        };

        try {
            const config = { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }};
            const response = await axios.put(`${API_BASE_URL}/user/profile`, payload, config);

            alert("Profile updated successfully!");

            const updatedApiUser = response.data;
            const updatedProfile = updatedApiUser?.profile;
            const updatedUserEmail = updatedApiUser?.email;
            let updatedDefaultAddress = null;

            if (updatedProfile?.addresses?.length > 0) {
                updatedDefaultAddress = updatedProfile.addresses.find(addr => addr.is_default === 1 || addr.is_default === true);
                if(!updatedDefaultAddress) updatedDefaultAddress = updatedProfile.addresses[0];
            }

            const finalData = {
                ...INITIAL_INFO_STATE,
                first_name: updatedProfile?.first_name ?? "",
                middle_name: updatedProfile?.middle_name ?? "",
                suffix: updatedProfile?.suffix ?? "",
                last_name: updatedProfile?.last_name ?? "",
                birthday: formatDateForInput(updatedProfile?.birthday),
                gender: updatedProfile?.gender ?? "",
                contact_no: updatedDefaultAddress?.contact_no ?? updatedProfile?.contact_no ?? "",
                email: updatedUserEmail ?? authContextUser.email ?? "",
                street_address: updatedDefaultAddress?.street ?? "",
                city: updatedDefaultAddress?.city ?? "",
                region: updatedDefaultAddress?.region ?? "",
                postal_code: updatedDefaultAddress?.postal_code ?? "",
            };
            setPersonalInfo(finalData);
            setInitialData(finalData);

        } catch (err) {
            console.error("Admin Page: Failed to update profile:", err.response?.data || err.message || err);
             if (err.response) {
                 if (err.response.status === 422 && err.response.data.errors) {
                     setValidationErrors(err.response.data.errors);
                     const errorMessages = Object.entries(err.response.data.errors)
                         .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                         .join('; ');
                     setError(`Validation failed: ${errorMessages}`);
                 } else {
                     setError(err.response.data.message || "An unknown error occurred while updating.");
                 }
             } else {
                 setError("Update failed. Network error or no response from server.");
             }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearOrReset = () => {
        setPersonalInfo(initialData);
        setError(null);
        setValidationErrors({});
    };

    const displayError = (fieldName) => {
        const errorKey = fieldName === 'street_address' ? 'street' : fieldName;
        if (validationErrors[errorKey]) {
            return <p className="error-text">{Array.isArray(validationErrors[errorKey]) ? validationErrors[errorKey][0] : validationErrors[errorKey]}</p>;
        }
        return null;
    };

    if (authLoading) return <div className="loading">Checking authentication...</div>;
    if (!authContextUser && !authLoading) return <div className="error-container">Please log in to view or edit profile information.</div>;

    if (isLoading && !personalInfo.email && !initialData.email) {
         return <div className="loading">Loading profile...</div>;
    }

    return (
        <div className="personal-info-container">
            {error && <p className="error-text general-error" style={{color: 'red', border: '1px solid red', padding: '10px', marginBottom: '15px'}}>{error}</p>}
            <form onSubmit={handleUpdateProfile}>
                <div className="info-section">
                    <h2>Profile Details</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <label htmlFor="first_name">First Name:</label>
                            <input id="first_name" name="first_name" type="text" value={personalInfo.first_name} onChange={handleChange} className={`info-input ${validationErrors.first_name ? 'input-error' : ''}`} disabled={isLoading} />
                            {displayError('first_name')}
                        </div>
                        <div className="info-item">
                            <label htmlFor="middle_name">Middle Name:</label>
                            <input id="middle_name" name="middle_name" type="text" value={personalInfo.middle_name} onChange={handleChange} className={`info-input ${validationErrors.middle_name ? 'input-error' : ''}`} disabled={isLoading} />
                            {displayError('middle_name')}
                        </div>
                        <div className="info-item">
                            <label htmlFor="last_name">Last Name:</label>
                            <input id="last_name" name="last_name" type="text" value={personalInfo.last_name} onChange={handleChange} className={`info-input ${validationErrors.last_name ? 'input-error' : ''}`} disabled={isLoading} />
                            {displayError('last_name')}
                        </div>
                        <div className="info-item">
                             <label htmlFor="suffix">Suffix:</label>
                             <input id="suffix" name="suffix" type="text" value={personalInfo.suffix} onChange={handleChange} className={`info-input ${validationErrors.suffix ? 'input-error' : ''}`} disabled={isLoading} />
                             {displayError('suffix')}
                        </div>
                        <div className="info-item">
                             <label htmlFor="birthday">Birthday:</label>
                             <input id="birthday" name="birthday" type="date" value={personalInfo.birthday} onChange={handleChange} className={`info-input ${validationErrors.birthday ? 'input-error' : ''}`} disabled={isLoading} />
                             {displayError('birthday')}
                         </div>
                        <div className="info-item">
                             <label htmlFor="gender">Gender:</label>
                             <select id="gender" name="gender" value={personalInfo.gender} onChange={handleChange} className={`info-input ${validationErrors.gender ? 'input-error' : ''}`} disabled={isLoading}>
                                 <option value="">Select Gender...</option>
                                 <option value="male">Male</option>
                                 <option value="female">Female</option>
                                 <option value="other">Other</option>
                             </select>
                             {displayError('gender')}
                         </div>
                        <div className="info-item">
                            <label htmlFor="contact_no">Phone Number:</label>
                            <input id="contact_no" name="contact_no" type="tel" value={personalInfo.contact_no} onChange={handleChange} className={`info-input ${validationErrors.contact_no ? 'input-error' : ''}`} disabled={isLoading} />
                             {displayError('contact_no')}
                         </div>
                        <div className="info-item">
                            <label htmlFor="email">Email:</label>
                            <input id="email" name="email" type="email" value={personalInfo.email} onChange={handleChange} className={`info-input ${validationErrors.email ? 'input-error' : ''}`} disabled={isLoading} />
                            {displayError('email')}
                        </div>
                    </div>
                </div>

                <div className="info-section">
                    <h2>Address Details</h2>
                    <div className="info-grid">
                        <div className="info-item">
                             <label htmlFor="street_address">Street Address:</label>
                             <input id="street_address" name="street_address" type="text" value={personalInfo.street_address} onChange={handleChange} className={`info-input ${validationErrors.street || validationErrors.street_address ? 'input-error' : ''}`} disabled={isLoading} />
                             {displayError('street_address')}
                         </div>
                        <div className="info-item">
                             <label htmlFor="city">City:</label>
                             <input id="city" name="city" type="text" value={personalInfo.city} onChange={handleChange} className={`info-input ${validationErrors.city ? 'input-error' : ''}`} disabled={isLoading} />
                             {displayError('city')}
                         </div>
                        <div className="info-item">
                             <label htmlFor="region">Region:</label>
                             <input id="region" name="region" type="text" value={personalInfo.region} onChange={handleChange} className={`info-input ${validationErrors.region ? 'input-error' : ''}`} disabled={isLoading} />
                             {displayError('region')}
                         </div>
                        <div className="info-item">
                             <label htmlFor="postal_code">Postal Code:</label>
                             <input id="postal_code" name="postal_code" type="text" value={personalInfo.postal_code} onChange={handleChange} className={`info-input ${validationErrors.postal_code ? 'input-error' : ''}`} disabled={isLoading} />
                             {displayError('postal_code')}
                         </div>
                    </div>
                </div>
                <div className="actions">
                    <button type="submit" className="update-button" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                    <button type="button" className="clear-button" onClick={handleClearOrReset} disabled={isLoading}>
                        Reset Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PersonalInfo;