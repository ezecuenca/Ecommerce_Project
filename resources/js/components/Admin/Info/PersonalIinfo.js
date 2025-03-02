// src/components/admin/PersonalInfo.js
import React, { useState } from "react";

const PersonalInfo = () => {
    // Initial state for personal info form, updated to use Date of Birth
    const [personalInfo, setPersonalInfo] = useState({
        firstName: "Sunieux",
        middleName: "",
        suffix: "",
        lastName: "",
        dateOfBirth: "MM/DD/YYYY", // Changed from age to Date of Birth
        gender: "Male", // Default gender
        phoneNumber: "",
        email: "sunieux@gmail.com",
        postalCode: "",
        city: "",
        streetAddress: "123 Ave",
        region: "",
    });

    // Handle input changes
    const handleChange = (field, value) => {
        setPersonalInfo((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle form submission (Update Profile)
    const handleUpdateProfile = (e) => {
        e.preventDefault();
        alert("Profile updated with: " + JSON.stringify(personalInfo));
        // Here, you could implement an API call to save the data (e.g., using Axios)
    };

    // Clear all fields
    const handleClearAll = () => {
        setPersonalInfo({
            firstName: "",
            middleName: "",
            suffix: "",
            lastName: "",
            dateOfBirth: "MM/DD/YYYY", // Changed from age to Date of Birth
            gender: "Male",
            phoneNumber: "",
            email: "",
            postalCode: "",
            city: "",
            streetAddress: "",
            region: "",
        });
    };

    return (
        <div className="personal-info-container">
            <h1>Personal Info</h1>
            <div className="info-section">
                <h2>Account Info</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <label>First Name:</label>
                        <input
                            type="text"
                            value={personalInfo.firstName}
                            onChange={(e) => handleChange("firstName", e.target.value)}
                            className="info-input"
                            placeholder="First name"
                        />
                    </div>
                    <div className="info-item">
                        <label>Middle Name:</label>
                        <input
                            type="text"
                            value={personalInfo.middleName}
                            onChange={(e) => handleChange("middleName", e.target.value)}
                            className="info-input"
                            placeholder="Middle name"
                        />
                    </div>
                    <div className="info-item">
                        <label>Suffix:</label>
                        <input
                            type="text"
                            value={personalInfo.suffix}
                            onChange={(e) => handleChange("suffix", e.target.value)}
                            className="info-input"
                            placeholder="Suffix"
                        />
                    </div>
                    <div className="info-item">
                        <label>Last Name:</label>
                        <input
                            type="text"
                            value={personalInfo.lastName}
                            onChange={(e) => handleChange("lastName", e.target.value)}
                            className="info-input"
                            placeholder="Last name"
                        />
                    </div>
                    <div className="info-item">
                        <label>Date of Birth:</label> {/* Changed from Age to Date of Birth */}
                        <div className="date-input-wrapper">
                            <input
                                type="text"
                                value={personalInfo.dateOfBirth}
                                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                                className="info-input date-input"
                                placeholder="MM/DD/YYYY"
                            />
                            <span className="calendar-icon">📅</span> {/* Placeholder for calendar icon */}
                        </div>
                    </div>
                    <div className="info-item">
                        <label>Gender:</label>
                        <select
                            value={personalInfo.gender}
                            onChange={(e) => handleChange("gender", e.target.value)}
                            className="info-input"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="info-item">
                        <label>Phone Number:</label>
                        <input
                            type="tel"
                            value={personalInfo.phoneNumber}
                            onChange={(e) => handleChange("phoneNumber", e.target.value)}
                            className="info-input"
                            placeholder="Phone number"
                        />
                    </div>
                    <div className="info-item">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={personalInfo.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            className="info-input"
                            placeholder="Email"
                        />
                    </div>
                    <div className="info-item">
                        <label>Postal Code:</label>
                        <input
                            type="text"
                            value={personalInfo.postalCode}
                            onChange={(e) => handleChange("postalCode", e.target.value)}
                            className="info-input"
                            placeholder="Postal code"
                        />
                    </div>
                    <div className="info-item">
                        <label>City:</label>
                        <input
                            type="text"
                            value={personalInfo.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                            className="info-input"
                            placeholder="City"
                        />
                    </div>
                    <div className="info-item">
                        <label>Street Address:</label>
                        <input
                            type="text"
                            value={personalInfo.streetAddress}
                            onChange={(e) => handleChange("streetAddress", e.target.value)}
                            className="info-input"
                            placeholder="Street address"
                        />
                    </div>
                    <div className="info-item">
                        <label>Region:</label>
                        <input
                            type="text"
                            value={personalInfo.region}
                            onChange={(e) => handleChange("region", e.target.value)}
                            className="info-input"
                            placeholder="Region"
                        />
                    </div>
                </div>
            </div>
            <div className="actions">
                <button className="update-button" onClick={handleUpdateProfile}>
                    Update Profile
                </button>
                <button className="clear-button" onClick={handleClearAll}>
                    Clear All
                </button>
            </div>
        </div>
    );
};

export default PersonalInfo;