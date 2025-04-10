import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaArrowLeft, FaArrowRight, FaSearch } from 'react-icons/fa';
import Axios from 'axios';
import { useCart } from "../ShoppingCart/CartContext";

const getCurrentUserId = () => {
    return 1;
};

const Notification = ({ message, type, onClose }) => {
    if (!message) return null;
    const baseStyle = { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: '5px', color: 'white', zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.2)', };
    const typeStyle = type === 'success' ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#f44336' };
    return (<div style={{ ...baseStyle, ...typeStyle }}>{message}</div>);
};

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleProducts, setVisibleProducts] = useState({});
    const [isExpanded, setIsExpanded] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("");
    const [addingToCart, setAddingToCart] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const notificationTimeoutRef = useRef(null);
    const [placeholderSlide, setPlaceholderSlide] = useState(0);
    const totalPlaceholderSlides = 3;
    const { fetchCartCount } = useCart(); 

    const placeholderSlides = [
        { id: 1, image: "/images/placeholder1.jpg", title: "Timeless Elegance", description: "Explore the refined beauty of Watchdogs’ finest timepieces." },
        { id: 2, image: "/images/placeholder2.jpg", title: "Precision in Style", description: "Unveil the sophistication of the iconic Watchdogs collection." },
        { id: 3, image: "/images/placeholder3.jpg", title: "Legacy of Excellence", description: "Admire the timeless appeal of Watchdogs watches." },
    ];

    useEffect(() => {
        const interval = setInterval(() => { setPlaceholderSlide((prev) => (prev + 1) % totalPlaceholderSlides); }, 5000);
        return () => clearInterval(interval);
    }, [totalPlaceholderSlides]);

    const goToPlaceholderSlide = (index) => { setPlaceholderSlide(index); };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true); setError(null);
                const response = await Axios.get('http://localhost:8000/api/products');
                if (response.data && Array.isArray(response.data.data)) {
                    const initialVisible = {}; const initialExpanded = {};
                    const allCategories = [...new Set(response.data.data.map(p => p.category).filter(Boolean))];
                    allCategories.forEach(cat => { initialVisible[cat] = 4; initialExpanded[cat] = false; });
                    setVisibleProducts(initialVisible); setIsExpanded(initialExpanded); setProducts(response.data.data);
                } else {
                    console.error("Invalid API response format:", response.data); setError("Failed to load products: Invalid API response format."); setProducts([]);
                }
            } catch (err) {
                console.error("Error fetching products:", err); setError(`Failed to load products: ${err.message}`); setProducts([]);
            } finally { setLoading(false); }
        };
        fetchProducts();
    }, []);

    useEffect(() => { return () => { if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current); }; }, []);

    const handleToggleView = (categoryName) => {
        setIsExpanded((prev) => ({ ...prev, [categoryName]: !prev[categoryName] }));
        setVisibleProducts((prev) => ({ ...prev, [categoryName]: !isExpanded[categoryName] ? products.filter(p => p.category === categoryName).length : 4 }));
    };

    const handleSearchChange = (e) => { setSearchQuery(e.target.value); };

    const showNotification = (message, type = 'success', duration = 3000) => {
        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
        setNotification({ message, type });
        notificationTimeoutRef.current = setTimeout(() => { setNotification({ message: '', type: '' }); notificationTimeoutRef.current = null; }, duration);
    };

    const handleAddToCart = async (event, productId, productName) => {
        event.preventDefault(); event.stopPropagation();
        if (addingToCart === productId) return;
        setAddingToCart(productId);
        try {
            const profileId = getCurrentUserId();
            if (!profileId) throw new Error("User not logged in.");
            await Axios.post('http://localhost:8000/api/cart', { productId, quantity: 1, profileId });
            showNotification(`Added ${productName} to cart!`, 'success');
            fetchCartCount(); 
        } catch (err) {
            console.error("Error adding product to cart:", err);
            const errorMsg = `Failed to add item. ${err.response?.data?.message || err.message}`;
            showNotification(errorMsg, 'error', 4000);
        } finally { setAddingToCart(null); }
    };

    const groupedProducts = products.reduce((acc, product) => {
        const category = product.category || "Uncategorized";
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
    }, {});

    const filteredCategories = Object.keys(groupedProducts)
        .filter(category => !selectedCategory || selectedCategory === "ALL" || category === selectedCategory)
        .reduce((obj, key) => {
            if (Array.isArray(groupedProducts[key])) {
                 obj[key] = groupedProducts[key].filter(p => p.product_name && p.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
             } else { obj[key] = []; }
            return obj;
        }, {});

    return (
        <div className="products-content">
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            <section className="placeholder-section">
                 <div className="carousel">
                    <div className="carousel-slides">
                        {placeholderSlides.map((slide, index) => (<div key={slide.id} className={`carousel-slide ${index === placeholderSlide ? "active" : ""}`} style={{ transform: `translateX(-${placeholderSlide * 100}%)` }}><div className="placeholder-card" style={{ backgroundImage: `url(${slide.image})` }}><h2>{slide.title}</h2><p>{slide.description}</p></div></div>))}
                    </div>
                </div>
                <div className="carousel-dots">{placeholderSlides.map((_, index) => (<span key={index} className={`dot ${index === placeholderSlide ? "active" : ""}`} onClick={() => goToPlaceholderSlide(index)}></span>))}</div>
            </section>
            <div className="search-filter-section">
                 <div className="search-bar-container"><FaSearch className="search-icon" /><input type="text" placeholder="Search for anything..." className="search-bar" value={searchQuery} onChange={handleSearchChange} /></div>
                <div className="filter-dropdown"><select className="filter-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}><option value="" disabled>Filter</option><option value="ALL">All Categories</option>{Object.keys(groupedProducts).map(category => (<option key={category} value={category}>{category}</option>))}</select><span className="filter-arrow">▼</span></div>
            </div>
            {loading && <p>Loading products...</p>}
            {error && !loading && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && Object.keys(filteredCategories).map((categoryName) => {
                const productsInCategory = filteredCategories[categoryName];
                const isCatExpanded = isExpanded[categoryName] ?? false;
                const visibleCount = Math.min(isCatExpanded ? productsInCategory.length : (visibleProducts[categoryName] || 4), productsInCategory.length);
                if (productsInCategory.length === 0) return null;
                return (
                    <section key={categoryName} className="category-section">
                        <div className="carousel-controls"><h2>{categoryName}</h2><div className="arrow-buttons"><button className="carousel-prev" disabled={true}><FaArrowLeft /></button><button className="carousel-next" disabled={true}><FaArrowRight /></button></div></div>
                        <div className="product-grid">
                            {productsInCategory.slice(0, visibleCount).map(product => (
                                <Link to={`/customer/products/${product.id}`} key={product.id} className="product-link">
                                    <div className="product-card">
                                        <div className="product-image-wrapper">{product.image_url ? (<img src={product.image_url} alt={product.product_name} className="product-image"/>) : (<div className="product-image placeholder">No Image</div>)}</div>
                                        <div className="product-info"><span>{product.product_name}</span><span className="price-box">₱{product.price}</span></div>
                                        <div className="product-reviews">
                                            <div className="product-rating">{Array.from({ length: 5 }, (_, i) => (<FaStar key={i} className="star-empty" size={14}/>))}<span>({product.reviews || 0})</span></div>
                                            <button className="add-to-cart" onClick={(e) => handleAddToCart(e, product.id, product.product_name)} disabled={addingToCart === product.id}><span className="cart-icon">{addingToCart === product.id ? '...' : '🛒'}</span></button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {productsInCategory.length > 4 && (<div className="view-more-container"><button className="view-more-button" onClick={() => handleToggleView(categoryName)}>{isCatExpanded ? "View Less" : "View More"}</button></div>)}
                    </section>
                );
            })}
             {!loading && !error && Object.keys(filteredCategories).every(cat => filteredCategories[cat].length === 0) && (<p style={{ textAlign: 'center', marginTop: '20px' }}>No products found matching your criteria.</p>)}
        </div>
    );
};
export default Products;