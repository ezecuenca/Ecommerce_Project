import React, { useState, useEffect, useCallback, useContext } from "react";
import axios from 'axios';
import { AuthContext } from "../../AuthContext";

const API_BASE_URL = 'http://localhost:8000/api';

const PersonalInfo = () => {
    const { user, token, loading: authLoading } = useContext(AuthContext);

    const initialInfoState = {
        first_name: "", middle_name: "", suffix: "", last_name: "",
        date_of_birth: "", gender: "male", contact_no: "",
        email: "", postal_code: "", city: "", street_address: "", region: "",
    };

    const [personalInfo, setPersonalInfo] = useState(initialInfoState);
    const [initialData, setInitialData] = useState(initialInfoState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const fetchProfile = useCallback(async () => {
        if (authLoading || !user || !token) {
            if (!authLoading && !user) {
                setPersonalInfo(initialInfoState);
                setInitialData(initialInfoState);
            }
            return;
        }

        setIsLoading(true);
        setError(null);
        setValidationErrors({});

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            };
            const response = await axios.get(`${API_BASE_URL}/me`, config);

            const fetchedUser = response.data.user;
            const profile = fetchedUser?.profile;

            if (profile) {
                const fetchedData = {
                    first_name: profile.first_name ?? "",
                    middle_name: profile.middle_name ?? "",
                    suffix: profile.suffix ?? "",
                    last_name: profile.last_name ?? "",
                    date_of_birth: profile.date_of_birth ?? "",
                    gender: profile.gender ?? "male", 
                    contact_no: profile.contact_no ?? "",
                    email: user.email ?? "", 
                    postal_code: profile.postal_code ?? "",
                    city: profile.city ?? "",
                    street_address: profile.street_address ?? "",
                    region: profile.region ?? "",
                };
                setPersonalInfo(fetchedData);
                setInitialData(fetchedData);
            } else {
                 const baseData = { ...initialInfoState, email: user.email ?? "" };
                 setPersonalInfo(baseData);
                 setInitialData(baseData);
                 console.warn("User profile data is missing or not loaded from API response.");
            }

        } catch (err) {
            console.error("Failed to fetch profile:", err);
            if (err.response?.status === 401) {
                 setError("Authentication failed or session expired. Please log in again.");
            } else {
                 setError("Failed to load profile information. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [user, token, authLoading]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPersonalInfo((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }));
        }
         if (error) setError(null);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!user || !token) {
            setError("Authentication required to update profile. Please log in.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setValidationErrors({});

        const dataToSend = { ...personalInfo };

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            };
            const response = await axios.put(
                `${API_BASE_URL}/profile`,
                dataToSend,
                config
            );

            alert("Profile updated successfully!");
            const updatedProfileData = response.data.profile ?? dataToSend;
            const finalData = { ...updatedProfileData, email: user.email };

            setPersonalInfo(finalData);
            setInitialData(finalData);

        } catch (err) {
            console.error("Failed to update profile:", err);
            if (err.response) {
                if (err.response.status === 422 && err.response.data.errors) {
                    setValidationErrors(err.response.data.errors);
                    setError("Please check the highlighted fields.");
                } else if (err.response.status === 401) {
                    setError("Authentication failed or session expired. Please log in again.");
                } else {
                    setError(`Failed to update profile: ${err.response.data.message || 'Server error'}`);
                }
            } else {
                setError("Failed to update profile. Network error or server is down.");
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
        if (validationErrors[fieldName]) {
            return <p className="error-text">{validationErrors[fieldName][0]}</p>;
        }
        return null;
    };

    if (authLoading) {
        return <div className="loading">Checking authentication...</div>;
    }

    if (!user) {
        return <div className="error-container" style={{ padding: '20px', textAlign: 'center' }}>Please log in to view or edit your profile.</div>;
    }

    if (isLoading && initialData.email === "") {
        return <div className="loading">Loading profile...</div>;
    }

    if (error && !Object.keys(validationErrors).length > 0 && !isLoading) {
        return <div className="error-container">{error}</div>;
    }

    return (
        <div className="personal-info-container">
            <h1>Personal Info</h1>
            <p>Account Email: {user.email}</p>
            <hr style={{ margin: '15px 0' }}/>

            <form onSubmit={handleUpdateProfile}>
                 {error && <p className="error-text general-error">{error}</p>}

                <div className="info-section">
                    <h2>Profile Details</h2>
                    <div className="info-grid">

                        <div className="info-item">
                            <label htmlFor="first_name">First Name:</label>
                            <input id="first_name" name="first_name" type="text" value={personalInfo.first_name} onChange={handleChange}
                                className={`info-input ${validationErrors.first_name ? 'input-error' : ''}`} placeholder="First name" disabled={isLoading} />
                            {displayError('first_name')}
                        </div>

                        <div className="info-item">
                            <label htmlFor="middle_name">Middle Name:</label>
                            <input id="middle_name" name="middle_name" type="text" value={personalInfo.middle_name} onChange={handleChange}
                                className={`info-input ${validationErrors.middle_name ? 'input-error' : ''}`} placeholder="Middle name" disabled={isLoading} />
                            {displayError('middle_name')}
                        </div>

                        <div className="info-item">
                             <label htmlFor="suffix">Suffix:</label>
                             <input id="suffix" name="suffix" type="text" value={personalInfo.suffix} onChange={handleChange}
                                 className={`info-input ${validationErrors.suffix ? 'input-error' : ''}`} placeholder="Suffix (e.g., Jr., Sr.)" disabled={isLoading} />
                             {displayError('suffix')}
                        </div>

                        <div className="info-item">
                             <label htmlFor="last_name">Last Name:</label>
                             <input id="last_name" name="last_name" type="text" value={personalInfo.last_name} onChange={handleChange}
                                 className={`info-input ${validationErrors.last_name ? 'input-error' : ''}`} placeholder="Last name" disabled={isLoading} />
                             {displayError('last_name')}
                        </div>

                        <div className="info-item">
                             <label htmlFor="date_of_birth">Date of Birth:</label>
                             <input id="date_of_birth" name="date_of_birth" type="date" value={personalInfo.date_of_birth} onChange={handleChange}
                                 className={`info-input ${validationErrors.date_of_birth ? 'input-error' : ''}`} placeholder="YYYY-MM-DD" disabled={isLoading} />
                             {displayError('date_of_birth')}
                         </div>

                        <div className="info-item">
                             <label htmlFor="gender">Gender:</label>
                             <select id="gender" name="gender" value={personalInfo.gender} onChange={handleChange}
                                 className={`info-input ${validationErrors.gender ? 'input-error' : ''}`} disabled={isLoading}>
                                 <option value="male">Male</option>
                                 <option value="female">Female</option>
                                 <option value="other">Other</option>
                             </select>
                             {displayError('gender')}
                         </div>

                        <div className="info-item">
                            <label htmlFor="contact_no">Phone Number:</label>
                            <input id="contact_no" name="contact_no" type="tel" value={personalInfo.contact_no} onChange={handleChange}
                                className={`info-input ${validationErrors.contact_no ? 'input-error' : ''}`} placeholder="Phone number" disabled={isLoading} />
                             {displayError('contact_no')}
                         </div>

                        <div className="info-item">
                             <label htmlFor="postal_code">Postal Code:</label>
                             <input id="postal_code" name="postal_code" type="text" value={personalInfo.postal_code} onChange={handleChange}
                                 className={`info-input ${validationErrors.postal_code ? 'input-error' : ''}`} placeholder="Postal code" disabled={isLoading} />
                             {displayError('postal_code')}
                         </div>

                        <div className="info-item">
                            <label htmlFor="city">City:</label>
                            <input id="city" name="city" type="text" value={personalInfo.city} onChange={handleChange}
                                className={`info-input ${validationErrors.city ? 'input-error' : ''}`} placeholder="City" disabled={isLoading} />
                             {displayError('city')}
                         </div>

                        <div className="info-item">
                             <label htmlFor="street_address">Street Address:</label>
                             <input id="street_address" name="street_address" type="text" value={personalInfo.street_address} onChange={handleChange}
                                 className={`info-input ${validationErrors.street_address ? 'input-error' : ''}`} placeholder="Street address" disabled={isLoading} />
                             {displayError('street_address')}
                         </div>

                         <div className="info-item">
                             <label htmlFor="region">Region:</label>
                             <input id="region" name="region" type="text" value={personalInfo.region} onChange={handleChange}
                                 className={`info-input ${validationErrors.region ? 'input-error' : ''}`} placeholder="Region/Province/State" disabled={isLoading} />
                             {displayError('region')}
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