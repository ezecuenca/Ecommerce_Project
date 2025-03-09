import React from "react";

const Faq = () => {
    return (
        <div className="faq-page">
            <h1>FAQ</h1>
            <div className="faq-list">
                <div className="faq-item">
                    <h3>How can I check the status of my watch order?</h3>
                    <p>
                        You can check the status of your order by logging into your profile on our website and visiting the "My Orders" section. There, you'll find details about your order, including its current status and tracking information if available.
                    </p>
                </div>
                <div className="faq-item">
                    <h3>What is your return policy?</h3>
                    <p>
                        We offer a 30-day return policy. If you're not satisfied with your watch, you can return it in its original condition with all packaging for a full refund. Please initiate the return process through your account within 30 days of delivery.
                    </p>
                </div>
                <div className="faq-item">
                    <h3>Do your watches come with a warranty?</h3>
                    <p>
                        Yes, all our watches come with a 2-year limited warranty covering manufacturing defects. For warranty claims, contact our support team with your proof of purchase, and we'll guide you through the process.
                    </p>
                </div>
                <div className="faq-item">
                    <h3>How do I care for my watch?</h3>
                    <p>
                        To maintain your watch, avoid exposing it to water (unless it's water-resistant), clean it with a soft cloth, and store it in a dry place. For detailed care instructions, refer to the manual included with your purchase or contact support.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Faq;