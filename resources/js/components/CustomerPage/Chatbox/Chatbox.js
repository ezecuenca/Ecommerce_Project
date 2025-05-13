import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { FaPaperclip, FaPaperPlane, FaTimes, FaSpinner } from 'react-icons/fa'; // Using icons

const API_BASE_URL = "http://localhost:8000/api";
const IMAGE_STORAGE_URL = "http://localhost:8000/storage/";

const ChatBox = ({ visible, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [attachedImageFile, setAttachedImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const pollIntervalRef = useRef(null);

    const token = useMemo(() => localStorage.getItem("access_token"), []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = useCallback(async () => {
        if (!token) {
            setError("Authentication token not found. Please log in.");
            return;
        }
        setIsLoading(true);
        console.log("Fetching customer messages...");

        try {
            const response = await axios.get(
                `${API_BASE_URL}/customer/chat`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const fetchedMessages = Array.isArray(response.data)
                ? response.data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                : [];
            setMessages(fetchedMessages);
            setError(null);
        } catch (err) {
            console.error("Error fetching messages:", err.response?.data || err.message);
            if (messages.length === 0) {
                setError("Failed to load messages. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, messages.length]);

    useEffect(() => {
        if (visible && token) {
            console.log("Chatbox visible, starting fetch/poll...");
            fetchMessages();

            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

            pollIntervalRef.current = setInterval(fetchMessages, 5000);

        } else {
            console.log("Chatbox hidden or no token, clearing interval/state...");
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            if (!visible) {
                setMessages([]);
                setError(null);
                setNewMessage("");
                setAttachedImageFile(null);
                if (imagePreviewUrl) {
                    URL.revokeObjectURL(imagePreviewUrl);
                    setImagePreviewUrl(null);
                }
            }
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [visible, token, fetchMessages, imagePreviewUrl]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
            setAttachedImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
            setError(null);
        } else if (file) {
            setError("Please select a valid image file (PNG, JPG, etc.).");
            setAttachedImageFile(null);
            setImagePreviewUrl(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removePreview = () => {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setAttachedImageFile(null);
        setImagePreviewUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const sendMessage = useCallback(async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachedImageFile) || isSending || !token) {
            return;
        }

        setIsSending(true);
        setError(null);

        const optimisticId = `temp-${Date.now()}`;
        const currentPreviewUrl = imagePreviewUrl;
        const optimisticMessage = {
            id: optimisticId,
            profile_id: null,
            sender_type: "user",
            message_text: newMessage.trim(),
            image: currentPreviewUrl,
            is_read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            isOptimistic: true,
        };

        if (optimisticMessage.message_text || optimisticMessage.image) {
            setMessages(prev => [...prev, optimisticMessage]);
        }
        setNewMessage("");
        setAttachedImageFile(null);
        setImagePreviewUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = "";

        const formData = new FormData();
        formData.append("message_text", optimisticMessage.message_text);
        if (attachedImageFile) {
            formData.append("image", attachedImageFile);
        }

        try {
            const response = await axios.post(
                `${API_BASE_URL}/customer/chat`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setMessages(prev => prev.map(msg =>
                msg.id === optimisticId ? { ...response.data, isOptimistic: false } : msg
            ));

        } catch (err) {
            console.error("Error sending message:", err.response?.data || err.message);
            setError("Failed to send message.");
            setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
            if (currentPreviewUrl && currentPreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentPreviewUrl);
            }
        } finally {
            setIsSending(false);
            if (currentPreviewUrl && currentPreviewUrl.startsWith('blob:') && !error) {
                const finalMsg = messages.find(m => m.id === optimisticId);
                if (finalMsg?.image === currentPreviewUrl) {
                    URL.revokeObjectURL(currentPreviewUrl);
                }
            }
        }
    }, [newMessage, attachedImageFile, isSending, token, fetchMessages, imagePreviewUrl]);

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        try {
            return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch (e) { return ''; }
    };
    const formatDate = (timestamp) => {
        if (!timestamp) return null;
        try {
            return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) { return null; }
    };

    const messagesByDate = messages.reduce((acc, msg) => {
        const dateStr = formatDate(msg.created_at) || 'Unknown Date';
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(msg);
        return acc;
    }, {});

    if (!visible) return null;

    return (
        <div className="chat-modal">
            <div className="chat-container">
                <div className="chat-header">
                    <span>Chat Support</span>
                    <button onClick={onClose} className="close-button" aria-label="Close chat">
                        <FaTimes />
                    </button>
                </div>

                <div className="chat-messages">
                    {isLoading && messages.length === 0 && <div className="loading-indicator"><FaSpinner className="spinner" /> Loading...</div>}
                    {error && <div className="error-message">{error}</div>}
                    {!isLoading && !error && messages.length === 0 && <div className="no-messages">Welcome to WATCHDOGS. Please let us know how we can assist you today!</div>}

                    {Object.entries(messagesByDate).map(([date, dateMessages]) => (
                        <React.Fragment key={date}>
                            <div className="date-separator"><span>{date}</span></div>
                            {dateMessages.map((item) => {
                                let imgSrc = null;
                                if (item.image) {
                                    if (item.image.startsWith('blob:') || item.image.startsWith('http')) {
                                        imgSrc = item.image;
                                    } else if (item.image_url) {
                                        imgSrc = item.image_url;
                                    } else {
                                        imgSrc = `${IMAGE_STORAGE_URL}${item.image}`;
                                    }
                                }
                                const avatarSrc = item.sender_type === "admin" ? `https://ui-avatars.com/api/?name=Admin&background=444&color=fff&size=40` : `https://ui-avatars.com/api/?name=You&background=0D8ABC&color=fff&size=40`;
                                const displayName = item.sender_type === "admin" ? "Support" : "You";

                                return (
                                    <div
                                        key={item.id}
                                        className={`message ${item.sender_type} ${item.isOptimistic ? 'optimistic' : ''}`}
                                    >
                                        <div className="message-content">
                                            {item.message_text && <p>{item.message_text}</p>}
                                            {imgSrc && (
                                                <img
                                                    src={imgSrc}
                                                    alt="Attachment"
                                                    className="attached-image"
                                                    onLoad={scrollToBottom}
                                                />
                                            )}
                                        </div>
                                        <span className="message-time">{formatTime(item.created_at)}</span>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input" onSubmit={sendMessage}>
                    {imagePreviewUrl && (
                        <div className="image-preview-container">
                            <img src={imagePreviewUrl} alt="Preview" className="image-preview" />
                            <button type="button" onClick={removePreview} className="remove-preview-button" aria-label="Remove image attachment"><FaTimes /></button>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        id="customer-image-upload"
                    />
                    <button
                        type="button"
                        onClick={triggerFileInput}
                        className="attach-button"
                        aria-label="Attach image"
                        disabled={isSending}
                    >
                        <FaPaperclip />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="message-input"
                        disabled={isSending}
                        aria-label="Message input"
                    />
                    <button
                        type="submit"
                        className="send-button"
                        disabled={isSending || (!newMessage.trim() && !attachedImageFile)}
                        aria-label="Send message"
                    >
                        {isSending ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatBox;