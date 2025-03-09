import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaArrowLeft, FaArrowRight, FaSearch } from "react-icons/fa";

const Products = () => {
    console.log("Products component rendered");

    const [placeholderSlide, setPlaceholderSlide] = useState(0);
    const totalPlaceholderSlides = 3;

    const placeholderSlides = [
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

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderSlide((prevSlide) => (prevSlide + 1) % totalPlaceholderSlides);
        }, 5000);
        return () => clearInterval(interval);
    }, [totalPlaceholderSlides]);

    const goToPlaceholderSlide = (index) => {
        setPlaceholderSlide(index);
    };

    const [visibleProducts, setVisibleProducts] = useState({
        MEN: 4, 
        WOMEN: 4,
        UNISEX: 4,
    });

    const [isExpanded, setIsExpanded] = useState({
        MEN: false,
        WOMEN: false,
        UNISEX: false,
    });

    const categories = [
        {
            name: "MEN",
            products: [
                { id: 1, productId: "SWM-001", name: "Leather-Band Watch - SIM6603", price: "$20.99", image: "/images/watch1.jpg", rating: 5, reviews: 120 },
                { id: 2, productId: "SWM-002", name: "Product Name", price: "$20.99", image: "/images/watch2.jpg", rating: 5, reviews: 120 },
                { id: 3, productId: "SWM-003", name: "Product Name", price: "$20.99", image: "/images/watch3.jpg", rating: 5, reviews: 120 },
                { id: 4, productId: "SWM-004", name: "Product Name", price: "$20.99", image: "/images/watch4.jpg", rating: 5, reviews: 120 },
                { id: 5, productId: "SWM-005", name: "Leather-Band Watch - SIM6603", price: "$20.99", image: "/images/watch5.jpg", rating: 5, reviews: 120 },
                { id: 6, productId: "SWM-006", name: "Product Name", price: "$20.99", image: "/images/watch6.jpg", rating: 5, reviews: 120 },
            ],
        },
        {
            name: "WOMEN",
            products: [
                { id: 7, productId: "SWM-007", name: "Leather-Band Watch - SIM6603", price: "$20.99", image: "/images/watch7.jpg", rating: 5, reviews: 120 },
                { id: 8, productId: "SWM-008", name: "Product Name", price: "$20.99", image: "/images/watch8.jpg", rating: 5, reviews: 120 },
                { id: 9, productId: "SWM-009", name: "Product Name", price: "$20.99", image: "/images/watch9.jpg", rating: 5, reviews: 120 },
                { id: 10, productId: "SWM-010", name: "Product Name", price: "$20.99", image: "/images/watch10.jpg", rating: 5, reviews: 120 },
                { id: 11, productId: "SWM-011", name: "Leather-Band Watch - SIM6603", price: "$20.99", image: "/images/watch11.jpg", rating: 5, reviews: 120 },
                { id: 12, productId: "SWM-012", name: "Product Name", price: "$20.99", image: "/images/watch12.jpg", rating: 5, reviews: 120 },
            ],
        },
        {
            name: "UNISEX",
            products: [
                { id: 13, productId: "SWM-013", name: "Leather-Band Watch - SIM6603", price: "$20.99", image: "/images/watch13.jpg", rating: 5, reviews: 120 },
                { id: 14, productId: "SWM-014", name: "Product Name", price: "$20.99", image: "/images/watch14.jpg", rating: 5, reviews: 120 },
                { id: 15, productId: "SWM-015", name: "Product Name", price: "$20.99", image: "/images/watch15.jpg", rating: 5, reviews: 120 },
                { id: 16, productId: "SWM-016", name: "Product Name", price: "$20.99", image: "/images/watch16.jpg", rating: 5, reviews: 120 },
                { id: 17, productId: "SWM-017", name: "Leather-Band Watch - SIM6603", price: "$20.99", image: "/images/watch17.jpg", rating: 5, reviews: 120 },
                { id: 18, productId: "SWM-018", name: "Product Name", price: "$20.99", image: "/images/watch18.jpg", rating: 5, reviews: 120 },
            ],
        },
    ];

    const handleToggleView = (categoryName) => {
        setIsExpanded((prev) => {
            const newExpanded = !prev[categoryName];
            setVisibleProducts((prevVisible) => {
                const category = categories.find(cat => cat.name === categoryName);
                return {
                    ...prevVisible,
                    [categoryName]: newExpanded ? category.products.length : 4,
                };
            });
            return {
                ...prev,
                [categoryName]: newExpanded,
            };
        });
    };

    return (
        <div className="products-content">
            <div className="search-filter-section">
                <div className="search-bar-container">
                    <FaSearch className="search-icon" />
                    <input type="text" placeholder="Search for anything..." className="search-bar" />
                </div>
                <button className="filter-button">Filter</button>
            </div>

            <section className="placeholder-section">
                <div className="carousel">
                    <div className="carousel-slides">
                        {placeholderSlides.map((slide, index) => (
                            <div
                                key={slide.id}
                                className={`carousel-slide ${index === placeholderSlide ? "active" : ""}`}
                                style={{ transform: `translateX(-${placeholderSlide * 100}%)` }}
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
                    {placeholderSlides.map((_, index) => (
                        <span
                            key={index}
                            className={`dot ${index === placeholderSlide ? "active" : ""}`}
                            onClick={() => goToPlaceholderSlide(index)}
                        ></span>
                    ))}
                </div>
            </section>

            {categories.map((category) => {
                const totalProducts = category.products.length;
                const visibleCount = Math.min(visibleProducts[category.name], totalProducts);

                return (
                    <section key={category.name} className="category-section">
                        <div className="carousel-controls">
                            <h2>{category.name}</h2>
                            <div className="arrow-buttons">
                                <button 
                                    className="carousel-prev" 
                                    disabled={true}
                                >
                                    <FaArrowLeft />
                                </button>
                                <button 
                                    className="carousel-next" 
                                    disabled={true}
                                >
                                    <FaArrowRight />
                                </button>
                            </div>
                        </div>
                        <div className="product-grid">
                            {category.products.map((product, index) => (
                                <Link 
                                    to={`/customer/products/${product.productId}`} 
                                    key={product.id} 
                                    className="product-link"
                                >
                                    <div 
                                        className={`product-card ${index < visibleCount ? '' : 'hidden'}`}
                                    >
                                        <div className="product-image-wrapper">
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
                                                        className={i < product.rating ? "star-filled" : "star-empty"}
                                                        size={14}
                                                    />
                                                ))}
                                                <span>({product.reviews})</span>
                                            </div>
                                            <button className="add-to-cart">
                                                <span className="cart-icon">🛒</span>
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {totalProducts > 4 && (
                            <div className="view-more-container">
                                <button 
                                    className="view-more-button" 
                                    onClick={() => handleToggleView(category.name)}
                                >
                                    {isExpanded[category.name] ? "View Less" : "View More"}
                                </button>
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
    );
};

export default Products;