// ProductInfo.js (with Optimistic Updates for Edit/Delete)
import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaStar, FaHeart, FaSpinner } from "react-icons/fa";
import Axios from 'axios';
import { useCart } from "../ShoppingCart/CartContext"; // Adjust path if needed
import { AuthContext } from "../../AuthContext"; // Adjust path if needed
import moment from 'moment';

// --- Notification Component ---
const Notification = ({ message, type }) => { if (!message) return null; const baseStyle = { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: '5px', color: 'white', zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }; const typeStyle = type === 'success' ? { backgroundColor: '#4CAF50' } : type === 'error' ? { backgroundColor: '#f44336' } : { backgroundColor: '#2196F3' }; return (<div style={{ ...baseStyle, ...typeStyle }}>{message}</div>); };

// --- ReviewItem Component ---
// Receives loggedInUserProfileId to check ownership
const ReviewItem = ({ review, loggedInUserProfileId, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedComment, setEditedComment] = useState(review.review_text || '');
    const [editedRating, setEditedRating] = useState(review.rating);
    // Store original values for potential rollback on cancel/failed save
    const originalComment = useRef(review.review_text || '');
    const originalRating = useRef(review.rating);

    const renderStars = (rating) => { const stars = []; const fullStars = Math.floor(rating); for (let i = 0; i < 5; i++) { stars.push(<FaStar key={`star-${i}`} className={i < fullStars ? "star-filled" : "star-empty"} size={16} />); } return stars; };

    const handleEdit = () => {
        // Store current values before entering edit mode
        originalComment.current = editedComment;
        originalRating.current = editedRating;
        setIsEditing(true);
    };
    const handleSave = () => {
        if (!editedComment.trim()) { alert("Comment cannot be empty."); return; }
        // Pass the new values to the parent handler
        onEdit(review.id, editedComment.trim(), editedRating);
        setIsEditing(false); // Exit editing mode immediately (optimistic)
    };
    const handleCancel = () => {
        // Revert to original values stored when edit started
        setEditedComment(originalComment.current);
        setEditedRating(originalRating.current);
        setIsEditing(false);
    };
    const handleDelete = () => {
        // Ask for confirmation in the parent handler instead
        onDelete(review.id);
    };
    const handleRating = (index) => setEditedRating(index + 1);

    const isCurrentUserReview = loggedInUserProfileId && review.profile_id === loggedInUserProfileId;

    return (
        <div className="review-item">
            <div className="review-avatar">{/* Placeholder */}</div>
            <div className="review-content">
                <div className="review-header">
                    <div className="review-name">{review.profile?.first_name || review.profile?.name || 'Anonymous'}</div>
                    {isEditing ? ( /* Edit Mode JSX */ <> <textarea value={editedComment} onChange={(e) => setEditedComment(e.target.value)} className="edit-comment-input" rows="3"/> <div className="edit-rating-stars"> {Array.from({ length: 5 }, (_, i) => (<FaStar key={`edit-star-${i}`} className={i < Math.floor(editedRating) ? "star-filled" : "star-empty"} size={18} onClick={() => handleRating(i)} style={{ cursor: 'pointer', marginRight: '2px' }} />))} <span style={{ marginLeft: '10px' }}>({editedRating || 0})</span> </div> <div className="review-actions"> <button className="action-save" onClick={handleSave}>Save</button> <button className="action-cancel" onClick={handleCancel}>Cancel</button> </div> </>
                    ) : ( /* View Mode JSX */ <> <div className="review-comment">{review.review_text || <i>No comment provided.</i>}</div> <div className="review-timestamp">{moment(review.created_at).fromNow()}</div> {isCurrentUserReview && ( <div className="review-actions"> <span className="action-edit" onClick={handleEdit}>Edit</span> <span className="action-delete" onClick={handleDelete}>Delete</span> </div> )} </>
                    )}
                </div>
                {!isEditing && <div className="review-rating">{renderStars(review.rating)}</div>}
            </div>
        </div>
    );
};

// --- Loading Component Definition ---
const LoadingIndicator = ({ message = "Loading..." }) => ( <div className="product-info" style={{ padding: '20px', textAlign: 'center', minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}> <p>{message} <FaSpinner className="spinner" /></p> </div> );

// --- Main ProductInfo Component ---
const ProductInfo = () => {
    // Hooks and State... (Keep all previous state and hooks)
    const { productId } = useParams();
    const navigate = useNavigate();
    const { fetchCartCount } = useCart();
    const { user, loading: authLoading } = useContext(AuthContext);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [comment, setComment] = useState("");
    const [rating, setRating] = useState(0);
    const [productReviews, setProductReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState('');
    const [visibleReviews, setVisibleReviews] = useState(3);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isPostingReview, setIsPostingReview] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const notificationTimeoutRef = useRef(null);
    const API_BASE_URL = "http://localhost:8000/api";
    const loggedInUserProfileId = user?.profile?.id || user?.id || null;

    // Helper Functions (showNotification, getAuthHeaders - Keep as before)
    const showNotification = useCallback((message, type = 'success', duration = 3000) => { if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current); setNotification({ message, type }); notificationTimeoutRef.current = setTimeout(() => { setNotification({ message: '', type: '' }); notificationTimeoutRef.current = null; }, duration); }, []);
    const getAuthHeaders = useCallback(() => { const token = localStorage.getItem("access_token"); if (!token) { showNotification("Authentication error. Please log in again.", "error"); throw new Error("Auth token not found."); } return { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' }; }, [showNotification]);

    // Fetching Functions (fetchProductReviews, fetchProductDetails - Keep as before)
    const fetchProductReviews = useCallback(async () => { if (!productId) return; setReviewsLoading(true); setReviewsError(''); try { const response = await Axios.get(`${API_BASE_URL}/reviews?product_id=${productId}`); if (Array.isArray(response.data)) { setProductReviews(response.data); setShowAllReviews(response.data.length <= 3); setVisibleReviews(3); } else { throw new Error("Invalid review data format"); } } catch (err) { console.error("[ProductInfo] Error fetching reviews:", err); setReviewsError(`Failed to load reviews. ${err.response?.data?.message || err.message}`); setProductReviews([]); } finally { setReviewsLoading(false); } }, [productId]);
    const fetchProductDetails = useCallback(async () => { if (!productId) return; setLoading(true); setError(''); try { const productResponse = await Axios.get(`${API_BASE_URL}/products/${productId}`); if (!productResponse.data || typeof productResponse.data.id === 'undefined') { throw new Error("Incomplete product data received from server."); } setProduct(productResponse.data); } catch (err) { console.error("[ProductInfo] Error fetching product:", err); setError(`Failed to load product details. ${err.response?.data?.message || err.message}`); setProduct(null); } finally { setLoading(false); } }, [productId]);

    // Effects (Keep as before)
    useEffect(() => { window.scrollTo(0, 0); }, []);
    useEffect(() => { fetchProductDetails(); fetchProductReviews(); }, [fetchProductDetails, fetchProductReviews]);
    useEffect(() => { return () => { if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current); }; }, []);

    // Event Handlers (handleDecrement, handleIncrement, handleRating, handleCommentChange, toggleReviews - Keep as before)
    const handleDecrement = () => { if (quantity > 1) setQuantity(quantity - 1); };
    const handleIncrement = () => { if (product && product.stock > 0 && quantity < product.stock) { setQuantity(quantity + 1); } else if (product && product.stock > 0 && quantity >= product.stock) { showNotification(`Maximum stock (${product.stock}) reached.`, 'error', 2000); } };
    const handleRating = (index) => { setRating(index + 1); };
    const handleCommentChange = (e) => { setComment(e.target.value); };
    const toggleReviews = () => { setShowAllReviews(!showAllReviews); setVisibleReviews(showAllReviews ? 3 : productReviews.length); };

    // --- Authenticated Action Handlers ---
    const handleAddToCart = async () => { /* ... keep exact logic ... */ if (authLoading) { showNotification("Please wait...", "info"); return; } if (!user) { showNotification("Please log in to add items.", "error"); navigate('/login'); return; } if (!product || isAddingToCart || product.stock <= 0) return; if (quantity > product.stock) { showNotification(`Only ${product.stock} items available.`, 'error'); setQuantity(product.stock); return; } setIsAddingToCart(true); setError(''); try { const headers = getAuthHeaders(); await Axios.post(`${API_BASE_URL}/cart`, { productId: product.id, quantity: quantity }, { headers }); showNotification(`${quantity} ${product.product_name || 'Item'}(s) added to cart!`, 'success'); fetchCartCount(); } catch (err) { console.error("[ProductInfo] Add to Cart Error:", err.response || err.message || err); const errorMsg = `Failed to add item. ${err.response?.data?.message || err.message}`; showNotification(errorMsg, 'error', 4000); } finally { setIsAddingToCart(false); } };

    // Post Review: No optimistic UI update for add, just re-fetch on success
    const handlePostReview = async () => { if (authLoading) { showNotification("Please wait...", "info"); return; } if (!user) { showNotification("Please log in to post a review.", "error"); navigate('/login'); return; } if (!comment.trim() || rating <= 0 || !product || isPostingReview) { showNotification("Please provide both a rating (1-5 stars) and a comment.", "error"); return; } setIsPostingReview(true); setError(''); try { const headers = getAuthHeaders(); const reviewData = { product_id: product.id, rating: rating, review_text: comment.trim() }; await Axios.post(`${API_BASE_URL}/reviews`, reviewData, { headers }); showNotification("Review submitted successfully!", "success"); setComment(""); setRating(0); fetchProductDetails(); fetchProductReviews(); } catch (err) { console.error("[ProductInfo] Post Review Error:", err.response || err.message || err); const errorMsg = `Failed to submit review. ${err.response?.data?.message || err.message}`; showNotification(errorMsg, "error", 4000); } finally { setIsPostingReview(false); } };

    // Edit Review: Optimistic Update
    const handleEditReview = async (reviewId, updatedComment, updatedRating) => {
        if (!user) { showNotification("Please log in again.", "error"); return; }

        // --- Optimistic UI Update ---
        // Store the original state in case we need to revert
        const originalReviews = [...productReviews];
        let originalReviewData = null;

        setProductReviews(prevReviews => prevReviews.map(review => {
            if (review.id === reviewId) {
                originalReviewData = { ...review }; // Store original for rollback
                return { ...review, review_text: updatedComment, rating: updatedRating };
            }
            return review;
        }));
        // --- End Optimistic Update ---

        try {
            const headers = getAuthHeaders();
            const reviewData = { review_text: updatedComment, rating: updatedRating };
            await Axios.put(`${API_BASE_URL}/reviews/${reviewId}`, reviewData, { headers });
            showNotification("Review updated successfully!", "success");
            // Re-fetch product details to update average rating/count accurately
            fetchProductDetails();
            // Optionally re-fetch reviews to ensure perfect sync, or trust optimistic update
            // fetchProductReviews();

        } catch (err) {
            console.error(`[ProductInfo] Edit Review ${reviewId} Error:`, err.response || err.message || err);
            const errorMsg = `Failed to update review. ${err.response?.data?.message || err.message}`;
            showNotification(errorMsg, "error", 4000);

            // --- Rollback UI on Failure ---
            if (originalReviewData) { // Check if we captured the original
                 setProductReviews(originalReviews); // Restore the original reviews array
                 console.log("[ProductInfo] Rolled back optimistic edit for review ID:", reviewId);
            }
            // --- End Rollback ---
        }
    };

    // Delete Review: Optimistic Update
    const handleDeleteReview = async (reviewId) => {
        if (!user) { showNotification("Please log in again.", "error"); return; }
        if (!window.confirm("Are you sure you want to delete your review? This cannot be undone.")) { return; }

        // --- Optimistic UI Update ---
        const originalReviews = [...productReviews];
        const reviewToDelete = originalReviews.find(r => r.id === reviewId); // Find before filtering

        setProductReviews(prevReviews => prevReviews.filter(review => review.id !== reviewId));
        // --- End Optimistic Update ---

        try {
            const headers = getAuthHeaders();
            await Axios.delete(`${API_BASE_URL}/reviews/${reviewId}`, { headers });
            showNotification("Review deleted successfully!", "success");
            // Re-fetch product details to update average rating/count accurately
            fetchProductDetails();
            // Re-fetching reviews list is optional, as it was removed locally
            // fetchProductReviews();

        } catch (err) {
            console.error(`[ProductInfo] Delete Review ${reviewId} Error:`, err.response || err.message || err);
            const errorMsg = `Failed to delete review. ${err.response?.data?.message || err.message}`;
            showNotification(errorMsg, "error", 4000);

            // --- Rollback UI on Failure ---
            if (reviewToDelete) { // Check if we found the review originally
                setProductReviews(originalReviews); // Restore the original reviews array
                console.log("[ProductInfo] Rolled back optimistic delete for review ID:", reviewId);
            }
            // --- End Rollback ---
        }
    };

    // Order Now Handler (Keep as before)
    const handleOrderNow = () => { if (product && product.stock > 0) { const itemToCheckout = { id: product.id, quantity: quantity, product: { id: product.id, product_name: product.product_name, price: product.price, image_url: product.image_url }, selected: true }; navigate('/customer/payment-confirmation', { state: { itemsToCheckout: [itemToCheckout] } }); } else { showNotification("Sorry, this item is currently out of stock.", "error"); } };


    // --- Render Logic ---
    if (authLoading || loading) return <LoadingIndicator message="Loading product details..." />;
    if (error && !product) return <p className="error-message">{error}</p>;
    if (!product) return <p>Product not found.</p>;

    const isOutOfStock = product.stock <= 0;
    const averageRating = parseFloat(product.average_rating) || 0;
    const fullStars = Math.floor(averageRating);

    return (
        <div className="product-info">
            <Notification message={notification.message} type={notification.type}/>
            <div className="product-navigation"><Link to="/customer/products" className="back-link">← Back to Products</Link></div>
            {error && <p className="error-message" style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
            <div className="product-header"></div>
            <div className="product-content">
                <div className="product-image-wrapper"><img src={product.image_url || '/images/placeholder.svg'} alt={product.product_name} className="product-image"/></div>
                <div className="product-details-container">
                    <div className="product-details">
                        <div className="product-title-container"><h1>{product.product_name}</h1><FaHeart className="heart-icon" size={20} /></div>
                        <p className="product-price">₱{parseFloat(product.price || 0).toFixed(2)}</p>
                        <div className={`product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>{isOutOfStock ? 'Out of Stock' : `${product.stock} stocks`}</div>
                        <div className="product-rating"> <div className="rating-stars"> {Array.from({ length: 5 }, (_, i) => ( <FaStar key={`disp-star-${i}`} className={i < fullStars ? "star-filled" : "star-empty"} size={20} /> ))} </div> <span className="rating-value">{averageRating.toFixed(1)}</span> <span className="rating-number">({product.review_count || 0} {product.review_count === 1 ? 'review' : 'reviews'})</span> </div>
                        <div className="product-quantity"> <button onClick={handleDecrement} disabled={isOutOfStock || quantity <= 1}>-</button> <span>{isOutOfStock ? 0 : quantity}</span> <button onClick={handleIncrement} disabled={isOutOfStock}>+</button> </div>
                        <h2>Description</h2><p className="product-description">{product.description || 'No description available.'}</p>
                        <div className="product-actions"> <button className="order-button" onClick={handleOrderNow} disabled={isOutOfStock}>Order Now</button> <button className="cart-button" onClick={handleAddToCart} disabled={isAddingToCart || isOutOfStock || authLoading}> {isAddingToCart ? <FaSpinner className="spinner"/> : 'Add to Cart'} </button> </div>
                    </div>
                </div>
            </div>
             {/* Reviews Section */}
            <div className="reviews-section">
                 <h2>Reviews</h2>
                 {user && ( <div className="add-review"> <p>Add a review</p><p>Share your thoughts on this product.</p> <div className="rating-stars add-rating"> {Array.from({ length: 5 }, (_, i) => ( <FaStar key={`rate-star-${i}`} className={i < Math.floor(rating) ? "star-filled" : "star-empty"} size={24} onClick={() => handleRating(i)} style={{ cursor: 'pointer' }}/> ))} <span className="rating-value" style={{ marginLeft: '10px' }}>({rating || 0})</span> </div> <div className="comment-box"> <textarea value={comment} onChange={handleCommentChange} placeholder="Write your review here..." className="comment-input" disabled={isPostingReview} rows="4"/> <button className="post-review" onClick={handlePostReview} disabled={isPostingReview || !comment.trim() || rating === 0}> {isPostingReview ? <FaSpinner className="spinner" /> : 'Post It!'} </button> </div> </div> )}
                 {!user && <p>Please <Link to="/login">log in</Link> to add a review.</p>}
                 <div className="comments-header" style={{marginTop: '20px'}}>{product.review_count || 0} comments</div>
                 {reviewsLoading && <p>Loading reviews...</p>}
                 {reviewsError && <p style={{ color: 'red' }}>{reviewsError}</p>}
                 {!reviewsLoading && !reviewsError && productReviews.length === 0 && (<p>No reviews yet. Be the first!</p> )}
                 {!reviewsLoading && !reviewsError && productReviews.length > 0 && ( <> {productReviews.slice(0, visibleReviews).map(review => ( <ReviewItem key={review.id} review={review} loggedInUserProfileId={loggedInUserProfileId} onEdit={handleEditReview} onDelete={handleDeleteReview} /> ))} {productReviews.length > 3 && ( <button className="load-more-button" onClick={toggleReviews}> {showAllReviews ? 'View less reviews' : 'View more reviews'} </button> )} </> )}
             </div>
             {/* <div className="related-products"><h2>You may also like</h2> ... </div> */}
        </div>
    );
};

export default ProductInfo;