import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import CustomerManagement from "./CustomerManagement";

const CustomerList = () => {
    const [activeCheckedRows, setActiveCheckedRows] = useState({});
    const [activeIsSelectAll, setActiveIsSelectAll] = useState(false);
    const [archivedCheckedRows, setArchivedCheckedRows] = useState({});
    const [archivedIsSelectAll, setArchivedIsSelectAll] = useState(false);
    const [viewType, setViewType] = useState("active");
    const [managementModalOpen, setManagementModalOpen] = useState(false);
    const [managementType, setManagementType] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [error, setError] = useState("");
    const [forceUpdate, setForceUpdate] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 5;

    const [initialCustomers, setInitialCustomers] = useState([
        { id: 1, name: "Customer Name 1", email: "user1@gmail.com", address: "user address 1", isArchived: false, createdAt: "11/21/24" },
        { id: 2, name: "Customer Name 2", email: "user2@gmail.com", address: "user address 2", isArchived: false, createdAt: "11/21/24" },
        { id: 3, name: "Customer Name 3", email: "user3@gmail.com", address: "user address 3", isArchived: false, createdAt: "11/21/24" },
        { id: 4, name: "Customer Name 4", email: "user4@gmail.com", address: "user address 4", isArchived: false, createdAt: "11/21/24" },
        { id: 5, name: "Customer Name 5", email: "user5@gmail.com", address: "user address 5", isArchived: false, createdAt: "11/21/24" },
    ]);

    const [customers, setCustomers] = useState(initialCustomers);
    const navigate = useNavigate();
    const tableRef = useRef(null);

    useEffect(() => {
        const savedCustomers = localStorage.getItem("customers");
        let updatedCustomers = [...initialCustomers];
        if (savedCustomers) {
            try {
                updatedCustomers = JSON.parse(savedCustomers).map(customer => ({
                    ...customer,
                    isArchived: customer.isArchived !== undefined ? customer.isArchived : false,
                    createdAt: customer.createdAt || new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                }));
                console.log("Loaded customers from localStorage:", updatedCustomers);
            } catch (error) {
                console.error("Error parsing customers from localStorage:", error);
                updatedCustomers = [...initialCustomers];
                localStorage.setItem("customers", JSON.stringify(updatedCustomers));
            }
        } else {
            console.log("Initialized with static customers:", initialCustomers);
            localStorage.setItem("customers", JSON.stringify(initialCustomers));
        }
        setCustomers(updatedCustomers);
        setInitialCustomers(updatedCustomers);
        setActiveCheckedRows({});
        setActiveIsSelectAll(false);
        setArchivedCheckedRows({});
        setArchivedIsSelectAll(false);
    }, []);

    const getCurrentData = () => {
        if (!customers || customers.length === 0) {
            console.warn("No customers data available, returning empty array.");
            return [];
        }
        let filteredCustomers = customers.filter(customer => customer.isArchived === (viewType === "archived"));
        if (searchQuery.trim()) {
            filteredCustomers = filteredCustomers.filter(customer =>
                customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filteredCustomers;
    };

    const currentData = getCurrentData();
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const currentItems = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        if (viewType === "active") {
            setActiveIsSelectAll(isChecked);
            const newCheckedRows = {};
            if (isChecked) {
                currentItems.forEach((_, index) => {
                    newCheckedRows[index] = true;
                });
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.customer-checkbox').forEach(checkbox => checkbox.checked = true);
                }
            } else {
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.customer-checkbox').forEach(checkbox => checkbox.checked = false);
                }
            }
            setActiveCheckedRows(newCheckedRows);
        } else if (viewType === "archived") {
            setArchivedIsSelectAll(isChecked);
            const newCheckedRows = {};
            if (isChecked) {
                currentItems.forEach((_, index) => {
                    newCheckedRows[index] = true;
                });
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.customer-checkbox').forEach(checkbox => checkbox.checked = true);
                }
            } else {
                if (tableRef.current) {
                    tableRef.current.querySelectorAll('.customer-checkbox').forEach(checkbox => checkbox.checked = false);
                }
            }
            setArchivedCheckedRows(newCheckedRows);
        }
    };

    const handleRowCheckbox = (index, e) => {
        const isChecked = e.target.checked;
        if (viewType === "active") {
            setActiveCheckedRows((prev) => ({
                ...prev,
                [index]: isChecked,
            }));
            const allChecked = currentItems.length ===
                (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.customer-checkbox')).filter(cb => cb.checked).length : 0);
            setActiveIsSelectAll(allChecked);
        } else if (viewType === "archived") {
            setArchivedCheckedRows((prev) => ({
                ...prev,
                [index]: isChecked,
            }));
            const allChecked = currentItems.length ===
                (tableRef.current ? Array.from(tableRef.current.querySelectorAll('.customer-checkbox')).filter(cb => cb.checked).length : 0);
            setArchivedIsSelectAll(allChecked);
        }
    };

    const handleDelete = (customerToDelete = null) => {
        const selectedIndices = viewType === "active" ? Object.keys(activeCheckedRows)
            .filter(index => activeCheckedRows[index])
            .map(index => parseInt(index, 10)) : [];

        if (customerToDelete) {
            if (viewType !== "active") {
                alert("You can only delete from Active Customers.");
                return;
            }
            setManagementType("delete");
            setSelectedCustomer([customerToDelete]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 2) {
            return;
        }

        if (viewType !== "active") {
            alert("You can only delete from Active Customers.");
            return;
        }

        setManagementType("delete");
        setSelectedCustomer(getSelectedCustomers());
        setManagementModalOpen(true);
    };

    const handleRestore = (customerToRestore = null) => {
        const selectedIndices = viewType === "archived" ? Object.keys(archivedCheckedRows)
            .filter(index => archivedCheckedRows[index])
            .map(index => parseInt(index, 10)) : [];

        if (customerToRestore) {
            if (viewType !== "archived") {
                alert("You can only restore from Archived Customers.");
                return;
            }
            setManagementType("restore");
            setSelectedCustomer([customerToRestore]);
            setManagementModalOpen(true);
            return;
        }

        const selectedCount = selectedIndices.length;
        if (selectedCount < 2) {
            return;
        }

        if (viewType !== "archived") {
            alert("You can only restore from Archived Customers.");
            return;
        }

        setManagementType("restore");
        setSelectedCustomer(getSelectedCustomers());
        setManagementModalOpen(true);
    };

    const handleAdd = () => {
        if (viewType !== "active") {
            alert("You can only add customers to Active Customers.");
            return;
        }
        setManagementType("add");
        setName("");
        setEmail("");
        setAddress("");
        setSelectedCustomer(null);
        setManagementModalOpen(true);
    };

    const handleEdit = (customer) => {
        setSelectedCustomer(customer);
        setName(customer.name || "");
        setEmail(customer.email || "");
        setAddress(customer.address || "");
        setManagementType("edit");
        setManagementModalOpen(true);
        console.log("Opening edit for customer:", customer);
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleNameChange = (e) => setName(e.target.value);
    const handleEmailChange = (e) => setEmail(e.target.value);
    const handleAddressChange = (e) => setAddress(e.target.value);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleSaveEditOrAdd = (newOrUpdatedCustomer) => {
        if (managementType === "edit") {
            if (!selectedCustomer) {
                alert("No customer selected for editing.");
                return;
            }

            if (!newOrUpdatedCustomer.name.trim()) {
                setError("Customer name is required.");
                return;
            }

            if (!validateEmail(newOrUpdatedCustomer.email)) {
                setError("Please enter a valid email address.");
                return;
            }

            if (!newOrUpdatedCustomer.address.trim()) {
                setError("Address is required.");
                return;
            }

            setError("");
            const updatedCustomers = customers.map(c =>
                c.id === selectedCustomer.id ? { ...newOrUpdatedCustomer, id: selectedCustomer.id, isArchived: selectedCustomer.isArchived, createdAt: selectedCustomer.createdAt } : c
            );
            setCustomers(updatedCustomers);
            setInitialCustomers(updatedCustomers);
            localStorage.setItem("customers", JSON.stringify(updatedCustomers));
            setManagementModalOpen(false);
            setSelectedCustomer(null);
            setName("");
            setEmail("");
            setAddress("");
            console.log("Edited customer, updated customers:", updatedCustomers);
            setForceUpdate(prev => prev + 1);
        } else if (managementType === "add") {
            if (!newOrUpdatedCustomer.name.trim()) {
                setError("Customer name is required.");
                return;
            }

            if (!validateEmail(newOrUpdatedCustomer.email)) {
                setError("Please enter a valid email address.");
                return;
            }

            if (!newOrUpdatedCustomer.address.trim()) {
                setError("Address is required.");
                return;
            }

            setError("");
            const newCustomer = {
                id: Date.now(),
                name: newOrUpdatedCustomer.name.trim(),
                email: newOrUpdatedCustomer.email,
                address: newOrUpdatedCustomer.address.trim(),
                isArchived: false,
                createdAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
                updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }),
            };
            const updatedCustomers = [newCustomer, ...customers];
            setCustomers(updatedCustomers);
            setInitialCustomers(updatedCustomers);
            localStorage.setItem("customers", JSON.stringify(updatedCustomers));
            setManagementModalOpen(false);
            setName("");
            setEmail("");
            setAddress("");
            console.log("Added new customer, updated customers:", updatedCustomers);
            setForceUpdate(prev => prev + 1);
            setCurrentPage(1);
        }
    };

    const handleConfirmDeleteOrRestore = (items) => {
        if (managementType === "delete") {
            const updatedCustomers = customers.map(customer => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === customer.id)) {
                        return { ...customer, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === customer.id) {
                        return { ...customer, isArchived: true, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return customer;
            });
            setCustomers(updatedCustomers);
            setInitialCustomers(updatedCustomers);
            setActiveCheckedRows({});
            setActiveIsSelectAll(false);
            if (tableRef.current && viewType === "active") {
                tableRef.current.querySelectorAll('.customer-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            setForceUpdate(prev => prev + 1);
            localStorage.setItem("customers", JSON.stringify(updatedCustomers));
        } else if (managementType === "restore") {
            const updatedCustomers = customers.map(customer => {
                if (Array.isArray(items)) {
                    if (items.some(item => item.id === customer.id)) {
                        return { ...customer, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                } else {
                    if (items.id === customer.id) {
                        return { ...customer, isArchived: false, updatedAt: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) };
                    }
                }
                return customer;
            });
            setCustomers(updatedCustomers);
            setInitialCustomers(updatedCustomers);
            setArchivedCheckedRows({});
            setArchivedIsSelectAll(false);
            if (tableRef.current && viewType === "archived") {
                tableRef.current.querySelectorAll('.customer-checkbox').forEach(checkbox => checkbox.checked = false);
            }
            setManagementModalOpen(false);
            if (currentData.length === 0) {
                setCurrentPage(1);
            }
            setForceUpdate(prev => prev + 1);
            localStorage.setItem("customers", JSON.stringify(updatedCustomers));
        }
    };

    const handleCloseManagement = () => {
        setManagementModalOpen(false);
        setManagementType("");
        setSelectedCustomer(null);
        setName("");
        setEmail("");
        setAddress("");
        setError("");
    };

    const getSelectedCustomers = () => {
        const selectedIndices = viewType === "active" ? Object.keys(activeCheckedRows)
            .filter(index => activeCheckedRows[index])
            .map(index => parseInt(index, 10)) : Object.keys(archivedCheckedRows)
            .filter(index => archivedCheckedRows[index])
            .map(index => parseInt(index, 10));
        return selectedIndices.map(index => currentItems[index]);
    };

    const isSelectAll = viewType === "active" ? activeIsSelectAll : archivedIsSelectAll;
    const checkedCount = viewType === "active" ? Object.keys(activeCheckedRows).filter(index => activeCheckedRows[index]).length : Object.keys(archivedCheckedRows).filter(index => archivedCheckedRows[index]).length;

    return (
        <div className="customers-container">
            <h2 className="customers-header">{viewType === "active" ? "Customers" : "Archived Customers"}</h2>
            <div className="table-container">
                <div className="table-header-actions">
                    <div className="search-bar">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search"
                            className="search-input"
                        />
                    </div>
                    <div className="button-group" style={{ marginLeft: 'auto' }}>
                        {viewType === "active" && (
                            <>
                                <button className="add-button" onClick={handleAdd}>Add</button>
                                <button
                                    className="delete-button"
                                    onClick={() => handleDelete()}
                                    disabled={checkedCount < 2}
                                >
                                    Delete
                                </button>
                            </>
                        )}
                        {viewType === "archived" && (
                            <button
                                className="restore-button"
                                onClick={() => handleRestore()}
                                disabled={checkedCount < 2}
                            >
                                Restore
                            </button>
                        )}
                    </div>
                    <div className="view-toggle">
                        <button
                            className={`view-button ${viewType === "active" ? "active" : ""}`}
                            onClick={() => setViewType("active")}
                        >
                            Active Customers
                        </button>
                        <button
                            className={`view-button ${viewType === "archived" ? "active" : ""}`}
                            onClick={() => setViewType("archived")}
                        >
                            Archived Customers
                        </button>
                    </div>
                </div>
                <table ref={tableRef} className={`customers-table ${viewType === "archived" ? 'view-type="archived"' : 'view-type="active"'}`}>
                    <thead>
                        <tr className="table-header-row">
                            <th className="table-header">
                                <input type="checkbox" className="customer-checkbox" checked={isSelectAll} onChange={handleSelectAll} />
                            </th>
                            <th className="table-header customers-action-column">Action</th>
                            <th className="table-header">Customer Name</th>
                            <th className="table-header">Email</th>
                            <th className="table-header">Address</th>
                            <th className="table-header">Status</th>
                            <th className="table-header">Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((customer, index) => (
                                <tr className={`table-row ${viewType === "archived" ? 'view-type="archived"' : ''}`} key={customer.id + index + forceUpdate}>
                                    <td className="table-cell">
                                        <input type="checkbox" className="customer-checkbox" onChange={(e) => handleRowCheckbox((currentPage - 1) * itemsPerPage + index, e)} />
                                    </td>
                                    <td className="table-cell customers-action-column">
                                        <div className="action-buttons">
                                            {viewType === "active" ? (
                                                <>
                                                    <FaEdit className="edit-icon" size={20} onClick={() => handleEdit(customer)} />
                                                    <FaTrash className="delete-icon" size={20} onClick={() => handleDelete(customer)} />
                                                </>
                                            ) : (
                                                <FaUndo className="restore-icon" size={20} onClick={() => handleRestore(customer)} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="table-cell">{customer.name}</td>
                                    <td className="table-cell" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{customer.email}</td>
                                    <td className="table-cell" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>{customer.address}</td>
                                    <td className={`table-cell status-${customer.isArchived ? "inactive" : "active"}`}>
                                        {customer.isArchived ? "Inactive" : "Active"}
                                    </td>
                                    <td className="table-cell">{customer.createdAt}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="table-row">
                                <td colSpan="7" className="table-cell" style={{ textAlign: "center", padding: "20px", backgroundColor: "#f9f9f9" }}>
                                    {customers.length === 0
                                        ? "No customers available. Please check your data or refresh the page."
                                        : viewType === "active"
                                        ? "No active customers match your search."
                                        : "No archived customers match your search."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="table-pagination">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="table-pagination-button"
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "table-pagination-button active" : "table-pagination-button"}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="table-pagination-button"
                    >
                        Next
                    </button>
                </div>
            </div>
            {managementModalOpen && (
                <CustomerManagement
                    type={managementType}
                    customer={managementType === "edit" || managementType === "add" ? selectedCustomer : (managementType === "restore" && !Array.isArray(selectedCustomer) ? selectedCustomer : null)}
                    selectedCustomers={managementType === "delete" || (managementType === "restore" && Array.isArray(selectedCustomer)) ? (selectedCustomer || getSelectedCustomers()) : []}
                    name={name}
                    email={email}
                    address={address}
                    onClose={handleCloseManagement}
                    onConfirm={handleConfirmDeleteOrRestore}
                    onSave={handleSaveEditOrAdd}
                />
            )}
        </div>
    );
};

export default CustomerList;