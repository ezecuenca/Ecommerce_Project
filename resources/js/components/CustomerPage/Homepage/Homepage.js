import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Homepage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
    const totalSlides = 3;
    const totalReviewSlides = 1;

    const slides = [
        { 
            id: 1, 
            image: "/images/placeholder1.jpg", 
            title: "Timeless Elegance", 
            description: "Explore the refined beauty of Watchdogs’ finest timepieces." 
        },
        { 
            id: 2, 
            image: "/images/placeholder2.jpg", 
            title: "Precision in Style", 
            description: "Unveil the sophistication of the iconic Watchdogs collection." 
        },
        { 
            id: 3, 
            image: "/images/placeholder3.jpg", 
            title: "Legacy of Excellence", 
            description: "Admire the timeless appeal of Watchdogs watches." 
        },
    ];

    const reviews = [
        {
            id: 1,
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam scelerisque posuere vivamus egestas porttitor. Hendrerit vitae at nulla varius morbi. Proin ipsum. Purus augue in morbi.",
            author: "Cha Ji-Hun",
            subtitle: "Amet phasellus interdum."
        },
        {
            id: 2,
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam scelerisque posuere vivamus egestas porttitor. Hendrerit vitae at nulla varius morbi. Proin ipsum. Purus augue in morbi.",
            author: "Cha Ji-Hun",
            subtitle: "Amet phasellus interdum."
        },
        {
            id: 3,
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam scelerisque posuere vivamus egestas porttitor. Hendrerit vitae at nulla varius morbi. Proin ipsum. Purus augue in morbi.",
            author: "Cha Ji-Hun",
            subtitle: "Amet phasellus interdum."
        },
    ];

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

    const [popularProducts, setPopularProducts] = useState([]);
    const [showImages, setShowImages] = useState(false);

    const addPopularData = (products) => {
        setPopularProducts(products.map((product, index) => ({
            ...product,
            id: index + 1,
        })));
    };

    useEffect(() => {
        const mockData = [
            { name: "Leather-Band Watch - SWM002", price: "$250", image: "/images/watch2.jpg", link: "/customer/products/SWM-002" },
            { name: "Leather-Band Watch - SWM003", price: "$300", image: "/images/watch3.jpg", link: "/customer/products/SWM-003" },
            { name: "Leather-Band Watch - SWM004", price: "$280", image: "/images/watch4.jpg", link: "/customer/products/SWM-004" },
        ];
        addPopularData(mockData);
    }, []);

    const toggleImages = () => {
        setShowImages(!showImages);
    };

    return (
        <div className="homepage-content">
            <section className="hero-section" style={{ backgroundImage: "url('/images/watch1.jpg')" }}>
                <div className="hero-text">
                    <h1>
                        BROWSE OUR <br /> PRODUCTS
                    </h1>
                    <Link to="/customer/products" className="discover-button">
                        Discover
                    </Link>
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
                    {popularProducts.map((product) => (
                        <div key={product.id} className="product-card">
                            <div className="product-image-wrapper">
                                {showImages && product.image && (
                                    <img src={product.image} alt={product.name} className="product-image" />
                                )}
                            </div>
                            <div className="product-info">
                                <span>{product.name}</span>
                                <span className="price-box">{product.price}</span>
                            </div>
                            <Link to={product.link} className="order-button">
                                Order Now
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            <section className="reviews-section">
                <h3 className="reviews-subtitle">Reviews</h3>
                <h2>What’s our customer say?</h2>
                <div className="review-carousel">
                    <button className="review-arrow left-arrow" onClick={prevReviewSlide}>
                        ←
                    </button>
                    <div className="review-slides">
                        <div
                            className={`review-slide ${currentReviewSlide === 0 ? "active" : ""}`}
                            style={{ transform: `translateX(0)` }}
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
                    <button className="review-arrow right-arrow" onClick={nextReviewSlide}>
                        →
                    </button>
                </div>
            </section>

            <section className="image-gallery-section">
                <div className="image-gallery">
                    <div className="image-card">
                        <img src="/images/Wrapper1.jpg" alt="Wrapper 1" className="gallery-image" />
                    </div>
                    <div className="image-card">
                        <img src="/images/Wrapper2.jpg" alt="Wrapper 2" className="gallery-image" />
                    </div>
                    <div className="image-card">
                        <img src="/images/Wrapper3.jpg" alt="Wrapper 3" className="gallery-image" />
                    </div>
                    <div className="image-card">
                        <img src="/images/Wrapper4.jpg" alt="Wrapper 4" className="gallery-image" />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Homepage;