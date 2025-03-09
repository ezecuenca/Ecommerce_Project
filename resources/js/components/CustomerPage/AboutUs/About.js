import React from "react";
import { FaStar } from "react-icons/fa";

const About = () => {
    return (
        <div className="about-page">
            <h1 className="about-title">About Us</h1>

            {/* Our Story Section */}
            <section className="our-story-section">
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
                <div className="text-content">
                    <h2>Our Mission</h2>
                    <p>
                        At WatchDog, we’re driven by the power of knowledge to navigate a digital world, both local and global. We’re passionate about supporting individuals and organizations with the latest technology, data analytics, actionable information, and emerging technologies. We aim to empower our community to make informed decisions, spark meaningful conversations, and challenge misinformation. We’re dedicated to delivering the truth with confidence and curiosity, and we’re committed to joining you in our journey to a more informed future.
                    </p>
                </div>
                <div className="image-placeholder"></div>
            </section>

            {/* Customer Reviews Section */}
            <section className="customer-reviews-section">
                <h2>Customers reviews</h2>
                <div className="overall-rating">
                    <div className="rating-score">
                        <span className="score">4.7</span>
                        <div className="stars">
                            {Array.from({ length: 5 }, (_, i) => (
                                <FaStar
                                    key={i}
                                    className={i < 4 ? "star-filled" : "star-empty"}
                                    size={20}
                                />
                            ))}
                        </div>
                        <p>Everest Peak and 1000+ More</p>
                    </div>
                    <div className="rating-breakdown">
                        <div className="rating-bar">
                            <span>5</span>
                            <div className="bar">
                                <div className="filled" style={{ width: "70%" }}></div>
                            </div>
                            <span>70%</span>
                        </div>
                        <div className="rating-bar">
                            <span>4</span>
                            <div className="bar">
                                <div className="filled" style={{ width: "20%" }}></div>
                            </div>
                            <span>20%</span>
                        </div>
                        <div className="rating-bar">
                            <span>3</span>
                            <div className="bar">
                                <div className="filled" style={{ width: "5%" }}></div>
                            </div>
                            <span>5%</span>
                        </div>
                        <div className="rating-bar">
                            <span>2</span>
                            <div className="bar">
                                <div className="filled" style={{ width: "3%" }}></div>
                            </div>
                            <span>3%</span>
                        </div>
                        <div className="rating-bar">
                            <span>1</span>
                            <div className="bar">
                                <div className="filled" style={{ width: "2%" }}></div>
                            </div>
                            <span>2%</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section">
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