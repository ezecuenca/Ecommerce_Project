import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

const Homepage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
    const totalSlides = 3;
    const totalReviewSlides = 1;

    const navigate = useNavigate();

    const slides = [
        { id: 1, image: "/images/placeholder1.jpg", title: "Timeless Elegance", description: "Explore the refined beauty of Watchdogs’ finest timepieces." },
        { id: 2, image: "/images/placeholder2.jpg", title: "Precision in Style", description: "Unveil the sophistication of the iconic Watchdogs collection." },
        { id: 3, image: "/images/watch1.jpg", title: "Legacy of Excellence", description: "Admire the timeless appeal of Watchdogs watches." },
    ];

    const reviews = [
        { id: 1, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...", author: "Cha Ji-Hun", subtitle: "Amet phasellus interdum." },
        { id: 2, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...", author: "Cha Ji-Hun", subtitle: "Amet phasellus interdum." },
        { id: 3, text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...", author: "Cha Ji-Hun", subtitle: "Amet phasellus interdum." },
    ];

    const [popularProducts, setPopularProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPopularProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('/api/products');

                console.log("API Response Data:", response.data); // Log the response to check its structure

                // Check if the response data is directly an array
                // Or if the array is nested (e.g., in response.data.data for Laravel)
                let productsArray = [];
                if (Array.isArray(response.data)) {
                    productsArray = response.data;
                } else if (response.data && Array.isArray(response.data.data)) {
                     // Common structure for APIs built with frameworks like Laravel
                    productsArray = response.data.data;
                } else {
                     // If it's neither, log an error and set an empty array
                     console.error("Received data is not an array or expected structure:", response.data);
                     setError("Unexpected data format received from server.");
                }

                // Now slice the confirmed array
                setPopularProducts(productsArray.slice(0, 3));

            } catch (err) {
                console.error("Error fetching popular products:", err);
                // Check if the error response itself contains useful info
                if (err.response && err.response.data) {
                    console.error("API Error Response:", err.response.data);
                }
                setError(`Failed to load products: ${err.message || 'Please try again later.'}`);
                setPopularProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPopularProducts();
    }, []);

    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
        }, 5000);
        return () => clearInterval(slideInterval);
    }, [totalSlides]);

    useEffect(() => {
        const reviewInterval = setInterval(() => {
            setCurrentReviewSlide((prevSlide) => (prevSlide + 1) % totalReviewSlides);
        }, 5000);
        return () => clearInterval(reviewInterval);
    }, [totalReviewSlides]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const prevReviewSlide = () => {
        setCurrentReviewSlide((prevSlide) => (prevSlide - 1 + totalReviewSlides) % totalReviewSlides);
    };

    const nextReviewSlide = () => {
        setCurrentReviewSlide((prevSlide) => (prevSlide + 1) % totalReviewSlides);
    };

    const handleOrderNow = (product, event) => {
        event.preventDefault();
        event.stopPropagation();
        navigate('/customer/payment-confirmation', { state: { product, quantity: 1 } });
    };

    return (
        <div className="homepage-content">
            <section className="hero-section" style={{ backgroundImage: "url('/images/placeholder.jpg')" }}>
                <div className="hero-text">
                    <h1>BROWSE OUR <br /> PRODUCTS</h1>
                    <Link to="/customer/products" className="discover-button">Discover</Link>
                </div>
            </section>

            <section className="placeholder-section">
                <div className="carousel">
                     <div className="carousel-slides">
                        {slides.map((slide, index) => (
                            <div
                                key={slide.id}
                                className={`carousel-slide ${index === currentSlide ? "active" : ""}`}
                                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                            >
                                <div
                                    className="placeholder-card"
                                    style={{ backgroundImage: `url(${slide.image})` }}
                                >
                                    <h2>{slide.title}</h2>
                                    <p>{slide.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="carousel-dots">
                    {slides.map((_, index) => (
                        <span
                            key={index}
                            className={`dot ${index === currentSlide ? "active" : ""}`}
                            onClick={() => goToSlide(index)}
                        ></span>
                    ))}
                </div>
            </section>

            <section className="popular-section">
                <h2>Most Popular</h2>
                <h3 className="popular-subtitle">Our Exclusive Watch</h3>
                <div className="popular-products">
                    {loading && <p>Loading products...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {!loading && !error && popularProducts.map((product) => (
                        <Link to={`/customer/products/${product.id}`} key={product.id} className="product-card">
                            <div className="product-image-wrapper">
                                <img
                                    src={product.image_url}
                                    alt={product.product_name}
                                    className="product-image"
                                    onError={(e) => { e.target.onerror = null; e.target.src="/images/image-placeholder.png" }}
                                 />
                            </div>
                            <div className="product-info">
                                <span>{product.product_name}</span>
                                <span className="price-box">₱{parseFloat(product.price).toFixed(2)}</span>
                            </div>
                            <button
                                className="order-button"
                                onClick={(event) => handleOrderNow(product, event)}
                            >
                                Order Now
                            </button>
                        </Link>
                    ))}
                    {!loading && !error && popularProducts.length === 0 && <p>No popular products found.</p>}
                </div>
            </section>

            <section className="reviews-section">
                 <h3 className="reviews-subtitle">Reviews</h3>
                 <h2>What’s our customer say?</h2>
                 <div className="review-carousel">
                     <button className="review-arrow left-arrow" onClick={prevReviewSlide}>←</button>
                     <div className="review-slides">
                         <div
                            className={`review-slide active`}
                            style={{ transform: `translateX(-${currentReviewSlide * 100}%)` }}
                         >
                             {reviews.map((review) => (
                                 <div key={review.id} className="review-card">
                                     <p>{review.text}</p>
                                     <div className="review-author">
                                         <span className="profile-icon">👤</span>
                                         <div className="author-info">
                                             <p className="author-name">{review.author}</p>
                                             <p className="author-subtitle">{review.subtitle}</p>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                     <button className="review-arrow right-arrow" onClick={nextReviewSlide}>→</button>
                 </div>
            </section>

            <section className="image-gallery-section">
                 <div className="image-gallery">
                     <div className="image-card"><img src="/images/Wrapper1.jpg" alt="Wrapper 1" className="gallery-image" /></div>
                     <div className="image-card"><img src="/images/Wrapper2.jpg" alt="Wrapper 2" className="gallery-image" /></div>
                     <div className="image-card"><img src="/images/Wrapper3.jpg" alt="Wrapper 3" className="gallery-image" /></div>
                     <div className="image-card"><img src="/images/Wrapper4.jpg" alt="Wrapper 4" className="gallery-image" /></div>
                 </div>
            </section>
        </div>
    );
};

export default Homepage;