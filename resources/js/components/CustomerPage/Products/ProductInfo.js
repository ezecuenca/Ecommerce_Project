import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { FaStar } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";

const ProductInfo = () => {
    const { productId } = useParams();
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const products = {
        "SWM-001": {
            name: "Leather-Band Watch - SIM6003",
            price: "$20.99",
            image: "/images/watchprod.svg",
            description: [
                "Polished Alloy Case",
                "Japanese EPSON VD78 Quartz Movement",
                "Non-Glare Scratch-Resistant Mineral Crystal",
                "Logo-Engraved Stainless Steel Caseback",
                "Genuine Leather Strap",
                "Logo-Engraved Stainless Steel Clasp",
                "Seconds Sub-Dial",
                "42mm Case Diameter",
                "3ATM Water Resistance",
            ],
            rating: 4.8,
            reviews: [
                { id: 1, name: "Customer Name", comment: "Great watch, love the design!", rating: 5 },
                { id: 2, name: "Customer Name", comment: "Good quality, but strap could be softer.", rating: 4 },
                { id: 3, name: "Customer Name", comment: "Loading comment...", rating: 3 },
            ],
        },
        "SWM-002": {
            name: "Leather-Band Watch - SIM6003",
            price: "$250.99",
            image: "/images/watchprod.svg",
            description: [
                "Japanese EPOCH 076 Quartz movement",
                "Genuine leather strap with stainless steel clasp",
                "Scratch-resistant Sapphire crystal",
                "Water-resistant up to 50 meters",
                "Stainless Steel case",
            ],
            rating: 4.8,
            reviews: [
                { id: 1, name: "Customer Name", comment: "Great watch, love the design!", rating: 5 },
                { id: 2, name: "Customer Name", comment: "Good quality, but strap could be softer.", rating: 4 },
                { id: 3, name: "Customer Name", comment: "Loading comment...", rating: 3 },
            ],
        },
        "SWM-003": {
            name: "Leather-Band Watch - SIM6003",
            price: "$300.99",
            image: "/images/watchprod.svg",
            description: [
                "Japanese EPOCH 076 Quartz movement",
                "Genuine leather strap with stainless steel clasp",
                "Scratch-resistant Sapphire crystal",
                "Water-resistant up to 50 meters",
                "Stainless Steel case",
            ],
            rating: 4.8,
            reviews: [
                { id: 1, name: "Customer Name", comment: "Great watch, love the design!", rating: 5 },
                { id: 2, name: "Customer Name", comment: "Good quality, but strap could be softer.", rating: 4 },
                { id: 3, name: "Customer Name", comment: "It's Alright", rating: 3 },
            ],
        },
    };

    const product = products[productId] || products["SWM-001"];

    const [quantity, setQuantity] = useState(0);
    const [comment, setComment] = useState("");
    const [rating, setRating] = useState(0);
    const [visibleReviews, setVisibleReviews] = useState(2);
    const [showAllReviews, setShowAllReviews] = useState(false);

    const handleDecrement = () => {
        if (quantity > 0) {
            setQuantity(quantity - 1);
        }
    };

    const handleIncrement = () => {
        setQuantity(quantity + 1);
    };

    const handleRating = (index, e) => {
        const star = e.currentTarget;
        const rect = star.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const halfWidth = rect.width / 2;

        let newRating;
        if (clickX < halfWidth) {
            newRating = index + 0.5;
        } else {
            newRating = index + 1.0;
        }
        newRating = Math.min(5.0, Math.max(0.0, newRating));
        setRating(newRating);
    };

    const handleCommentChange = (e) => {
        setComment(e.target.value);
    };

    const handlePostReview = () => {
        if (comment.trim() && rating >= 0) {
            const newReview = {
                id: Date.now(),
                name: "User",
                comment: comment,
                rating: rating,
                timestamp: "about 1 hour ago",
            };
            product.reviews.push(newReview);
            setComment("");
            setRating(0);
            setVisibleReviews(2);
            setShowAllReviews(false);
        }
    };

    const toggleReviews = () => {
        if (showAllReviews) {
            setVisibleReviews(2);
            setShowAllReviews(false);
        } else {
            setVisibleReviews(product.reviews.length);
            setShowAllReviews(true);
        }
    };

    const handleOrderNow = () => {
       
        navigate('/customer/payment-confirmation', { state: { product, quantity } });
    };

    const relatedProducts = [
        { id: "SWM-001", name: "Product Name", price: "$20.99", image: "/images/placeholder.svg", rating: 4.5, reviews: 120 },
        { id: "SWM-002", name: "Product Name", price: "$20.99", image: "/images/placeholder.svg", rating: 4.5, reviews: 120 },
        { id: "SWM-003", name: "Product Name", price: "$20.99", image: "/images/placeholder.svg", rating: 4.5, reviews: 120 },
    ];

    return (
        <div className="product-info">
            <div className="product-navigation">
                <Link to="/customer/products" className="back-link">
                    ← Back
                </Link>
            </div>
            <div className="product-header"></div>
            <div className="product-content">
                <div className="product-image-placeholder" />
                <div className="product-details-container">
                    <div className="product-details">
                        <div className="product-title-container">
                            <h1>{product.name}</h1>
                            <FaHeart className="heart-icon" size={20} />
                        </div>
                        <p className="product-price">{product.price}</p>
                        <div className="product-rating">
                            <div className="rating-stars">
                                {Array.from({ length: 5 }, (_, i) => {
                                    const fullStars = Math.floor(product.rating);
                                    const decimalPart = product.rating - fullStars;

                                    if (i < fullStars) {
                                        return <FaStar key={i} className="star-filled" size={20} />;
                                    } else if (i === fullStars && decimalPart >= 0.5) {
                                        return <FaStar key={i} className="star-half" size={20} />;
                                    } else {
                                        return <FaStar key={i} className="star-empty" size={20} />;
                                    }
                                })}
                            </div>
                            <span className="rating-value">{product.rating.toFixed(1)}</span>
                            <span className="rating-number">(1,873)</span>
                        </div>
                        <div className="product-quantity">
                            <button onClick={handleDecrement}>-</button>
                            <span>{quantity}</span>
                            <button onClick={handleIncrement}>+</button>
                        </div>
                        <h2>Description</h2>
                        <ul className="product-description">
                            {product.description.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                        <div className="product-actions">
                            <button className="order-button" onClick={handleOrderNow}>Order Now</button> {/* Added onClick handler */}
                            <button className="cart-button">Add to Cart</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="reviews-section">
                <h2>Reviews</h2>
                <div className="add-review">
                    <p>Add a review</p>
                    <p>Be the first to give a review. Click to add a review of Watchdogs.</p>
                    <div className="rating-stars">
                        {Array.from({ length: 5 }, (_, i) => {
                            const fullStars = Math.floor(rating);
                            const decimalPart = rating - fullStars;

                            if (i < fullStars) {
                                return <FaStar key={i} className="star-filled" size={24} onClick={(e) => handleRating(i, e)} />;
                            } else if (i === fullStars && decimalPart >= 0.5) {
                                return <FaStar key={i} className="star-half" size={24} onClick={(e) => handleRating(i, e)} />;
                            } else {
                                return <FaStar key={i} className="star-empty" size={24} onClick={(e) => handleRating(i, e)} />;
                            }
                        })}
                        <span className="rating-value">({rating.toFixed(1)})</span>
                    </div>
                    <div className="comment-box">
                        <input
                            type="text"
                            value={comment}
                            onChange={handleCommentChange}
                            placeholder="Share your thoughts"
                            className="comment-input"
                        />
                        <button className="post-review" onClick={handlePostReview}>
                            Post It!
                        </button>
                    </div>
                </div>
                <div className="review-list">
                    <p>{product.reviews.length} comments</p>
                    {product.reviews.slice(0, visibleReviews).map((review) => (
                        <div key={review.id} className="review-item">
                            <div className="review-avatar"></div>
                            <div className="review-content">
                                <div className="review-header">
                                    <p className="review-name">{review.name}</p>
                                    <div className="review-rating">
                                        {Array.from({ length: 5 }, (_, i) => {
                                            const fullStars = Math.floor(review.rating);
                                            const decimalPart = review.rating - fullStars;

                                            if (i < fullStars) {
                                                return <FaStar key={i} className="star-filled" size={16} />;
                                            } else if (i === fullStars && decimalPart >= 0.5) {
                                                return <FaStar key={i} className="star-half" size={16} />;
                                            } else {
                                                return <FaStar key={i} className="star-empty" size={16} />;
                                            }
                                        })}
                                    </div>
                                </div>
                                <p className="review-comment">{review.comment}</p>
                                <div className="review-footer">
                                    <span className="review-timestamp">{review.timestamp || "about 1 hour ago"}</span>
                                    <span className="review-actions">
                                        <span className="action-like">Like</span>
                                        <span className="action-reply">Reply</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {product.reviews.length > 2 && (
                        <button className="toggle-reviews-button" onClick={toggleReviews}>
                            {showAllReviews ? "Close Comments" : "Load More Comments"}
                        </button>
                    )}
                </div>
            </div>
            <div className="related-products">
                <h2>You may also like</h2>
                <div className="related-products-grid">
                    {relatedProducts.map((product) => (
                        <Link
                            to={`/customer/products/${product.id}`}
                            key={product.id}
                            className="related-product-card"
                        >
                            <div className="product-image-wrapper">
                                {/* Removed the <img> tag to keep only the placeholder */}
                            </div>
                            <div className="product-info">
                                <span>{product.name}</span>
                                <span className="price-box">{product.price}</span>
                            </div>
                            <div className="product-reviews">
                                <div className="product-rating">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <FaStar
                                            key={i}
                                            className={i < Math.floor(product.rating) ? "star-filled" : "star-empty"}
                                            size={14}
                                        />
                                    ))}
                                    <span>({product.reviews})</span>
                                </div>
                                <button className="add-to-cart">
                                    <span className="cart-icon">🛒</span>
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductInfo;