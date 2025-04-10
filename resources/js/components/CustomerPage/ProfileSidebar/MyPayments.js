import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios'; // Import axios
import { FaTrash, FaCcVisa, FaCcMastercard, FaCreditCard } from 'react-icons/fa'; 

const MyPayments = () => {
    const [savedCards, setSavedCards] = useState([]); // State for fetched cards
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addingCard, setAddingCard] = useState(false); // State for save button
    const [deleteLoading, setDeleteLoading] = useState(null); // Store ID of card being deleted

    const [formData, setFormData] = useState({
        cardType: "Visa", // Default or detect later
        cardNumber: "",
        cardHolder: "",
        expiryDate: "", // MM / YY format
        cvc: "",
    });
    const [formErrors, setFormErrors] = useState({}); // For validation errors

    const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Use consistent URL

    // --- Fetch Saved Cards ---
    const fetchCards = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/credit-cards`, {
                headers: { 'Accept': 'application/json' },
                // No credentials needed for temp version
            });
            setSavedCards(response.data || []);
        } catch (err) {
            console.error("Error fetching saved cards:", err);
            setError(err.response?.data?.message || err.message || 'Could not load saved cards.');
            setSavedCards([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    // --- Handle Form Change ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        // Basic formatting for card number and expiry date
        if (name === 'cardNumber') {
            // Remove non-digits and add spaces (basic formatting)
            formattedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
        } else if (name === 'expiryDate') {
            // Remove non-digits/slash, add slash automatically
            formattedValue = value.replace(/\D/g, '');
            if (formattedValue.length > 2) {
                formattedValue = formattedValue.slice(0, 2) + ' / ' + formattedValue.slice(2, 4);
            } else if (formattedValue.length === 2 && formData.expiryDate.length === 1) {
                 // Add slash after MM if user didn't type it
                 formattedValue += ' / ';
            }
        } else if (name === 'cvc') {
             formattedValue = value.replace(/\D/g, '').slice(0, 4); // Limit CVC length
        }

        setFormData((prev) => ({ ...prev, [name]: formattedValue }));
        // Clear specific error when user types
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // --- Handle Form Submit (Add Card) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setAddingCard(true);
        setError(null);
        setFormErrors({}); // Clear previous errors

        try {
            const response = await axios.post(`${API_BASE_URL}/credit-cards`, formData, {
                 headers: {
                     'Accept': 'application/json',
                     'Content-Type': 'application/json'
                 }
                 // No credentials needed for temp version
            });
            alert(response.data.message || 'Card saved successfully!');
            setFormData({ // Reset form
                cardType: "Visa", cardNumber: "", cardHolder: "", expiryDate: "", cvc: "",
            });
            await fetchCards(); // Refresh the list
        } catch (err) {
            console.error("Error adding card:", err);
            if (err.response?.status === 422 && err.response?.data?.errors) {
                // Handle validation errors from Laravel
                setFormErrors(err.response.data.errors);
                setError("Please check the card details."); // General message
            } else {
                setError(err.response?.data?.message || err.message || 'Could not save card.');
            }
        } finally {
            setAddingCard(false);
        }
    };

    // --- Handle Delete Card ---
    const handleDelete = async (cardId) => {
         if (!window.confirm("Are you sure you want to delete this saved card?")) {
             return;
         }
         setDeleteLoading(cardId); // Indicate loading for this specific card
         setError(null);
         try {
             await axios.delete(`${API_BASE_URL}/credit-cards/${cardId}`, {
                 headers: { 'Accept': 'application/json' }
                 // No credentials needed for temp version
             });
             alert('Card deleted successfully!');
             await fetchCards(); // Refresh the list
         } catch (err) {
             console.error("Error deleting card:", err);
             setError(err.response?.data?.message || err.message || 'Could not delete card.');
         } finally {
             setDeleteLoading(null); // Clear loading indicator
         }
     };

     // --- Helper to get Card Icon ---
     const getCardIcon = (brand) => {
        const lowerBrand = brand?.toLowerCase();
        if (lowerBrand?.includes('visa')) return <FaCcVisa size="2em" color="#1a1f71"/>;
        if (lowerBrand?.includes('mastercard')) return <FaCcMastercard size="2em" color="#eb001b"/>;
        // Add other brands (Amex, Discover, etc.) if needed
        return <FaCreditCard size="2em" color="#888" />; // Default icon
     }

    return (
        <div className="my-payments">
            <h1>My Payments</h1>

            {/* Display Saved Cards */}
            <div className="payment-section">
                <h2 className="credit-card-header">Saved Cards</h2>
                 {loading && <p>Loading saved cards...</p>}
                 {error && !loading && <p className="error-message">{error} <button onClick={fetchCards}>Retry</button></p>}
                 {!loading && savedCards.length === 0 && !error && <p>No saved payment methods found.</p>}
                 {!loading && savedCards.length > 0 && (
                     <div className="saved-cards-list">
                         {savedCards.map(card => (
                             <div className="content-row saved-card-item" key={card.id}>
                                 <div className="card-icon">{getCardIcon(card.card_brand)}</div>
                                 <div className="card-info">
                                     <p className="card-number">{card.card_brand} •••• {card.last_four}</p>
                                     <p className="card-expiry">Expires: {card.expiry}</p> {/* Use the accessor */}
                                     {/* <p>Holder: {card.cardholder_name}</p> */}
                                 </div>
                                 <div className="button-group">
                                     <button
                                         className="delete-btn"
                                         onClick={() => handleDelete(card.id)}
                                         disabled={deleteLoading === card.id} // Disable only the button being clicked
                                     >
                                          {deleteLoading === card.id ? 'Deleting...' : <FaTrash />}
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
                {/* Removed static Add button here */}
            </div>

             {/* Add New Card Form */}
            <div className="payment-section">
                <h2 className="add-new-card-header">Add New Credit Card</h2>
                <form onSubmit={handleSubmit}>
                    {/* Card type display (can be enhanced later) */}
                    <div className="form-group card-type">
                        <label>Card type</label>
                        <div className="card-type-selector">
                            {/* Basic display, brand is detected on backend */}
                             {getCardIcon(formData.cardType)} <span style={{marginLeft: '10px'}}>{formData.cardType || 'Enter Card Number'}</span>
                        </div>
                         {formErrors.cardType && <span className="error-text">{formErrors.cardType[0]}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="cardNumber">Card number</label>
                        <div className="input-with-icon">
                            <input
                                id="cardNumber"
                                type="text" // Use text for formatted input
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleChange}
                                placeholder="XXXX XXXX XXXX XXXX"
                                maxLength="23" // Account for spaces
                                inputMode="numeric" // Hint for mobile keyboards
                                autoComplete="cc-number"
                                className={formErrors.cardNumber ? 'input-error' : ''}
                            />
                            {/* Remove checkmark icon for now */}
                        </div>
                        {formErrors.cardNumber && <span className="error-text">{formErrors.cardNumber[0]}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="cardHolder">Card holder</label>
                        <input
                            id="cardHolder"
                            type="text"
                            name="cardHolder"
                            value={formData.cardHolder}
                            onChange={handleChange}
                            placeholder="Full Name on Card"
                            autoComplete="cc-name"
                            className={formErrors.cardHolder ? 'input-error' : ''}
                        />
                         {formErrors.cardHolder && <span className="error-text">{formErrors.cardHolder[0]}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="expiryDate">Expiration date</label>
                            <input
                                id="expiryDate"
                                type="text" // Use text for formatted input
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                                placeholder="MM / YY"
                                maxLength="7" // MM / YY
                                autoComplete="cc-exp"
                                className={formErrors.expiryDate ? 'input-error' : ''}
                            />
                             {formErrors.expiryDate && <span className="error-text">{formErrors.expiryDate[0]}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="cvc">CVC</label>
                            <input
                                id="cvc"
                                type="text" // Use text to allow formatting/masking later if needed
                                name="cvc"
                                value={formData.cvc}
                                onChange={handleChange}
                                placeholder="XXX"
                                maxLength="4"
                                inputMode="numeric"
                                autoComplete="cc-csc"
                                className={formErrors.cvc ? 'input-error' : ''}
                            />
                             {formErrors.cvc && <span className="error-text">{formErrors.cvc[0]}</span>}
                        </div>
                    </div>

                    {error && !formErrors.cardNumber && !formErrors.cardHolder && !formErrors.expiryDate && !formErrors.cvc && (
                       <p className="error-message" style={{ textAlign: 'left', marginTop: '-10px', marginBottom: '15px' }}>{error}</p>
                    )}

                    <div className="form-actions">
                        <button type="submit" className="save-btn" disabled={addingCard || loading}>
                            {addingCard ? "Saving..." : "Save Card"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyPayments;