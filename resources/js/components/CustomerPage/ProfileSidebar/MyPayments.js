import React, { useState } from "react";

const MyPayments = () => {
    const [formData, setFormData] = useState({
        cardType: "VISA",
        cardNumber: "",
        cardHolder: "",
        expiryDate: "",
        cvc: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("New card added:", formData);
    };

    return (
        <div className="my-payments">
            <h1>My Payments</h1>
            <div className="payment-section">
                <h2 className="credit-card-header">Credit card</h2>
                <div className="content-row">
                    <div className="card-info">
                        <p className="card-number">Visa •••• 9999</p>
                        <p className="card-expiry">Expiration: 02/2024</p>
                    </div>
                    <div className="button-group">
                        <button className="add-btn">Add payment method</button>
                    </div>
                </div>
            </div>
            <div className="payment-section">
                <h2 className="add-new-card-header">Add new credit card</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group card-type">
                        <label>Card type</label>
                        <div className="card-type-selector">
                            <span className="visa-icon">VISA</span>
                            <span className="card-options">••</span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Card number</label>
                        <div className="input-with-icon">
                            <input
                                type="text"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleChange}
                                placeholder="9224 0000 111 3333"
                            />
                            <span className="checkmark-icon">✔</span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Card holder</label>
                        <input
                            type="text"
                            name="cardHolder"
                            value={formData.cardHolder}
                            onChange={handleChange}
                            placeholder="PHAM TRAN LAN CAM NGOC"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Expiration date</label>
                            <input
                                type="text"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                                placeholder="MM / YY"
                            />
                        </div>
                        <div className="form-group">
                            <label>CVC</label>
                            <input
                                type="text"
                                name="cvc"
                                value={formData.cvc}
                                onChange={handleChange}
                                placeholder=""
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="save-btn">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyPayments;