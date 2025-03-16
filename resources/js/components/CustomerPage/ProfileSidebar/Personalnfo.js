import React, { useState } from "react";

const PersonalInfo = () => {
    const [formData, setFormData] = useState({
        firstName: "First name",
        middleName: "Middle name",
        lastName: "Last name",
        suffix: "Suffix",
        birthday: "MM/DD/YYYY",
        gender: "Gender",
        phoneNumber: "Phone number",
        email: "sunieux@gmail.com",
        postalCode: "Postal code",
        city: "City",
        streetAddress: "123 Ave",
        region: "Region",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Updated form data:", formData);
    };

    const handleClear = () => {
        setFormData({
            firstName: "",
            middleName: "",
            lastName: "",
            suffix: "",
            birthday: "",
            gender: "",
            phoneNumber: "",
            email: "",
            postalCode: "",
            city: "",
            streetAddress: "",
            region: "",
        });
    };

    return (
        <div className="personal-info-content">
            <h1>Personal info</h1>
            <h2>Account info</h2>
            <form onSubmit={handleSubmit} className="info-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>First name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Middle name</label>
                        <input
                            type="text"
                            name="middleName"
                            value={formData.middleName}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Last name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Suffix</label>
                        <input
                            type="text"
                            name="suffix"
                            value={formData.suffix}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Birthday</label>
                        <input
                            type="text"
                            name="birthday"
                            value={formData.birthday}
                            onChange={handleChange}
                            placeholder="MM/DD/YYYY"
                        />
                    </div>
                    <div className="form-group">
                        <label>Gender</label>
                        <input
                            type="text"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Phone number</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Postal code</label>
                        <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Street address</label>
                        <input
                            type="text"
                            name="streetAddress"
                            value={formData.streetAddress}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Region</label>
                        <input
                            type="text"
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-actions">
                    <button type="submit" className="update-btn">
                        Update profile
                    </button>
                    <button type="button" onClick={handleClear} className="clear-btn">
                        Clear all
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PersonalInfo;