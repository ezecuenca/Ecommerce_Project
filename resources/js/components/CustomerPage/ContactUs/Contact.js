import React from "react";

const Contact = () => {
    return (
        <div className="contact-page">
            <section className="contact-section">
                <div className="contact-form">
                    <h2>Contact us</h2>
                    <p>The harder you work for something, the greater you'll feel when you achieve it.</p>
                    <form>
                        <div className="form-group">
                            <select name="topic" id="topic">
                                <option value="">Topic</option>
                                <option value="support">Support</option>
                                <option value="sales">Sales</option>
                                <option value="general">General Inquiry</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <input type="text" id="name" name="name" placeholder="Your name" />
                        </div>
                        <div className="form-group">
                            <input type="email" id="email" name="email" placeholder="Email" />
                        </div>
                        <div className="form-group">
                            <textarea id="description" name="description" placeholder="Description (optional)"></textarea>
                        </div>
                        <button type="submit">SEND REQUEST</button>
                    </form>
                </div>
                <div className="image-section"></div>
            </section>
        </div>
    );
};

export default Contact;