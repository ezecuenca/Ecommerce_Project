// src/components/admin/WristMeasurement.js
import React, { useState } from "react";
import { FaEdit } from "react-icons/fa"; // Kept FaEdit for consistency (no image needed for measurements)

const WristMeasurement = () => {
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
    const measurements = [
        { id: 1, measurement: "6.5 inches", createdAt: "11/21/24", updatedAt: "11/21/24" },
        { id: 2, measurement: "7.5 inches", createdAt: "11/21/24", updatedAt: "11/21/24" },
        { id: 3, measurement: "8.5 inches", createdAt: "11/21/24", updatedAt: "11/21/24" },
    ];

    return (
        <div className="measurements-container">
            <h2 className="h2">Wrist Measurement</h2>
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
            <table className="measurements-table">
                <thead>
                    <tr className="thead">
                        <th className="th">
                            <input type="checkbox" className="checkbox select-all" checked={isSelectAll} onChange={handleSelectAll} />
                        </th> 
                        <th className="th">Wrist Measurement</th>
                        <th className="th">Created at</th>
                        <th className="th">Updated at</th>
                    </tr>
                </thead>
                <tbody>
                    {measurements.map((measurement, index) => (
                        <tr className="tr" key={measurement.id}>
                            <td className="td">
                                <input type="checkbox" className="checkbox" onChange={(e) => handleRowCheckbox(index, e)} />
                                <FaEdit className="edit-icon" size={16} onClick={() => alert("Edit clicked!")} /> {/* Edit button/icon beside checkbox, not grouped */}
                            </td>
                            <td className="td">{measurement.measurement}</td>
                            <td className="td">{measurement.createdAt}</td>
                            <td className="td">{measurement.updatedAt}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default WristMeasurement;