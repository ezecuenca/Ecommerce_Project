import React, { useState, useEffect, useRef, useContext } from "react"; // Import useContext
import { Link } from "react-router-dom";
import { FaStar, FaArrowLeft, FaArrowRight, FaSearch } from 'react-icons/fa';
import Axios from 'axios';
import { useCart } from "../ShoppingCart/CartContext"; // Assuming this path is correct
import { AuthContext } from "../../AuthContext";

// Notification Component (remains the same)
const Notification = ({ message, type, onClose }) => {
    if (!message) return null;
    const baseStyle = {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 25px',
        borderRadius: '8px',
        color: 'white',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        fontSize: '1rem',
        textAlign: 'center',
    };
    const typeStyle = type === 'success' ? { backgroundColor: '#4CAF50' }
                      : type === 'error' ? { backgroundColor: '#f44336' }
                      : { backgroundColor: '#2196F3' };
    return (<div style={{ ...baseStyle, ...typeStyle }}>{message}</div>);
};


const Products = () => {
    // --- State Hooks ---
    const [products, setProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]); // Store unique category names
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleProducts, setVisibleProducts] = useState({});
    const [isExpanded, setIsExpanded] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("ALL"); // Default to show All Categories
    const [addingToCart, setAddingToCart] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const notificationTimeoutRef = useRef(null);
    const [placeholderSlide, setPlaceholderSlide] = useState(0);
    const totalPlaceholderSlides = 3;

    // --- Context Hooks ---
    const { fetchCartCount } = useCart();
    const { user, loading: authLoading } = useContext(AuthContext);

    // Example placeholder slides data (remains the same)
    const placeholderSlides = [
        { id: 1, image: "/images/placeholder1.jpg", title: "Timeless Elegance", description: "Explore the refined beauty of Watchdogs’ finest timepieces." },
        { id: 2, image: "/images/placeholder2.jpg", title: "Precision in Style", description: "Unveil the sophistication of the iconic Watchdogs collection." },
        { id: 3, image: "/images/placeholder3.jpg", title: "Legacy of Excellence", description: "Admire the timeless appeal of Watchdogs watches." },
    ];

    // --- Effects ---

    // Placeholder carousel effect (remains the same)
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderSlide((prev) => (prev + 1) % totalPlaceholderSlides);
        }, 5000);
        return () => clearInterval(interval);
    }, [totalPlaceholderSlides]);

    // Fetch products effect
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await Axios.get('http://localhost:8000/api/products');

                if (response.data && Array.isArray(response.data.data)) {
                    const fetchedProducts = response.data.data;
                    setProducts(fetchedProducts);

                    // Extract unique category names and initialize states
                    const uniqueCategories = [...new Set(fetchedProducts.map(p => p.category?.category_name || "Uncategorized").filter(Boolean))];
                    setAllCategories(uniqueCategories); // Store category names

                    const initialVisible = {};
                    const initialExpanded = {};
                    uniqueCategories.forEach(cat => {
                        initialVisible[cat] = 4;
                        initialExpanded[cat] = false;
                    });
                    setVisibleProducts(initialVisible);
                    setIsExpanded(initialExpanded);

                } else {
                    console.error("Invalid API response format for products:", response.data);
                    setError("Failed to load products: Invalid data format received.");
                    setProducts([]);
                    setAllCategories([]);
                }
            } catch (err) {
                console.error("Error fetching products:", err);
                setError(`Failed to load products. ${err.message}`);
                setProducts([]);
                setAllCategories([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Cleanup notification timeout (remains the same)
    useEffect(() => {
        return () => { if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current); };
    }, []);

    // --- Helper Functions (remain the same) ---
    const goToPlaceholderSlide = (index) => setPlaceholderSlide(index);
    const handleSearchChange = (e) => setSearchQuery(e.target.value);
    const showNotification = (message, type = 'success', duration = 3000) => {
        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
        setNotification({ message, type });
        notificationTimeoutRef.current = setTimeout(() => {
            setNotification({ message: '', type: '' });
            notificationTimeoutRef.current = null;
        }, duration);
    };
    const handleToggleView = (categoryName) => {
         const currentlyExpanded = isExpanded[categoryName] ?? false;
         setIsExpanded((prev) => ({ ...prev, [categoryName]: !currentlyExpanded }));
         setVisibleProducts((prev) => ({
             ...prev,
             [categoryName]: !currentlyExpanded
                 ? products.filter(p => (p.category?.category_name || "Uncategorized") === categoryName).length
                 : 4
         }));
     };


    // --- Add to Cart Handler (remains the same as previous correct version) ---
    const handleAddToCart = async (event, productId, productName) => {
        event.preventDefault();
        event.stopPropagation();
        if (addingToCart === productId) return;

        if (authLoading) {
            showNotification("Checking authentication...", 'info');
            return;
        }
        if (!user) {
            showNotification("Please log in to add items to your cart.", 'error');
            return;
        }
        if (user.role_id !== 2) {
             showNotification("Only customers can add items to the cart.", 'error');
             return;
        }

        setAddingToCart(productId);

        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                showNotification("Authentication error. Please log in again.", 'error');
                setAddingToCart(null); return; // Added early return
            }

            await Axios.post( 'http://localhost:8000/api/cart', { productId: productId, quantity: 1 },
                { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', } }
            );

            showNotification(`Added ${productName} to cart!`, 'success');
            fetchCartCount();

        } catch (err) {
            console.error("Error adding product to cart:", err.response || err.message || err);
            let errorMsg = `Failed to add item.`;
            if (err.response) {
                 errorMsg += ` ${err.response.data?.message || err.response.statusText}`;
                 if(err.response.status === 401) errorMsg += " Please log in again.";
            } else if (err.request) { errorMsg += ` Could not connect to the server.`; }
            else { errorMsg += ` ${err.message}`; }
            showNotification(errorMsg, 'error', 4000);
        } finally {
            setAddingToCart(null);
        }
    };


    // --- Data Processing for Rendering ---

    // 1. Determine which categories should be potentially visible based on the dropdown filter
    const categoriesToDisplay = selectedCategory === "ALL"
        ? allCategories
        : allCategories.filter(cat => cat === selectedCategory);

    // 2. Filter products based *only* on the search query for efficient lookup later
    const searchedProducts = products.filter(p =>
        p.product_name && p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Render JSX ---
    return (
        <div className="products-content">
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />

            {/* Placeholder Carousel Section (remains the same) */}
            <section className="placeholder-section">
                 <div className="carousel">
                     <div className="carousel-slides" style={{ transform: `translateX(-${placeholderSlide * 100}%)` }}>
                         {placeholderSlides.map((slide) => (
                             <div key={slide.id} className="carousel-slide">
                                 <div className="placeholder-card" style={{ backgroundImage: `url(${slide.image})` }}>
                                     <h2>{slide.title}</h2> <p>{slide.description}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
                 <div className="carousel-dots">
                     {placeholderSlides.map((_, index) => (
                         <span key={index} className={`dot ${index === placeholderSlide ? "active" : ""}`} onClick={() => goToPlaceholderSlide(index)}></span>
                     ))}
                 </div>
            </section>

            {/* Search and Filter Section */}
            <div className="search-filter-section">
                <div className="search-bar-container">
                    <FaSearch className="search-icon" />
                    <input type="text" placeholder="Search for products..." className="search-bar" value={searchQuery} onChange={handleSearchChange} />
                </div>
                <div className="filter-dropdown">
                    <select className="filter-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} >
                        <option value="ALL">All Categories</option>
                        {/* Use allCategories state which was populated on fetch */}
                        {allCategories.map(category => ( <option key={category} value={category}>{category}</option> ))}
                    </select>
                    <span className="filter-arrow">▼</span>
                </div>
            </div>

            {/* Product Loading/Error Display */}
            {loading && <p style={{ textAlign: 'center', margin: '20px' }}>Loading products...</p>}
            {error && !loading && <p className="error-message" style={{ color: 'red', textAlign: 'center', margin: '20px' }}>{error}</p>}

            {/* Product Categories and Grids */}
            {/* Iterate through the categories determined by the dropdown filter */}
            {!loading && !error && categoriesToDisplay.map((categoryName) => {
                // Filter the already-searched products for the *current* category being rendered
                const productsInCategoryAfterSearch = searchedProducts.filter(p =>
                    (p.category?.category_name || "Uncategorized") === categoryName
                );

                const totalProductsInOriginalCategory = products.filter(p => (p.category?.category_name || "Uncategorized") === categoryName).length;

                // Determine visibility/expansion based on the state for this category
                const isCatExpanded = isExpanded[categoryName] ?? false;
                const visibleCount = isCatExpanded ? productsInCategoryAfterSearch.length : Math.min(visibleProducts[categoryName] || 4, productsInCategoryAfterSearch.length);

                return (
                    // Always render the category section header
                    <section key={categoryName} className="category-section">
                        <div className="carousel-controls">
                            <h2>{categoryName}</h2>
                            <div className="arrow-buttons">
                                <button className="carousel-prev" disabled={true}><FaArrowLeft /></button>
                                <button className="carousel-next" disabled={true}><FaArrowRight /></button>
                            </div>
                        </div>

                        {/* Conditionally render grid or message based on search results within this category */}
                        {productsInCategoryAfterSearch.length > 0 ? (
                            <>
                                <div className="product-grid">
                                    {productsInCategoryAfterSearch.slice(0, visibleCount).map(product => (
                                        <Link to={`/customer/products/${product.id}`} key={product.id} className="product-link">
                                            <div className="product-card">
                                                <div className="product-image-wrapper">
                                                    {product.image_url ? <img src={product.image_url} alt={product.product_name} className="product-image"/> : <div className="product-image placeholder">No Image</div>}
                                                </div>
                                                <div className="product-info">
                                                    <span className="product-name">{product.product_name}</span>
                                                    <span className="price-box">₱{parseFloat(product.price).toFixed(2)}</span>
                                                </div>
                                                <div className="product-reviews">
                                                    <div className="product-rating">
                                                        {Array.from({ length: 5 }, (_, i) => (<FaStar key={i} className="star-empty" size={14}/>))}
                                                        <span>({product.reviews_count || 0})</span>
                                                    </div>
                                                    <button className="add-to-cart" onClick={(e) => handleAddToCart(e, product.id, product.product_name)} disabled={addingToCart === product.id || authLoading} >
                                                        <span className="cart-icon">{addingToCart === product.id ? '...' : '🛒'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                {/* Show "View More/Less" only if there are search results AND more products exist than initially shown */}
                                {totalProductsInOriginalCategory > 4 && productsInCategoryAfterSearch.length > 0 && (
                                    <div className="view-more-container">
                                        <button className="view-more-button" onClick={() => handleToggleView(categoryName)}>
                                             {/* Adjust text based on visible count vs total matching search */}
                                            {isCatExpanded ? "View Less" : "View More"}
                                        </button>
                                    </div>
                                )}
                             </>
                        ) : (
                            // Render this message if search yielded no results for *this specific category*
                            <p className="no-products-in-category-message" style={{ textAlign: 'center', margin: '10px 0', fontStyle: 'italic', color: '#888' }}>
                                No products found in this category matching your search term.
                            </p>
                        )}
                    </section>
                );
            })}

             {/* Message if NO categories are displayed at all (e.g., filter set to a category with zero products initially, or fetch failed) */}
            {!loading && !error && categoriesToDisplay.length === 0 && allCategories.length > 0 && selectedCategory !== "ALL" && (
                 <p style={{ textAlign: 'center', marginTop: '30px', fontStyle: 'italic', color: '#666' }}>
                    The selected category "{selectedCategory}" currently has no products listed.
                 </p>
            )}
             {/* General 'no products found' if fetch succeeded but products array was empty */}
             {!loading && !error && products.length === 0 && (
                  <p style={{ textAlign: 'center', marginTop: '30px', fontStyle: 'italic', color: '#666' }}>
                     No products are currently available.
                 </p>
             )}
        </div>
    );
};

export default Products;