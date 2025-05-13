// --- FILE: src/components/Customer/ProductInfo.js (or appropriate path) ---

import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaStar, FaHeart, FaSpinner, FaUserCircle } from "react-icons/fa";
import Axios from 'axios'; 
import { useCart } from "../ShoppingCart/CartContext"; // Adjust path if needed
import { AuthContext } from "../../AuthContext"; // Adjust path if needed
import moment from 'moment';

// --- Define API Base URL ---
const API_BASE_URL = "http://localhost:8000/api"; // Adjust if needed

// --- Notification Component ---
const Notification = ({ message, type }) => {
    if (!message) return null;
    const baseStyle = {
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        padding: '10px 20px', borderRadius: '5px', color: 'white',
        zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        transition: 'opacity 0.5s ease-in-out', opacity: 1,
        textAlign: 'center'
    };
    const typeStyle = type === 'success' ? { backgroundColor: '#4CAF50' }
                    : type === 'error' ? { backgroundColor: '#f44336' }
                    : { backgroundColor: '#2196F3' };

    return (<div style={{ ...baseStyle, ...typeStyle }}>{message}</div>);
};

// --- ReviewItem Component ---
const ReviewItem = ({ review, loggedInUserProfileId, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedComment, setEditedComment] = useState(review?.review_text || '');
    const [editedRating, setEditedRating] = useState(review?.rating || 0);
    const originalComment = useRef(review?.review_text || '');
    const originalRating = useRef(review?.rating || 0);

    const renderStars = (ratingValue) => {
        const stars = [];
        const rating = parseFloat(ratingValue) || 0;
        const fullStars = Math.floor(rating);
        for (let i = 0; i < 5; i++) {
            stars.push(<FaStar key={`star-${review.id}-${i}`} className={i < fullStars ? "star-filled" : "star-empty"} size={16} />);
        }
        return stars;
    };

    const handleEdit = () => {
        originalComment.current = editedComment;
        originalRating.current = editedRating;
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!editedComment.trim()) { alert("Comment cannot be empty."); return; }
         const numRating = parseFloat(editedRating);
         if (isNaN(numRating) || numRating < 0.5 || numRating > 5 || (numRating * 10) % 5 !== 0) {
             alert("Please select a valid rating (0.5 - 5.0 in 0.5 steps)."); return;
         }
        onEdit(review.id, editedComment.trim(), numRating);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedComment(originalComment.current);
        setEditedRating(originalRating.current);
        setIsEditing(false);
    };

    const handleDelete = () => { onDelete(review.id); };
    const handleRatingEdit = (index) => { setEditedRating(index + 1); };
    const isCurrentUserReview = loggedInUserProfileId && review.profile_id === loggedInUserProfileId;
    const reviewerName = review.userName || review.user?.name || 'Anonymous';

    return (
        <div className="review-item">
            <div className="review-avatar">
                <FaUserCircle size={40} />
            </div>
            <div className="review-content">
                <div className="review-header">
                    <div className="review-name">{reviewerName}</div>
                    {!isEditing ? (
                        <>
                            <div className="review-comment">{review.review_text || <i>No comment provided.</i>}</div>
                            <div className="review-timestamp">{moment(review.created_at).fromNow()}</div>
                            {/* VVVVVV This placement is already correct based on SCSS VVVVVV */}
                            {isCurrentUserReview && (
                                <div className="review-actions">
                                    <span className="action-edit" onClick={handleEdit}>Edit</span>
                                    <span className="action-delete" onClick={handleDelete}>Delete</span>
                                </div>
                            )}
                            {/* ^^^^^^ This placement is already correct based on SCSS ^^^^^^ */}
                        </>
                    ) : (
                        <div className="edit-review-form">
                            <div className="edit-rating-stars">
                                <span>Rating:</span>
                                {Array.from({ length: 5 }, (_, i) => (
                                    <FaStar
                                        key={`edit-star-${review.id}-${i}`}
                                        className={i < Math.floor(editedRating) ? "star-filled" : "star-empty"}
                                        size={18}
                                        onClick={() => handleRatingEdit(i)}
                                    />
                                ))}
                                <span>({editedRating || 0}/5)</span>
                            </div>
                            <textarea
                                value={editedComment}
                                onChange={(e) => setEditedComment(e.target.value)}
                                className="edit-comment-input"
                                rows="3"
                                maxLength="1000"
                            />
                            <div className="review-actions">
                                <button className="action-save" onClick={handleSave}>Save</button>
                                <button className="action-cancel" onClick={handleCancel}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
                {!isEditing && <div className="review-rating">{renderStars(review.rating)}</div>}
             </div>
         </div>
     );
};


// --- Loading Component Definition ---
const LoadingIndicator = ({ message = "Loading..." }) => (
    <div className="loading-indicator" style={{ padding: '40px 20px', textAlign: 'center', minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555' }}>
        <p>{message} <FaSpinner className="spinner" style={{ marginLeft: '8px', animation: 'spin 1s linear infinite', verticalAlign: 'middle' }} /></p>
        <style>{` @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `}</style>
    </div>
);

// --- Authenticated Request Helper ---
const makeAuthenticatedRequest = async (method, url, data = null, config = {}) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error("Auth token missing for authenticated request.");
        return Promise.reject(new Error("Unauthenticated: No token found."));
    }
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(!(data instanceof FormData) && data && method.toLowerCase() !== 'get' ? { 'Content-Type': 'application/json' } : {}),
        ...(config.headers || {}),
    };
    if (data instanceof FormData) delete headers['Content-Type'];
    const fullConfig = { ...config, headers };

    try {
        switch (method.toLowerCase()) {
            case 'get': return await Axios.get(url, fullConfig);
            case 'post': return await Axios.post(url, data, fullConfig);
            case 'put': return await Axios.put(url, data, fullConfig);
            case 'delete': return await Axios.delete(url, fullConfig);
            default: throw new Error(`Unsupported Axios method: ${method}`);
        }
    } catch (error) {
        console.error(`Axios Auth Error: ${method.toUpperCase()} ${url}`, error.response?.data || error.message, error);
        throw error;
    }
};


// --- Main ProductInfo Component ---
const ProductInfo = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { fetchCartCount } = useCart();
    const { user, loading: authLoading } = useContext(AuthContext);

    // --- State ---
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [comment, setComment] = useState("");
    const [rating, setRating] = useState(0);
    const [productReviews, setProductReviews] = useState([]);
    const [reviewsError, setReviewsError] = useState('');
    const [visibleReviews, setVisibleReviews] = useState(3);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isPostingReview, setIsPostingReview] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const notificationTimeoutRef = useRef(null);
    const loggedInUserProfileId = user?.profile?.id || null;
    const [watchColors, setWatchColors] = useState([]);
    const [wristMeasurements, setWristMeasurements] = useState([]);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedMeasurement, setSelectedMeasurement] = useState('');
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [optionsError, setOptionsError] = useState('');
    const [isFavorited, setIsFavorited] = useState(false);

    // --- Utility Functions ---
    const showNotification = useCallback((message, type = 'info', duration = 3000) => {
        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
        setNotification({ message, type });
        notificationTimeoutRef.current = setTimeout(() => {
            setNotification({ message: '', type: '' });
            notificationTimeoutRef.current = null;
        }, duration);
    }, []);

    useEffect(() => { return () => { if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current); }; }, []);


    // --- Data Fetching ---
    const fetchProductData = useCallback(async () => {
        if (!productId) return;
        setLoading(true); setError('');
        setOptionsLoading(true); setOptionsError('');
        setReviewsError('');

        try {
            const results = await Promise.allSettled([
                 Axios.get(`${API_BASE_URL}/products/${productId}`),
                 Axios.get(`${API_BASE_URL}/watch_colors`),
                 Axios.get(`${API_BASE_URL}/wrist_measurements`),
                 Axios.get(`${API_BASE_URL}/reviews`, { params: { product_id: productId, status: 'active', per_page: 100 }})
            ]);

            if (results[0].status === 'fulfilled' && results[0].value.data?.id) {
                 const productData = results[0].value.data;
                 setProduct(productData);
                 setQuantity(0);
                 if (productData.color_id) setSelectedColor(productData.color_id.toString());
                 if (productData.wrist_measurement_id) setSelectedMeasurement(productData.wrist_measurement_id.toString());
            } else {
                console.error("Failed to fetch product:", results[0].reason || 'Unknown error');
                setError('Failed to load product details.'); setProduct(null);
            }

             if (results[1].status === 'fulfilled' && results[1].value.data) {
                 const colorsData = results[1].value.data;
                 let activeColors = [];
                 if (Array.isArray(colorsData.data)) { activeColors = colorsData.data.filter(c => Number(c.status) === 1); }
                 else if (Array.isArray(colorsData)) { activeColors = colorsData.filter(c => Number(c.status) === 1); }
                 setWatchColors(activeColors);
             } else { console.error("Failed fetch colors:", results[1].reason); setOptionsError(prev => prev ? `${prev} | Colors` : 'Could not load colors.'); setWatchColors([]); }

             if (results[2].status === 'fulfilled' && results[2].value.data) {
                const measurementsData = results[2].value.data;
                 let activeMeasurements = [];
                 if (Array.isArray(measurementsData.data)) { activeMeasurements = measurementsData.data.filter(m => Number(m.status) === 1); }
                 else if (Array.isArray(measurementsData)) { activeMeasurements = measurementsData.filter(m => Number(m.status) === 1); }
                 setWristMeasurements(activeMeasurements);
             } else { console.error("Failed fetch measurements:", results[2].reason); setOptionsError(prev => prev ? `${prev} | Sizes` : 'Could not load sizes.'); setWristMeasurements([]); }

            let reviewsData = [];
            if (results[3].status === 'fulfilled' && results[3].value.data) {
                const reviewsResponse = results[3].value.data;
                if (reviewsResponse?.data && Array.isArray(reviewsResponse.data)) { reviewsData = reviewsResponse.data; }
                else if (Array.isArray(reviewsResponse)) { reviewsData = reviewsResponse; }
                else { console.error("Invalid review data format:", reviewsResponse); if (results[0].status === 'fulfilled') setReviewsError("Could not parse review data format."); }
            } else {
                 console.error("Failed to fetch reviews:", results[3].reason || 'Unknown error');
                 if (results[0].status === 'fulfilled') { setReviewsError('Failed to load reviews.'); }
             }
            setProductReviews(reviewsData);
            setShowAllReviews(reviewsData.length <= 3);
            setVisibleReviews(3);

        } catch (err) {
            console.error("[ProductInfo] Catastrophic error:", err);
            setError(`Failed to load page. ${err.message}`); setProduct(null); setProductReviews([]); setWatchColors([]); setWristMeasurements([]);
        } finally { setLoading(false); setOptionsLoading(false); }
    }, [productId]);

    useEffect(() => { window.scrollTo(0, 0); fetchProductData(); }, [fetchProductData]);

    // --- Event Handlers ---
    const handleDecrement = () => { if (quantity > 0) setQuantity(quantity - 1); };
    const handleIncrement = () => { if (product && product.stock > 0 && quantity < product.stock) setQuantity(quantity + 1); else if (product && product.stock > 0) showNotification(`Maximum stock (${product.stock}) reached.`, 'error', 2000); };
    const handleRating = (index) => { setRating(index + 1); };
    const handleCommentChange = (e) => { setComment(e.target.value); };
    const toggleReviews = () => { setShowAllReviews(!showAllReviews); setVisibleReviews(showAllReviews ? 3 : productReviews.length); };
    const handleSelectedColorChange = (event) => { setSelectedColor(event.target.value); };
    const handleSelectedMeasurementChange = (event) => { setSelectedMeasurement(event.target.value); };
    const toggleFavorite = () => { setIsFavorited(prev => !prev); showNotification(isFavorited ? "Removed from favorites." : "Added to favorites!", "info", 1500); };

    // --- Action Handlers ---
    const handleAddToCart = async () => {
        if (authLoading) { showNotification("Please wait...", "info"); return; }
        if (!user) { showNotification("Please log in to add items.", "error"); navigate('/login'); return; }
        if (!product || isAddingToCart || product.stock <= 0) return;
        const quantityForCart = quantity === 0 ? 1 : quantity;
        if (watchColors.length > 0 && !selectedColor) { showNotification("Please select a watch color.", "error"); return; }
        if (wristMeasurements.length > 0 && !selectedMeasurement) { showNotification("Please select a wrist measurement.", "error"); return; }
        if (quantityForCart > product.stock) { showNotification(`Only ${product.stock} items available.`, 'error'); setQuantity(product.stock); return; }

        setIsAddingToCart(true); setError('');
        try {
            const cartData = { productId: product.id, quantity: quantityForCart, color_id: selectedColor || null, wrist_measurement_id: selectedMeasurement || null };
            await makeAuthenticatedRequest('post', `${API_BASE_URL}/cart`, cartData);
            showNotification(`${quantityForCart} ${product.product_name || 'Item'}(s) added to cart!`, 'success');
            fetchCartCount();
            if (quantity === 0) setQuantity(1);
        } catch (err) {
             const errorMsg = err.message.startsWith("Unauthenticated") ? "Please log in again." : `Failed to add item. ${err.response?.data?.message || err.message}`;
             showNotification(errorMsg, 'error', 4000);
             if (err.message.startsWith("Unauthenticated")) navigate('/login');
         } finally { setIsAddingToCart(false); }
     };

    const handlePostReview = async () => {
        if (authLoading) { showNotification("Checking login status...", "info"); return; }
        if (!user) { showNotification("Please log in to post a review.", "error"); navigate('/login'); return; }
        if (!comment.trim() || rating <= 0 || !product || isPostingReview) { showNotification("Please provide both a rating (1-5 stars) and a comment.", "error"); return; }
        setIsPostingReview(true); setError('');
        try {
            const reviewData = { product_id: product.id, rating: rating, review_text: comment.trim() };
            await makeAuthenticatedRequest('post', `${API_BASE_URL}/reviews`, reviewData);
            showNotification("Review submitted successfully!", "success");
            setComment(""); setRating(0);
            fetchProductData();
        } catch (err) {
             const errorMsg = err.message.startsWith("Unauthenticated") ? "Please log in again." : `Failed to submit review. ${err.response?.data?.message || err.message}`;
             showNotification(errorMsg, "error", 4000);
             if (err.message.startsWith("Unauthenticated")) navigate('/login');
         } finally { setIsPostingReview(false); }
    };

    const handleEditReview = async (reviewId, updatedComment, updatedRating) => {
         if (authLoading || !user) { showNotification("Please log in again.", "error"); navigate('/login'); return; }
         const originalReviews = [...productReviews]; let originalReviewData = null;
         setProductReviews(prevReviews => prevReviews.map(review => { if (review.id === reviewId) { originalReviewData = { ...review }; return { ...review, review_text: updatedComment, rating: updatedRating, updated_at: new Date().toISOString() }; } return review; }));
         try {
             const reviewData = { review_text: updatedComment, rating: updatedRating };
             await makeAuthenticatedRequest('put', `${API_BASE_URL}/reviews/${reviewId}`, reviewData);
             showNotification("Review updated successfully!", "success");
             fetchProductData();
         } catch (err) {
             console.error(`[ProductInfo] Edit Review ${reviewId} Error:`, err); const errorMsg = err.message.startsWith("Unauthenticated") ? "Please log in again." : `Failed to update review. ${err.response?.data?.message || err.message}`; showNotification(errorMsg, "error", 4000);
             if (originalReviewData) { setProductReviews(originalReviews); }
             if (err.message.startsWith("Unauthenticated")) navigate('/login');
          }
    };

    const handleDeleteReview = async (reviewId) => {
          if (authLoading || !user) { showNotification("Please log in again.", "error"); navigate('/login'); return; }
          if (!window.confirm("Are you sure you want to PERMANENTLY DELETE your review? This action cannot be undone.")) { return; }
          const originalReviews = [...productReviews]; const reviewToDelete = originalReviews.find(r => r.id === reviewId);
          setProductReviews(prevReviews => prevReviews.filter(review => review.id !== reviewId));
          try {
              await makeAuthenticatedRequest('delete', `${API_BASE_URL}/reviews/${reviewId}`);
              showNotification("Review deleted successfully!", "success");
              fetchProductData();
          } catch (err) {
              console.error(`[ProductInfo] Delete/Archive Review ${reviewId} Error:`, err); const errorMsg = err.message.startsWith("Unauthenticated") ? "Please log in again." : `Failed to delete review. ${err.response?.data?.message || err.message}`; showNotification(errorMsg, "error", 4000);
              if (reviewToDelete) { setProductReviews(originalReviews); }
               if (err.message.startsWith("Unauthenticated")) navigate('/login');
           }
    };

     const handleOrderNow = () => {
         if (authLoading) { showNotification("Please wait...", "info"); return; }
         if (!user) { showNotification("Please log in to order.", "error"); navigate('/login'); return; }
         if (!product || product.stock <= 0) { showNotification("Sorry, this item is out of stock.", "error"); return; }
         const checkoutQuantity = quantity === 0 ? 1 : quantity;

         if (watchColors.length > 0 && !selectedColor) { showNotification("Please select a watch color.", "error"); return; }
         if (wristMeasurements.length > 0 && !selectedMeasurement) { showNotification("Please select a wrist measurement.", "error"); return; }
         if (checkoutQuantity > product.stock) { showNotification(`Only ${product.stock} items available. Please reduce quantity.`, 'error'); return; }

         const itemToCheckout = {
             id: `direct-${product.id}`, quantity: checkoutQuantity,
             product: { id: product.id, product_name: product.product_name, price: product.price, image_url: product.image_url },
             color_id: selectedColor || null, wrist_measurement_id: selectedMeasurement || null,
             color_name: watchColors.find(c => c.id.toString() === selectedColor)?.color_name || null,
             measurement_name: wristMeasurements.find(m => m.id.toString() === selectedMeasurement)?.measurement || null,
         };
         navigate('/customer/payment-confirmation', { state: { itemsToCheckout: [itemToCheckout] } });
      };

    // --- Render Logic ---
    if (loading && !product) return <LoadingIndicator message="Loading product details..." />;
    if (error && !product) return <p className="error-message page-error" style={{ padding: '20px', textAlign: 'center' }}>{error}</p>;
    if (!product) return <p style={{ padding: '20px', textAlign: 'center' }}>Product not found.</p>;

    const isOutOfStock = product.stock <= 0;
    const averageRating = parseFloat(product.average_rating) || 0;
    const reviewCount = product.review_count ?? productReviews.length;
    const fullStars = Math.floor(averageRating);

    return (
        <div className="product-info">
            <Notification message={notification.message} type={notification.type}/>
            <div className="product-navigation">
                <Link to="/customer/products" className="back-link">←  Back</Link>
            </div>
            <div className="product-content">
                 <div className="product-image-wrapper">
                     <img src={product.image_url || '/images/placeholder.svg'} alt={product.product_name} className="product-image"/>
                 </div>
                 <div className="product-details-container">
                     <div className="product-details">
                         <div className="product-title-container"><h1>{product.product_name}</h1><FaHeart className={`heart-icon ${isFavorited ? 'favorited' : ''}`} size={20} onClick={toggleFavorite} /></div>
                         <p className="product-price">₱{parseFloat(product.price || 0).toFixed(2)}</p>
                         <div className={`product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>{isOutOfStock ? 'Out of Stock' : `${product.stock} stocks available`}</div>
                         <div className="product-rating">
                              <div className="rating-stars">
                                  {Array.from({ length: 5 }, (_, i) => (
                                       <FaStar key={`disp-star-${i}`} className={i < fullStars ? "star-filled" : "star-empty"} size={20} />
                                   ))}
                               </div>
                             <span className="rating-value">{averageRating.toFixed(1)}</span>
                             <span className="rating-number">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                         </div>
                         <div className="product-quantity">
                             <button onClick={handleDecrement} disabled={isOutOfStock || quantity <= 0}>-</button>
                             <span>{isOutOfStock ? 0 : quantity}</span>
                             <button onClick={handleIncrement} disabled={isOutOfStock || quantity >= product.stock}>+</button>
                         </div>
                         <div className="product-options-row">
                              {(optionsLoading || watchColors.length > 0 || optionsError) && (
                                 <div className="product-option-group">
                                     <label htmlFor="watch-color-select">Watch Color:</label>
                                     {optionsLoading ? <LoadingIndicator message="Loading..." /> : watchColors.length > 0 ?
                                     <select id="watch-color-select" value={selectedColor} onChange={handleSelectedColorChange} disabled={isOutOfStock} required={watchColors.length > 0}> <option value="">Select Color...</option> {watchColors.map(color => (<option key={color.id} value={color.id.toString()}>{color.color_name}</option>))} </select> : <p>N/A</p>}
                                     {optionsError && !optionsLoading && <p className="error-text">{optionsError}</p>}
                                 </div>
                              )}
                              {(optionsLoading || wristMeasurements.length > 0 || optionsError) && (
                                <div className="product-option-group">
                                     <label htmlFor="wrist-measurement-select">Wrist Size:</label>
                                      {optionsLoading ? <LoadingIndicator message="Loading..." /> : wristMeasurements.length > 0 ?
                                     <select id="wrist-measurement-select" value={selectedMeasurement} onChange={handleSelectedMeasurementChange} disabled={isOutOfStock} required={wristMeasurements.length > 0}> <option value="">Select Size...</option> {wristMeasurements.map(m => (<option key={m.id} value={m.id.toString()}>{m.measurement}</option>))} </select> : <p>N/A</p>}
                                      {optionsError && !optionsLoading && <p className="error-text">{optionsError}</p>}
                                </div>
                               )}
                         </div>
                         <h2>Description</h2> <p className="product-description">{product.description || 'No description available.'}</p>
                         <div className="product-actions">
                             <button className="order-button" onClick={handleOrderNow} disabled={isOutOfStock}>Order Now</button>
                             <button className="cart-button" onClick={handleAddToCart} disabled={isAddingToCart || isOutOfStock || authLoading || (watchColors.length > 0 && !selectedColor) || (wristMeasurements.length > 0 && !selectedMeasurement)}>
                                {isAddingToCart ? <FaSpinner className="spinner"/> : 'Add to Cart'}
                             </button>
                         </div>
                     </div>
                 </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section">
                 <h2>Reviews</h2>
                 {user && !authLoading && (
                    <div className="add-review">
                        <p>Add a review</p>
                        <p>Share your thoughts on this product.</p>
                         <div className="rating-stars add-rating"> {Array.from({ length: 5 }, (_, i) => ( <FaStar key={`rate-star-${i}`} className={i < rating ? "star-filled" : "star-empty"} size={24} onClick={() => !isPostingReview && handleRating(i)} /> ))} <span className="rating-value">({rating || 0})</span> </div>
                         <div className="comment-box">
                             <textarea value={comment} onChange={handleCommentChange} placeholder="Write your review here..." className="comment-input" disabled={isPostingReview} rows="4"/>
                             <button className="post-review" onClick={handlePostReview} disabled={isPostingReview || !comment.trim() || rating === 0}>
                                 {isPostingReview ? <FaSpinner className="spinner"/> : 'Post It!'}
                             </button>
                         </div>
                    </div>
                 )}
                 {!user && !authLoading && <p>Please <Link to="/login" style={{color: '#007bff'}}>log in</Link> to add or manage your reviews.</p>}

                 <div className="comments-header">{reviewCount} {reviewCount === 1 ? 'Comment' : 'Comments'}</div>
                 {loading && productReviews.length === 0 && <LoadingIndicator message="Loading reviews..." />}
                 {reviewsError && !loading && <p className="error-message page-error">{reviewsError}</p>}
                 {!loading && productReviews.length === 0 && !reviewsError && (<p style={{textAlign: 'center', color: '#777', padding: '20px 0'}}>No reviews yet.</p> )}
                 {!loading && productReviews.length > 0 && (
                     <>
                         {productReviews.slice(0, visibleReviews).map(review => ( <ReviewItem key={review.id} review={review} loggedInUserProfileId={loggedInUserProfileId} onEdit={handleEditReview} onDelete={handleDeleteReview} /> ))}
                         {productReviews.length > 3 && ( <button className="load-more-button" onClick={toggleReviews}> {showAllReviews ? 'View Less' : 'View More'} </button> )}
                     </>
                 )}
             </div>
        </div>
    );
};

export default ProductInfo;