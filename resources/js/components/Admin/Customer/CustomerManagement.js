import React, { useState, useEffect } from "react";

const CustomerManagement = ({ type, customer, selectedCustomers, name, email, address, onClose, onConfirm, onSave, externalError }) => {
    const [localName, setLocalName] = useState(name || "");
    const [localEmail, setLocalEmail] = useState(email || "");
    const [localAddress, setLocalAddress] = useState(address || "");
    const [internalError, setInternalError] = useState("");

    useEffect(() => {
        console.log("CustomerManagement rendered with type:", type, "customer:", customer, "selectedCustomers:", selectedCustomers);
        setInternalError("");
        if (type === "edit" && customer) {
            setLocalName(customer.name || "");
            setLocalEmail(customer.email || "");
            setLocalAddress(customer.address || "");
        } else if (type === "add") {
            setLocalName("");
            setLocalEmail("");
            setLocalAddress("");
        }
    }, [type, customer, selectedCustomers]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleNameChange = (e) => setLocalName(e.target.value);
    const handleEmailChange = (e) => setLocalEmail(e.target.value);
    const handleAddressChange = (e) => setLocalAddress(e.target.value);

    const handleSave = () => {
        if (type === "edit") {
            if (!customer) { alert("No customer selected for editing."); return; }
            if (!localName.trim()) { setInternalError("Customer name is required."); return; }
            if (!validateEmail(localEmail)) { setInternalError("Please enter a valid email address."); return; }
            if (!localAddress.trim()) { setInternalError("Address is required."); return; }

            setInternalError("");
            const updatedCustomer = {
                ...customer,
                name: localName.trim(),
                email: localEmail,
                address: localAddress.trim(),
            };
            console.log("Calling onSave with updated customer:", updatedCustomer);
            onSave(updatedCustomer);
            onClose();

        } else if (type === "add") {
            if (!localName.trim()) { setInternalError("Customer name is required."); return; }
            if (!validateEmail(localEmail)) { setInternalError("Please enter a valid email address."); return; }
            if (!localAddress.trim()) { setInternalError("Address is required."); return; }

            setInternalError("");
            const newCustomer = {
                name: localName.trim(),
                email: localEmail,
                address: localAddress.trim(),
                isArchived: false,
            };
            console.log("Calling onSave with new customer:", newCustomer);
            onSave(newCustomer);
            onClose();
        }
    };

    const handleConfirm = () => {
        if (!Array.isArray(selectedCustomers) || selectedCustomers.length === 0) {
            alert(`Please select at least one customer to ${type}.`);
            return;
        }
        console.log(`Confirming ${type} for customers:`, selectedCustomers);
        onConfirm(selectedCustomers);
    };

    const handleCancel = () => {
        console.log("Closing modal via Cancel/Overlay click for type:", type);
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Customer: ${customer?.name || "N/A"}` : "Add New Customer";
        return (
            <div className="modal-overlay" onClick={handleCancel}>
                <div className="edit-modal modal-content" onClick={e => e.stopPropagation()}>
                    <h3 className="modal-header">{title}</h3>
                    {internalError && <p className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{internalError}</p>}
                    <div className="edit-form">
                        <label className="edit-form-label">Customer Name:</label>
                        <input
                            type="text"
                            value={localName}
                            onChange={handleNameChange}
                            className="customer-input"
                            placeholder="Enter customer name"
                        />
                        <label className="edit-form-label">Email:</label>
                        <input
                            type="email"
                            value={localEmail}
                            onChange={handleEmailChange}
                            className="customer-input"
                            placeholder="Enter email"
                        />
                        <label className="edit-form-label">Address:</label>
                        <input
                            type="text"
                            value={localAddress}
                            onChange={handleAddressChange}
                            className="customer-input"
                            placeholder="Enter address"
                        />
                        <div className="button-group modal-footer">
                            <button className="save-button" onClick={handleSave}>Save</button>
                            <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    else if (type === "archive" || type === "restore") {
        const actionVerb = type === "archive" ? "Archive" : "Restore";
        const title = `Confirm ${actionVerb}`;
        const count = Array.isArray(selectedCustomers) ? selectedCustomers.length : 0;
        const customerNoun = count === 1 ? "customer" : "customers";
        const message = `Are you sure you want to ${type} ${count} ${customerNoun}?`;

        return (
            <div className={`${type}-modal-overlay modal-overlay`} onClick={handleCancel} data-testid={`${type}-overlay`}>
                <div className={`${type}-modal modal-content`} onClick={e => e.stopPropagation()} data-testid={`${type}-modal`}>
                    <h3 className="modal-header">{title}</h3>
                    <p style={{ margin: '20px 0' }}>{message}</p>
                    {externalError && <p className="error-message" style={{ color: 'red', marginBottom: '10px' }}>Error: {externalError}</p>}
                    <div className="button-group modal-footer">
                        <button className="confirm-button" onClick={handleConfirm} disabled={count === 0}>
                            {actionVerb}
                        </button>
                        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default CustomerManagement;