import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaStar, FaHeart } from "react-icons/fa";
import Axios from 'axios';
import { useCart } from "../ShoppingCart/CartContext";
import moment from 'moment';

// Assume getCurrentUserId, Notification, ReviewItem components exist and work

const getCurrentUserId = () => { return 1; };
const Notification = ({ message, type }) => { if (!message) return null; const baseStyle = { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: '5px', color: 'white', zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }; const typeStyle = type === 'success' ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#f44336' }; return (<div style={{ ...baseStyle, ...typeStyle }}>{message}</div>); };
const ReviewItem = ({ review, currentUserId, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedComment, setEditedComment] = useState(review.review_text || 'Customer comment review');
    const [editedRating, setEditedRating] = useState(review.rating);
    const renderStars = (rating) => { const stars = []; const fullStars = Math.floor(rating); for (let i = 0; i < 5; i++) { stars.push(<FaStar key={`star-${i}`} className={i < fullStars ? "star-filled" : "star-empty"} size={16} />); } return stars; };
    const handleEdit = () => setIsEditing(true); const handleSave = () => { onEdit(review.id, editedComment, editedRating); setIsEditing(false); }; const handleCancel = () => { setEditedComment(review.review_text || 'Customer comment review'); setEditedRating(review.rating); setIsEditing(false); }; const handleDelete = () => onDelete(review.id); const handleRating = (index) => setEditedRating(index + 1);
    const isCurrentUserReview = review.profile_id === currentUserId;
    return (
        <div className="review-item"> <div className="review-avatar"></div> <div className="review-content"> <div className="review-header"> <div className="review-name">{review.profile?.name || 'Customer Name'}</div> {isEditing ? (<> <input type="text" value={editedComment} onChange={(e) => setEditedComment(e.target.value)} className="edit-comment-input"/> <div className="edit-rating-stars"> {Array.from({ length: 5 }, (_, i) => (<FaStar key={i} className={i < Math.floor(editedRating) ? "star-filled" : "star-empty"} size={16} onClick={() => handleRating(i)} />))} </div> <div className="review-actions"> <span className="action-save" onClick={handleSave}>Save</span> <span className="action-cancel" onClick={handleCancel}>Cancel</span> </div> </>) : (<> <div className="review-comment">{review.review_text || 'Customer comment review'}</div> <div className="review-timestamp">{moment(review.created_at).fromNow()}</div> {isCurrentUserReview && ( <div className="review-actions"> <span className="action-edit" onClick={handleEdit}>Edit</span> <span className="action-delete" onClick={handleDelete}>Delete</span> </div> )} </>)} </div> {!isEditing && <div className="review-rating">{renderStars(review.rating)}</div>} </div> </div>
    );
};


const ProductInfo = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
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
    const { fetchCartCount } = useCart();
    const currentUserId = getCurrentUserId();

    const API_BASE_URL = "http://localhost:8000/api";

    const showNotification = useCallback((message, type = 'success', duration = 3000) => {
        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
        setNotification({ message, type });
        notificationTimeoutRef.current = setTimeout(() => { setNotification({ message: '', type: '' }); notificationTimeoutRef.current = null; }, duration);
    }, []);

    const fetchProductReviews = useCallback(async () => {
        if (!productId) return;
        setReviewsLoading(true); setReviewsError('');
        try {
            const response = await Axios.get(`${API_BASE_URL}/reviews?product_id=${productId}`);
            if (Array.isArray(response.data)) {
                setProductReviews(response.data);
                setShowAllReviews(response.data.length <= 3);
                setVisibleReviews(3);
            } else { throw new Error("Invalid review data format"); }
        } catch (err) {
            setReviewsError(`Failed to load reviews. ${err.response?.data?.message || err.message}`);
            setProductReviews([]);
        } finally { setReviewsLoading(false); }
    }, [productId, API_BASE_URL]);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    useEffect(() => {
        const fetchProductAndReviews = async () => {
            setLoading(true); setError('');
            setReviewsLoading(true); setReviewsError('');
            setQuantity(1);
            try {
                const productResponse = await Axios.get(`${API_BASE_URL}/products/${productId}`);
                if (!productResponse.data || typeof productResponse.data.stock === 'undefined' || typeof productResponse.data.average_rating === 'undefined' || typeof productResponse.data.review_count === 'undefined') {
                    console.error("Backend response missing expected properties (stock, average_rating, review_count):", productResponse.data);
                    throw new Error("Product data incomplete from server.");
                }
                setProduct(productResponse.data);
                await fetchProductReviews();
            } catch (err) {
                setError(`Failed to load product details. ${err.response?.data?.message || err.message}`);
                setProduct(null);
                setProductReviews([]);
                setReviewsError('Could not load reviews.');
                setReviewsLoading(false);
            } finally {
                setLoading(false);
            }
        };
        fetchProductAndReviews();
    }, [productId, fetchProductReviews, API_BASE_URL]);

    useEffect(() => { return () => { if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current); }; }, []);

    const handleDecrement = () => { if (quantity > 1) setQuantity(quantity - 1); };

    const handleIncrement = () => {
        if (product && product.stock > 0 && quantity < product.stock) {
            setQuantity(quantity + 1);
        } else if (product && product.stock > 0 && quantity >= product.stock) {
            showNotification(`Maximum stock (${product.stock}) reached.`, 'error', 2000);
        }
    };

    const handleRating = (index, e) => { setRating(index + 1); };
    const handleCommentChange = (e) => { setComment(e.target.value); };

    const handlePostReview = async () => {
        if (!comment.trim() || rating <= 0 || !product || isPostingReview) { showNotification("Please provide both a rating and a comment.", "error"); return; }
        setIsPostingReview(true); setError('');
        try {
            const profileId = getCurrentUserId();
            if (!profileId) throw new Error("User not logged in.");
            const reviewData = { product_id: product.id, profile_id: profileId, rating: rating, review_text: comment.trim() };
            await Axios.post(`${API_BASE_URL}/reviews`, reviewData);
            showNotification("Review submitted successfully!", "success");
            setComment(""); setRating(0);
            const productResponse = await Axios.get(`${API_BASE_URL}/products/${productId}`);
            setProduct(productResponse.data);
            fetchProductReviews();
        } catch (err) {
            const errorMsg = `Failed to submit review. ${err.response?.data?.message || err.message}`;
            showNotification(errorMsg, "error", 4000); setError(errorMsg);
        } finally { setIsPostingReview(false); }
    };

    const handleEditReview = async (reviewId, updatedComment, updatedRating) => {
        try {
            const reviewData = { review_text: updatedComment, rating: updatedRating };
            await Axios.put(`${API_BASE_URL}/reviews/${reviewId}`, reviewData);
            showNotification("Review updated successfully!", "success");
             const productResponse = await Axios.get(`${API_BASE_URL}/products/${productId}`);
             setProduct(productResponse.data);
            fetchProductReviews();
        } catch (err) {
            const errorMsg = `Failed to update review. ${err.response?.data?.message || err.message}`;
            showNotification(errorMsg, "error", 4000);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        try {
            await Axios.delete(`${API_BASE_URL}/reviews/${reviewId}`);
            showNotification("Review deleted successfully!", "success");
            const productResponse = await Axios.get(`${API_BASE_URL}/products/${productId}`);
            setProduct(productResponse.data);
            fetchProductReviews();
        } catch (err) {
            const errorMsg = `Failed to delete review. ${err.response?.data?.message || err.message}`;
            showNotification(errorMsg, "error", 4000);
        }
    };

    const toggleReviews = () => {
        setShowAllReviews(!showAllReviews);
        setVisibleReviews(showAllReviews ? 3 : productReviews.length);
    };

    const handleOrderNow = () => {
        if (product && product.stock > 0) {
            const itemToCheckout = { id: `direct-${product.id}-${Date.now()}`, quantity: quantity, product: { id: product.id, product_name: product.product_name, price: product.price, image_url: product.image_url, description: product.description } };
            navigate('/customer/payment-confirmation', { state: { itemsToCheckout: [itemToCheckout] } });
        } else { showNotification("Sorry, this item is currently out of stock.", "error"); }
   };

    const handleAddToCart = async () => {
        if (!product || isAddingToCart || product.stock <= 0) return;
        setIsAddingToCart(true); setError('');
        try {
            const profileId = getCurrentUserId();
            if (!profileId) throw new Error("User not logged in.");
            if (quantity > product.stock) { showNotification(`Only ${product.stock} items available.`, 'error'); setQuantity(product.stock); setIsAddingToCart(false); return; }
            await Axios.post(`${API_BASE_URL}/cart`, { productId: product.id, quantity: quantity, profileId: profileId });
            showNotification(`${quantity} ${product.product_name}(s) added to cart!`, 'success');
            fetchCartCount();
        } catch (err) {
            const errorMsg = `Failed to add item. ${err.response?.data?.message || err.message}`;
            showNotification(errorMsg, 'error', 4000); setError(errorMsg);
        } finally { setIsAddingToCart(false); }
    };

    const relatedProducts = [/* ... */];

    if (loading) return <p>Loading product details...</p>;
    if (error && !product) return <p className="error-message">{error}</p>;
    if (!product) return <p>Product not found.</p>;

    const isOutOfStock = product.stock <= 0;
    const averageRating = parseFloat(product.average_rating) || 0;
    const fullStars = Math.floor(averageRating);

    return (
        <div className="product-info">
            <Notification message={notification.message} type={notification.type}/>
            <div className="product-navigation"><Link to="/customer/products" className="back-link">← Back</Link></div>
            <div className="product-header"></div>
            <div className="product-content">
                <div className="product-image-wrapper"><img src={product.image_url || '/images/placeholder.svg'} alt={product.product_name} className="product-image"/></div>
                <div className="product-details-container">
                    <div className="product-details">
                        <div className="product-title-container"><h1>{product.product_name}</h1><FaHeart className="heart-icon" size={20} /></div>
                        <p className="product-price">₱{product.price}</p>

                        {/* --- STOCK DISPLAY MODIFIED --- */}
                        <div className={`product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                            {isOutOfStock ? 'Out of Stock' : `${product.stock} stocks`}
                        </div>
                        {/* --- /STOCK DISPLAY MODIFIED --- */}

                        <div className="product-rating">
                             <div className="rating-stars">
                                 {Array.from({ length: 5 }, (_, i) => (
                                     <FaStar key={i} className={i < fullStars ? "star-filled" : "star-empty"} size={20} />
                                 ))}
                             </div>
                             <span className="rating-value">{averageRating.toFixed(1)}</span>
                             <span className="rating-number">({product.review_count} {product.review_count === 1 ? 'review' : 'reviews'})</span>
                         </div>

                        <div className="product-quantity"> <button onClick={handleDecrement} disabled={isOutOfStock}>-</button> <span>{isOutOfStock ? 0 : quantity}</span> <button onClick={handleIncrement} disabled={isOutOfStock}>+</button> </div>
                        <h2>Description</h2><p className="product-description">{product.description || '-'}</p>
                        <div className="product-actions"> <button className="order-button" onClick={handleOrderNow} disabled={isOutOfStock}>Order Now</button> <button className="cart-button" onClick={handleAddToCart} disabled={isAddingToCart || isOutOfStock}> {isAddingToCart ? 'Adding...' : 'Add to Cart'} </button> </div>
                        {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                    </div>
                </div>
            </div>
            <div className="reviews-section">
                 <h2>Reviews</h2>
                 <div className="add-review"><p>Add a review</p><p>Share your thoughts on this product.</p>
                     <div className="rating-stars">{Array.from({ length: 5 }, (_, i) => (<FaStar key={i} className={i<Math.floor(rating)?"star-filled":"star-empty"} size={24} onClick={(e)=>handleRating(i,e)}/>))}<span className="rating-value">({Math.floor(rating)})</span></div>
                     <div className="comment-box">
                         <input type="text" value={comment} onChange={handleCommentChange} placeholder="Write your review here..." className="comment-input" disabled={isPostingReview}/>
                         <button className="post-review" onClick={handlePostReview} disabled={isPostingReview}> {isPostingReview ? 'Posting...' : 'Post It!'} </button>
                     </div>
                 </div>
                 {reviewsLoading && <p>Loading reviews...</p>}
                 {reviewsError && <p style={{ color: 'red' }}>{reviewsError}</p>}
                 {!reviewsLoading && !reviewsError && productReviews.length === 0 && (<p>No reviews yet. Be the first!</p> )}
                 {!reviewsLoading && !reviewsError && productReviews.length > 0 && (
                     <>
                         <div className="comments-header">{productReviews.length} comments</div>
                         {productReviews.slice(0, visibleReviews).map(review => ( <ReviewItem key={review.id} review={review} currentUserId={currentUserId} onEdit={handleEditReview} onDelete={handleDeleteReview} /> ))}
                         {productReviews.length > 3 && ( <button className="load-more-button" onClick={toggleReviews}> {showAllReviews ? 'View less' : 'View more'} </button> )}
                     </>
                 )}
             </div>
             <div className="related-products">
                 <h2>You may also like</h2>
                 {/* Related products rendering */}
            </div>
        </div>
    );
};

export default ProductInfo;