import React, { useState, useEffect } from "react"; // Import useState and useEffect
import axios from 'axios'; // Import axios
import { FaStar } from "react-icons/fa";

const API_BASE_URL = "http://localhost:8000/api"; // Define your API base URL

const About = () => {
    // --- NEW STATE FOR REVIEWS DATA ---
    const [reviewStats, setReviewStats] = useState({
        average_rating: 0,
        total_reviews: 0,
        rating_counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    });
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);
    const [reviewError, setReviewError] = useState(null);

    // --- USEEFFECT TO FETCH REVIEW STATS ---
    useEffect(() => {
        const fetchReviewStats = async () => {
            setIsLoadingReviews(true);
            setReviewError(null);
            try {
                // Adjust this endpoint to your actual API endpoint for review statistics
                const response = await axios.get(`${API_BASE_URL}/reviews/stats`);
                if (response.data) {
                    setReviewStats({
                        average_rating: parseFloat(response.data.average_rating) || 0,
                        total_reviews: parseInt(response.data.total_reviews) || 0,
                        rating_counts: response.data.rating_counts || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                    });
                }
            } catch (error) {
                console.error("Error fetching review stats:", error);
                setReviewError("Could not load customer review data.");
                // Keep default/empty stats on error
                setReviewStats({
                    average_rating: 0,
                    total_reviews: 0,
                    rating_counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                });
            } finally {
                setIsLoadingReviews(false);
            }
        };

        fetchReviewStats();
    }, []); // Empty dependency array means this runs once on component mount

    // --- Helper to calculate percentage for rating bars ---
    const getRatingPercentage = (ratingValue) => {
        if (reviewStats.total_reviews === 0) return "0%";
        const count = reviewStats.rating_counts[ratingValue] || 0;
        const percentage = (count / reviewStats.total_reviews) * 100;
        return `${Math.round(percentage)}%`;
    };

    // --- Helper to render stars based on average rating ---
    const renderAverageStars = (average) => {
        const fullStars = Math.floor(average);
        const halfStar = average % 1 >= 0.5; // Adjust threshold if needed (e.g. 0.25 for quarter, 0.75 for three-quarter)
        const starsArray = [];

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsArray.push(<FaStar key={`star-${i}`} className="star-filled" size={20} />);
            } else if (i === fullStars && halfStar) {
                // For simplicity, we'll treat a half star as a filled star for now
                // or you can use a different icon for half stars (e.g., FaStarHalfAlt)
                starsArray.push(<FaStar key={`star-${i}`} className="star-filled" size={20} />); // Or your half-star logic
            } else {
                starsArray.push(<FaStar key={`star-${i}`} className="star-empty" size={20} />);
            }
        }
        return starsArray;
    };


    return (
        <div className="about-page">
            <h1 className="about-title">About Us</h1>

            {/* Our Story Section */}
            <section className="our-story-section">
                {/* ... (content remains the same) ... */}
                <div className="image-placeholder"></div>
                <div className="text-content">
                    <h2>Our Story</h2>
                    <p>
                        In a world awash with information, finding truth can feel like an impossible task. That’s where WatchDog comes in. Founded by a group of passionate truth-seekers, we set out with a singular mission: to bring clarity to the chaos of the digital age. We’ve been on this journey since 2015, and over the years, we’ve built a trusted platform that millions rely on to uncover the facts, challenge misinformation, and spark meaningful conversations. Whether it’s diving deep into complex global issues or shedding light on local stories, we’re here to empower our community with knowledge rooted in integrity. Join us as we continue to navigate the ever-evolving landscape of truth with confidence and curiosity.
                    </p>
                </div>
            </section>

            {/* Our Mission Section */}
            <section className="our-mission-section">
                {/* ... (content remains the same) ... */}
                <div className="text-content">
                    <h2>Our Mission</h2>
                    <p>
                        At WatchDog, we’re driven by the power of knowledge to navigate a digital world, both local and global. We’re passionate about supporting individuals and organizations with the latest technology, data analytics, actionable information, and emerging technologies. We aim to empower our community to make informed decisions, spark meaningful conversations, and challenge misinformation. We’re dedicated to delivering the truth with confidence and curiosity, and we’re committed to joining you in our journey to a more informed future.
                    </p>
                </div>
                <div className="image-placeholder"></div>
            </section>

            {/* Customer Reviews Section - MODIFIED */}
            <section className="customer-reviews-section">
                <h2>Customers reviews</h2>
                {isLoadingReviews && <p>Loading reviews...</p>}
                {reviewError && <p style={{ color: 'red' }}>{reviewError}</p>}
                {!isLoadingReviews && !reviewError && (
                    <div className="overall-rating">
                        <div className="rating-score">
                            <span className="score">
                                {reviewStats.average_rating > 0 ? reviewStats.average_rating.toFixed(1) : 'N/A'}
                            </span>
                            <div className="stars">
                                {renderAverageStars(reviewStats.average_rating)}
                            </div>
                            <p>
                                {reviewStats.total_reviews > 0
                                    ? `Based on ${reviewStats.total_reviews} review${reviewStats.total_reviews === 1 ? '' : 's'}`
                                    : "No reviews yet"}
                            </p>
                        </div>
                        <div className="rating-breakdown">
                            {/* Iterate for 5 to 1 star ratings */}
                            {[5, 4, 3, 2, 1].map((starValue) => (
                                <div className="rating-bar" key={starValue}>
                                    <span>{starValue}</span>
                                    <div className="bar">
                                        <div
                                            className="filled"
                                            style={{ width: getRatingPercentage(starValue) }}
                                        ></div>
                                    </div>
                                    <span>{getRatingPercentage(starValue)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section">
                {/* ... (content remains the same) ... */}
                <h2>Testimonials</h2>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <div className="stars">
                            {Array.from({ length: 5 }, (_, i) => (
                                <FaStar key={i} className="star-filled" size={16} />
                            ))}
                        </div>
                        <p>
                            “I bought the Leather-Band Watch from WatchDog, and the quality exceeded my expectations. The delivery was fast, and it looks stunning!”
                        </p>
                        <p className="author">— John D., Watch Enthusiast</p>
                    </div>
                    <div className="testimonial-card">
                        <div className="stars">
                            {Array.from({ length: 5 }, (_, i) => (
                                <FaStar key={i} className="star-filled" size={16} />
                            ))}
                        </div>
                        <p>
                            “The customer service at WatchDog is amazing! They helped me pick the perfect watch, and I love wearing it every day.”
                        </p>
                        <p className="author">— Emily S., Office Professional</p>
                    </div>
                    <div className="testimonial-card">
                        <div className="stars">
                            {Array.from({ length: 5 }, (_, i) => (
                                <FaStar key={i} className="star-filled" size={16} />
                            ))}
                        </div>
                        <p>
                            “This is my second purchase from WatchDog, and the craftsmanship of their watches is top-notch. Highly recommend!”
                        </p>
                        <p className="author">— Michael R., Collector</p>
                    </div>
                </div>
            </section>

            {/* Image Gallery Section */}
            <section className="image-gallery-section">
                {/* ... (content remains the same) ... */}
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

export default About;