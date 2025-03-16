import React from "react";

const LoginSecurityModal = ({ type, onClose }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(`${type} action submitted`);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {type === "update" ? (
                    <>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Old Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="save-btn">Save</button>
                                <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <p className="delete-message">Are you sure you want to delete your account?</p>
                        <p>Deleting your account is permanent.</p>
                        <div className="modal-actions">
                            <button className="confirm-btn" onClick={handleSubmit}>Confirm</button>
                            <button className="cancel-btn" onClick={onClose}>Cancel</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginSecurityModal;