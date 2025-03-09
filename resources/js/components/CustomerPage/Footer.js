// resources/js/components/CustomerPage/Footer.js
import React from "react";
import { Link, useLocation } from "react-router-dom"; // Updated to include useLocation
import { FaFacebook, FaLinkedin, FaTwitter, FaGoogle } from "react-icons/fa";

const Footer = () => {
    const location = useLocation().pathname; // Get the current path

    return (
        <footer className="customer-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>WatchDog</h3>
                    <div className="footer-contact">
                        <p>Contact us</p>
                        <p>watchdog@gmail.com</p>
                        <p>+1 2345-6789</p>
                        <p>123 Ave, Butuan City, PH</p>
                    </div>
                    <div className="footer-social">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                            <FaFacebook size={20} />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                            <FaLinkedin size={20} />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                            <FaTwitter size={20} />
                        </a>
                        <a href="https://google.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                            <FaGoogle size={20} />
                        </a>
                    </div>
                </div>
                <div className="footer-section">
                    <h3>About</h3>
                    <Link
                        to="/customer/about"
                        className={`footer-link ${location === "/customer/about" ? "active" : ""}`}
                    >
                        Our Story
                    </Link>
                    <Link
                        to="/customer/team"
                        className={`footer-link ${location === "/customer/team" ? "active" : ""}`}
                    >
                        Our Team
                    </Link>
                    <Link
                        to="/customer/faq"
                        className={`footer-link ${location === "/customer/faq" ? "active" : ""}`}
                    >
                        FAQ
                    </Link>
                </div>
            </div>
            <div className="footer-copyright">
                <p>© 2025 WatchDog. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;