// src/components/admin/Reviews.js
import React, { useState } from "react";
import { FaRegImage, FaEdit } from "react-icons/fa"; // Kept FaRegImage and FaEdit

const Reviews = () => {
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
        // Check if all individual checkboxes are checked to update "Select All"
        const allChecked = document.querySelectorAll('.checkbox').length === 
            document.querySelectorAll('.checkbox:checked').length;
        setIsSelectAll(allChecked);
    };

    return (
        <div className="reviews-container">
            <h2 className="h2">Customer Reviews</h2>

            <div className="header-actions">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search"
                        className="search-input"
                    />
                </div>
                <div className="button-group">
                    <button className="archive-button">Archive</button>
                    <button className="delete-button">Delete</button>
                </div>
            </div>

            <table className="reviews-table">
                <thead>
                    <tr className="thead">
                        <th className="th">
                            <input type="checkbox" className="checkbox select-all" checked={isSelectAll} onChange={handleSelectAll} />
                        </th> {/* Checkbox column header with "Select All" only, no Edit icon */}
                        <th className="th">Product Name</th>
                        <th className="th">Rating</th>
                        <th className="th">Review</th>
                        <th className="th">Created at</th>
                        <th className="th">Updated at</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="tr">
                        <td className="td">
                            <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(0, e)} />
                            <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                        </td>
                        <td className="td">
                            <div className="product-name-cell">
                                <FaRegImage className="product-icon" size={20} />
                                Product Name
                            </div>
                        </td>
                        <td className="td">5</td>
                        <td className="td">Product Review</td>
                        <td className="td">11/21/24</td>
                        <td className="td">11/21/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td">
                            <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(1, e)} />
                            <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                        </td>
                        <td className="td">
                            <div className="product-name-cell">
                                <FaRegImage className="product-icon" size={20} />
                                Product Name
                            </div>
                        </td>
                        <td className="td">5</td>
                        <td className="td">Product Review</td>
                        <td className="td">11/21/24</td>
                        <td className="td">11/21/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td">
                            <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(2, e)} />
                            <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                        </td>
                        <td className="td">
                            <div className="product-name-cell">
                                <FaRegImage className="product-icon" size={20} />
                                Product Name
                            </div>
                        </td>
                        <td className="td">4.5</td>
                        <td className="td">Product Review</td>
                        <td className="td">11/21/24</td>
                        <td className="td">11/21/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td">
                            <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(3, e)} />
                            <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                        </td>
                        <td className="td">
                            <div className="product-name-cell">
                                <FaRegImage className="product-icon" size={20} />
                                Product Name
                            </div>
                        </td>
                        <td className="td">2</td>
                        <td className="td">Product Review</td>
                        <td className="td">11/21/24</td>
                        <td className="td">11/21/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td">
                            <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(4, e)} />
                            <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                        </td>
                        <td className="td">
                            <div className="product-name-cell">
                                <FaRegImage className="product-icon" size={20} />
                                Product Name
                            </div>
                        </td>
                        <td className="td">1</td>
                        <td className="td">Product Review</td>
                        <td className="td">11/21/24</td>
                        <td className="td">11/21/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td">
                            <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(5, e)} />
                            <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                        </td>
                        <td className="td">
                            <div className="product-name-cell">
                                <FaRegImage className="product-icon" size={20} />
                                Product Name
                            </div>
                        </td>
                        <td className="td">3</td>
                        <td className="td">Product Review</td>
                        <td className="td">11/21/24</td>
                        <td className="td">11/21/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td">
                            <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(6, e)} />
                            <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                        </td>
                        <td className="td">
                            <div className="product-name-cell">
                                <FaRegImage className="product-icon" size={20} />
                                Product Name
                            </div>
                        </td>
                        <td className="td">4</td>
                        <td className="td">Product Review</td>
                        <td className="td">11/21/24</td>
                        <td className="td">11/21/24</td>
                    </tr>
                    <tr className="tr">
                        <td className="td">
                            <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(7, e)} />
                            <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                        </td>
                        <td className="td">
                            <div className="product-name-cell">
                                <FaRegImage className="product-icon" size={20} />
                                Product Name
                            </div>
                        </td>
                        <td className="td">0</td>
                        <td className="td">Product Review</td>
                        <td className="td">11/21/24</td>
                        <td className="td">11/21/24</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default Reviews;