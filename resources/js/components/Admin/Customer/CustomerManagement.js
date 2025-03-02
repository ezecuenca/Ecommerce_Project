import React, { useState, useEffect } from "react";

const CustomerManagement = ({ type, customer, selectedCustomers, name, email, address, onClose, onConfirm, onSave }) => {
    const [localName, setLocalName] = useState(name || "");
    const [localEmail, setLocalEmail] = useState(email || "");
    const [localAddress, setLocalAddress] = useState(address || "");
    const [error, setError] = useState("");

    useEffect(() => {
        console.log("CustomerManagement rendered with type:", type, "customer:", customer, "name:", name, "email:", email, "address:", address);
        if (type === "edit" && customer) {
            setLocalName(customer.name || "");
            setLocalEmail(customer.email || "");
            setLocalAddress(customer.address || "");
            console.log("Initializing edit for customer:", customer);
        } else if (type === "add") {
            setLocalName("");
            setLocalEmail("");
            setLocalAddress("");
            console.log("Initializing add for new customer");
        }
    }, [type, customer, name, email, address]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleNameChange = (e) => setLocalName(e.target.value);
    const handleEmailChange = (e) => setLocalEmail(e.target.value);
    const handleAddressChange = (e) => setLocalAddress(e.target.value);

    const handleSave = () => {
        if (type === "edit") {
            if (!customer) {
                alert("No customer selected for editing.");
                return;
            }

            if (!localName.trim()) {
                setError("Customer name is required.");
                return;
            }

            if (!validateEmail(localEmail)) {
                setError("Please enter a valid email address.");
                return;
            }

            if (!localAddress.trim()) {
                setError("Address is required.");
                return;
            }

            setError("");
            const updatedCustomer = {
                ...customer,
                name: localName.trim(),
                email: localEmail,
                address: localAddress.trim(),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            };
            console.log("Saving updated customer:", updatedCustomer);
            onSave(updatedCustomer);
            onClose();
        } else if (type === "add") {
            if (!localName.trim()) {
                setError("Customer name is required.");
                return;
            }

            if (!validateEmail(localEmail)) {
                setError("Please enter a valid email address.");
                return;
            }

            if (!localAddress.trim()) {
                setError("Address is required.");
                return;
            }

            setError("");
            const newCustomer = {
                id: Date.now(),
                name: localName.trim(),
                email: localEmail,
                address: localAddress.trim(),
                isArchived: false,
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            };
            console.log("Saving new customer:", newCustomer);
            onSave(newCustomer);
            onClose();
        }
    };

    const handleConfirm = () => {
        if (type === "delete") {
            if (!selectedCustomers || selectedCustomers.length === 0) {
                alert("Please select at least one customer to delete.");
                return;
            }
            console.log("Confirming delete for customers:", selectedCustomers);
            onConfirm(selectedCustomers);
            onClose();
        } else if (type === "restore") {
            if (!selectedCustomers || selectedCustomers.length === 0) {
                alert("Please select at least one customer to restore.");
                return;
            }
            console.log("Confirming restore for customers:", selectedCustomers);
            onConfirm(selectedCustomers);
            onClose();
        }
    };

    const handleCancel = () => {
        console.log("Closing modal for type:", type);
        onClose();
    };

    if (type === "edit" || type === "add") {
        const title = type === "edit" ? `Edit Customer: ${customer?.name || "Customer"}` : "Add New Customer";
        return (
            <div className="CustomerManagement" onClick={handleCancel}>
                <div className="edit-modal-overlay" onClick={handleCancel}>
                    <div className="edit-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="edit-modal-header">{title}</h3>
                        {error && <p className="error-message">{error}</p>}
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
                            <div className="button-group">
                                <button className="save-button" onClick={handleSave}>Save</button>
                                <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (type === "delete" || type === "restore") {
        const title = type === "delete" ? "Confirm Delete" : "Confirm Restore";
        const message = type === "delete"
            ? `Are you sure you want to delete ${Array.isArray(selectedCustomers) ? selectedCustomers.length : 1} customer(s)?`
            : `Are you sure you want to restore ${selectedCustomers.length} customer(s)?`;

        return (
            <div className={`${type}-modal-overlay`} onClick={handleCancel} data-testid={`${type}-overlay`}>
                <div className={`${type}-modal`} onClick={e => e.stopPropagation()} data-testid={`${type}-modal`}>
                    <h3>{title}</h3>
                    <p>{message}</p>
                    <div className="button-group">
                        <button className="save-button" onClick={handleConfirm}>
                            {type === "delete" ? "Delete" : "Restore"}
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