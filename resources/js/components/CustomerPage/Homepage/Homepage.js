import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios'; // Use axios for public routes
import { FaSpinner } from "react-icons/fa"; // For loading indicators

// --- Loading Component (Example) ---
const LoadingIndicator = ({ message = "Loading..." }) => (
    <div style={{ padding: '20px', textAlign: 'center', minHeight: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>{message} <FaSpinner className="spinner" /></p>
    </div>
);

const Homepage = () => {
    // --- State for Carousels ---
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentReviewSlide, setCurrentReviewSlide] = useState(0); // Still needed if you keep carousel structure
    const totalSlides = 3; // For placeholder carousel

    // --- Navigation Hook ---
    const navigate = useNavigate();

    // --- Static Data (Placeholders/Image Gallery) ---
    const slides = [
        { id: 1, image: "/images/placeholder1.jpg", title: "Timeless Elegance", description: "Explore the refined beauty of Watchdogs’ finest timepieces." },
        { id: 2, image: "/images/placeholder2.jpg", title: "Precision in Style", description: "Unveil the sophistication of the iconic Watchdogs collection." },
        { id: 3, image: "/images/watch1.jpg", title: "Legacy of Excellence", description: "Admire the timeless appeal of Watchdogs watches." },
    ];
    // REMOVED static reviews array

    // --- State for Fetched Data ---
    const [popularProducts, setPopularProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [errorProducts, setErrorProducts] = useState(null);

    const [fetchedReviews, setFetchedReviews] = useState([]); // State for fetched reviews
    const [loadingReviews, setLoadingReviews] = useState(true); // Loading state for reviews
    const [errorReviews, setErrorReviews] = useState(null); // Error state for reviews

    // Define API base if needed, or use relative paths if proxy is set
    const API_BASE_URL = "/api"; // Example if using proxy

    // --- Fetch Popular Products ---
    useEffect(() => {
        const fetchPopularProducts = async () => {
            setLoadingProducts(true); setErrorProducts(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/products`); // Use base URL
                let productsArray = [];
                if (Array.isArray(response.data)) { productsArray = response.data; }
                else if (response.data && Array.isArray(response.data.data)) { productsArray = response.data.data; }
                else { throw new Error("Unexpected product data format"); }
                setPopularProducts(productsArray.slice(0, 3)); // Get top 3
            } catch (err) {
                console.error("Error fetching popular products:", err);
                setErrorProducts(`Failed to load products: ${err.message || 'Please try again later.'}`);
                setPopularProducts([]);
            } finally { setLoadingProducts(false); }
        };
        fetchPopularProducts();
    }, []); // Fetch only on mount

    // --- Fetch Reviews ---
    const fetchReviews = useCallback(async () => {
        setLoadingReviews(true); setErrorReviews(null);
        try {
            // Fetch reviews (assuming GET /api/reviews returns active reviews)
            const response = await axios.get(`${API_BASE_URL}/reviews`);
            console.log("Fetched Reviews Data:", response.data); // DEBUG

            // Assuming the controller returns the formatted array directly now
            if (Array.isArray(response.data)) {
                 // Limit the number displayed on the homepage if desired
                 setFetchedReviews(response.data.slice(0, 6)); // Example: Show up to 6 reviews
            } else {
                console.error("Reviews API did not return an array:", response.data);
                throw new Error("Unexpected review data format");
            }
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setErrorReviews(`Failed to load reviews: ${err.message || 'Please try again later.'}`);
            setFetchedReviews([]);
        } finally { setLoadingReviews(false); }
    }, []); // Empty dependencies - fetch on mount

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);


    // --- Carousel Effects ---
    useEffect(() => { const slideInterval = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % totalSlides); }, 5000); return () => clearInterval(slideInterval); }, [totalSlides]);
    // Review carousel logic might need adjustment based on how many reviews you fetch/display
    const reviewsToShowPerSlide = 3; // Example: Show 3 reviews at a time
    const totalReviewSlides = Math.ceil(fetchedReviews.length / reviewsToShowPerSlide);

    useEffect(() => {
        if (totalReviewSlides > 1) { // Only interval if there's more than one slide
             const reviewInterval = setInterval(() => { setCurrentReviewSlide((prev) => (prev + 1) % totalReviewSlides); }, 7000);
             return () => clearInterval(reviewInterval);
         }
    }, [totalReviewSlides]);

    const goToSlide = (index) => { setCurrentSlide(index); };
    const prevReviewSlide = () => { setCurrentReviewSlide((prev) => (prev - 1 + totalReviewSlides) % totalReviewSlides); };
    const nextReviewSlide = () => { setCurrentReviewSlide((prev) => (prev + 1) % totalReviewSlides); };


    // --- Order Now Handler (Corrected version) ---
    const handleOrderNow = (product, event) => {
        event.preventDefault(); event.stopPropagation();
        if (!product || !product.id) { console.error("Invalid product data"); return; }
        const itemToCheckout = { id: `direct-${product.id}`, quantity: 1, product: { id: product.id, product_name: product.product_name, price: product.price, image_url: product.image_url }, selected: true };
        navigate('/customer/payment-confirmation', { state: { itemsToCheckout: [itemToCheckout] } });
    };


    // --- Render JSX ---
    return (
        <div className="homepage-content">
            {/* Hero Section */}
            <section className="hero-section" style={{ backgroundImage: "url('/images/placeholder.jpg')" }}>
                <div className="hero-text"><h1>BROWSE OUR <br /> PRODUCTS</h1><Link to="/customer/products" className="discover-button">Discover</Link></div>
            </section>

            {/* Placeholder Carousel Section */}
            <section className="placeholder-section">
                <div className="carousel">
                     <div className="carousel-slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                        {slides.map((slide) => ( <div key={slide.id} className="carousel-slide"> <div className="placeholder-card" style={{ backgroundImage: `url(${slide.image})` }}> <h2>{slide.title}</h2> <p>{slide.description}</p> </div> </div> ))}
                     </div>
                </div>
                <div className="carousel-dots">{slides.map((_, index) => ( <span key={index} className={`dot ${index === currentSlide ? "active" : ""}`} onClick={() => goToSlide(index)}></span> ))}</div>
            </section>

            {/* Popular Products Section */}
            <section className="popular-section">
                <h2>Most Popular</h2>
                <h3 className="popular-subtitle">Our Exclusive Watch</h3>
                <div className="popular-products">
                    {loadingProducts && <LoadingIndicator message="Loading products..." />}
                    {errorProducts && <p style={{ color: 'red' }}>{errorProducts}</p>}
                    {!loadingProducts && !errorProducts && popularProducts.map((product) => (
                        <Link to={`/customer/products/${product.id}`} key={product.id} className="product-card">
                            <div className="product-image-wrapper"> <img src={product.image_url} alt={product.product_name} className="product-image" onError={(e) => { e.target.onerror = null; e.target.src="/images/image-placeholder.png" }} /> </div>
                            <div className="product-info"> <span>{product.product_name}</span> <span className="price-box">₱{parseFloat(product.price).toFixed(2)}</span> </div>
                            <button className="order-button" onClick={(event) => handleOrderNow(product, event)} > Order Now </button>
                        </Link>
                    ))}
                    {!loadingProducts && !errorProducts && popularProducts.length === 0 && <p>No popular products found.</p>}
                </div>
            </section>

            {/* Reviews Section */}
            <section className="reviews-section">
                 <h3 className="reviews-subtitle">Reviews</h3>
                 <h2>What’s our customer say?</h2>

                 {/* Review Loading/Error States */}
                 {loadingReviews && <LoadingIndicator message="Loading reviews..." />}
                 {errorReviews && <p style={{ color: 'red', textAlign: 'center' }}>{errorReviews}</p>}

                 {/* Review Carousel (only render if loaded and no error) */}
                 {!loadingReviews && !errorReviews && fetchedReviews.length > 0 && (
                     <div className="review-carousel">
                         {/* Show arrows only if there's more than one slide */}
                         {totalReviewSlides > 1 && <button className="review-arrow left-arrow" onClick={prevReviewSlide}>←</button>}
                         <div className="review-slides">
                             {/* Map through calculated slides */}
                             {Array.from({ length: totalReviewSlides }).map((_, slideIndex) => (
                                 <div
                                     key={`review-slide-${slideIndex}`}
                                     className={`review-slide ${slideIndex === currentReviewSlide ? "active" : ""}`}
                                     // Apply transform only if multiple slides exist
                                     style={totalReviewSlides > 1 ? { transform: `translateX(-${currentReviewSlide * 100}%)` } : {}}
                                 >
                                     {/* Map OVER THE FETCHED REVIEWS for the current slide */}
                                     {fetchedReviews
                                         .slice(slideIndex * reviewsToShowPerSlide, (slideIndex + 1) * reviewsToShowPerSlide)
                                         .map((review) => (
                                             <div key={review.id} className="review-card">
                                                 {/* Use fetched data */}
                                                 <p>{review.review_text || '"..."'}</p>
                                                 <div className="review-author">
                                                     <span className="profile-icon">👤</span>
                                                     <div className="author-info">
                                                          {/* Access formatted name from profile object */}
                                                         <p className="author-name">{review.profile?.name || 'Anonymous'}</p>
                                                         {/* Subtitle is not typically in review data, remove or adapt */}
                                                         {/* <p className="author-subtitle">{review.subtitle}</p> */}
                                                     </div>
                                                 </div>
                                             </div>
                                     ))}
                                 </div>
                             ))}
                         </div>
                         {totalReviewSlides > 1 && <button className="review-arrow right-arrow" onClick={nextReviewSlide}>→</button>}
                     </div>
                 )}
                 {/* Message if no reviews found after loading */}
                 {!loadingReviews && !errorReviews && fetchedReviews.length === 0 && (
                    <p style={{ textAlign: 'center', marginTop: '20px' }}>No customer reviews yet.</p>
                 )}
            </section>

            {/* Image Gallery Section */}
            <section className="image-gallery-section">
                 <div className="image-gallery">
                     <div className="image-card"><img src="/images/Wrapper1.jpg" alt="Gallery 1" className="gallery-image" /></div>
                     <div className="image-card"><img src="/images/Wrapper2.jpg" alt="Gallery 2" className="gallery-image" /></div>
                     <div className="image-card"><img src="/images/Wrapper3.jpg" alt="Gallery 3" className="gallery-image" /></div>
                     <div className="image-card"><img src="/images/Wrapper4.jpg" alt="Gallery 4" className="gallery-image" /></div>
                 </div>
            </section>
        </div>
    );
};

export default Homepage;