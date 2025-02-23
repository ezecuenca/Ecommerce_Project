// src/components/admin/ProductList.js
import React, { useState } from "react";
import { FaEdit, FaImage } from "react-icons/fa"; // Kept FaEdit and FaImage for consistency

const ProductList = () => {
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [checkedRows, setCheckedRows] = useState({});

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setIsSelectAll(isChecked);
        const newCheckedRows = {};
        if (isChecked) {
            // Check all rows
            document.querySelectorAll('.checkbox').forEach((checkbox, index) => {
                newCheckedRows[index] = true;
                checkbox.checked = true;
            });
        } else {
            // Uncheck all rows
            document.querySelectorAll('.checkbox').forEach((checkbox) => {
                checkbox.checked = false;
            });
        }
        setCheckedRows(newCheckedRows);
    };

    const handleRowCheckbox = (index, e) => {
        const isChecked = e.target.checked;
        setCheckedRows((prev) => ({
            ...prev,
            [index]: isChecked,
        }));
        const allChecked = document.querySelectorAll('.checkbox').length ===
            document.querySelectorAll('.checkbox:checked').length;
        setIsSelectAll(allChecked);
    };

    // Sample data from the screenshot
    const products = [
        { id: 1, name: "Product Name", description: "Product Description", stock: "1x", price: "₱200.12" },
        { id: 2, name: "Product Name", description: "Product Description", stock: "1x", price: "₱143.06" },
        { id: 3, name: "Product Name", description: "Product Description", stock: "2x", price: "₱310.22" },
        { id: 4, name: "Product Name", description: "Product Description", stock: "1x", price: "₱176.54" },
        { id: 5, name: "Product Name", description: "Product Description", stock: "1x", price: "₱200.12" },
        { id: 6, name: "Product Name", description: "Product Description", stock: "1x", price: "₱143.06" },
        { id: 7, name: "Product Name", description: "Product Description", stock: "2x", price: "₱310.22" },
    ];

    return (
        <div className="products-container">
            <h2 className="h2">Products</h2>
            <div className="header-actions">
                <div className="search-bar">
                    <input type="text" placeholder="Search" className="search-input" />
                </div>
                <div className="button-group">
                    <button className="archive-button">Archive</button>
                    <button className="add-button">Add</button>
                    <button className="delete-button">Delete</button>
                </div>
            </div>
            <table className="products-table">
                <thead>
                    <tr className="thead">
                        <th className="th">
                            <input type="checkbox" className="checkbox select-all" checked={isSelectAll} onChange={handleSelectAll} />
                        </th> {/* Checkbox column header with "Select All" only, no Edit icon */}
                        <th className="th">Product Name</th>
                        <th className="th">Description</th>
                        <th className="th">Stocks</th>
                        <th className="th">Price</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, index) => (
                        <tr className="tr" key={product.id}>
                            <td className="td">
                                <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                            </td>
                            <td className="td">
                                <div className="product-name-cell">
                                    <FaImage className="product-icon" size={20} color="#6b7280" />
                                    {product.name}
                                </div>
                            </td>
                            <td className="td">{product.description}</td>
                            <td className="td">{product.stock}</td>
                            <td className="td">{product.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductList;