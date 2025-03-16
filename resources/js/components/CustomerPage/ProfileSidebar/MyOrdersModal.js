import React from "react";


const MyOrdersModal = ({ orderNumber, onConfirm, onClose }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Are you sure you want to cancel your order?</h2>
                <p>Your items will no longer be reserved</p>
                <div className="modal-actions">
                    <button className="confirm-btn" onClick={onConfirm}>
                        Confirm
                    </button>
                    <button className="cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyOrdersModal;