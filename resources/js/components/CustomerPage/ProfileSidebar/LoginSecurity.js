import React, { useState } from "react";
import LoginSecurityModal from "./LoginSecurityModal";

const LoginSecurity = () => {
    const [modalType, setModalType] = useState(null);

    const openModal = (type) => {
        setModalType(type);
    };

    const closeModal = () => {
        setModalType(null);
    };

    return (
        <div className="login-security">
            <h1>Login and security</h1>
            <div className="security-section">
                <h2>Login</h2>
                <div className="content-row">
                    <div className="form-group">
                        <label>Password</label>
                        <p>Last updated 1 month ago</p>
                    </div>
                    <div className="button-group">
                        <button className="update-btn" onClick={() => openModal("update")}>Update password</button>
                    </div>
                </div>
            </div>
            <div className="security-section">
                <h2>Account Deletion</h2>
                <div className="content-row">
                    <div className="form-group">
                        <p>Delete your account?</p>
                    </div>
                    <div className="button-group">
                        <button className="delete-btn" onClick={() => openModal("delete")}>Delete</button>
                    </div>
                </div>
            </div>
            {modalType && (
                <LoginSecurityModal
                    type={modalType}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export default LoginSecurity;