import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { FaPaperclip, FaPaperPlane, FaSpinner, FaTimes } from 'react-icons/fa';

const API_BASE_URL = "http://localhost:8000/api";
const IMAGE_STORAGE_URL = "http://localhost:8000/storage/";

const AdminChatBox = ({ visible, onClose, conversation, position }) => {
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
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
    };

    const fetchMessages = useCallback(async (currentConversation) => {
        const profileId = currentConversation?.profile_id;
        if (!profileId || !token) {
            setError(profileId ? "Authentication token missing." : "No conversation selected.");
            setMessages([]);
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/chat/${profileId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const fetchedMessages = Array.isArray(response.data)
                ? response.data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                : [];
            setMessages(prevMessages => {
                if (JSON.stringify(prevMessages) !== JSON.stringify(fetchedMessages)) {
                    return fetchedMessages;
                }
                return prevMessages;
            });
            setError(null);
        } catch (err) {
            if (messages.length === 0) {
                setError("Failed to load messages.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, messages.length]);

    useEffect(() => {
        if (visible && conversation?.profile_id && position) {
            fetchMessages(conversation);
            pollIntervalRef.current = setInterval(() => {
                if (conversation?.profile_id) {
                    fetchMessages(conversation);
                }
            }, 5000);
        } else {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (!visible && (messages.length > 0 || error || newMessage || imagePreviewUrl)) {
                setMessages([]); setError(null); setNewMessage("");
                if (imagePreviewUrl) {
                    URL.revokeObjectURL(imagePreviewUrl);
                    setImagePreviewUrl(null);
                    setAttachedImageFile(null);
                }
            }
        }
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        };
    }, [visible, conversation, position, fetchMessages, imagePreviewUrl]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
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
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removePreview = () => {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setAttachedImageFile(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const sendMessage = useCallback(async (e) => {
        e.preventDefault();
        const profileId = conversation?.profile_id;
        if ((!newMessage.trim() && !attachedImageFile) || isSending || !profileId || !token) {
            return;
        }
        setIsSending(true); setError(null);

        const optimisticId = `temp-${Date.now()}`;
        const optimisticMessage = {
            id: optimisticId, profile_id: profileId, sender_type: "admin",
            message_text: newMessage.trim(), image: imagePreviewUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(), is_read: false, isOptimistic: true,
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage("");
        setAttachedImageFile(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        const formData = new FormData();
        formData.append("profile_id", profileId);
        formData.append("message_text", newMessage.trim());
        if (attachedImageFile) {
            formData.append("image", attachedImageFile);
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/chat`, formData, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
            });
            setMessages(prev => prev.map(msg =>
                msg.id === optimisticId ? { ...response.data, isOptimistic: false } : msg
            ));
        } catch (err) {
            setError("Failed to send message.");
            setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        } finally {
            setIsSending(false);
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        }
    }, [conversation, newMessage, attachedImageFile, isSending, token, imagePreviewUrl]);

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return null;
        return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const messagesByDate = messages.reduce((acc, msg) => {
        const dateStr = formatDate(msg.created_at) || 'Unknown Date';
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(msg);
        return acc;
    }, {});

    const getImageSrc = (msg) => {
        if (msg.image) {
            if (msg.image.startsWith('blob:') || msg.image.startsWith('http')) {
                return msg.image;
            } else if (msg.image_url) {
                return msg.image_url;
            } else {
                return `${IMAGE_STORAGE_URL}${msg.image}`;
            }
        }
        return null;
    };

    if (!visible || !position) {
        return null;
    }

    const profileData = conversation?.profile || {};
    const displayUsername = profileData.first_name || profileData.name || conversation?.customer_name || conversation?.username || "Customer";
    const profileImage = profileData.profile_picture_url || conversation?.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayUsername)}&background=78909C&color=fff&size=40`;

    return (
        <div className="chat-modal">
            <div className="chat-container">
                <div className="chat-header">
                    <img src={profileImage} alt={displayUsername} className="avatar" />
                    <span>{displayUsername}</span>
                    <button onClick={onClose} className="close-button" aria-label="Close chat">
                        ✕
                    </button>
                </div>
                <div className="chat-messages">
                    {isLoading && messages.length === 0 && <div className="loading-indicator"><FaSpinner className="spinner" /> Loading...</div>}
                    {error && <div className="error-message">{error}</div>}
                    {!isLoading && !error && messages.length === 0 && conversation?.profile_id && <div className="no-messages">No messages yet.</div>}
                    {Object.entries(messagesByDate).map(([date, dateMessages]) => (
                        <React.Fragment key={date}>
                            <div className="date-separator"><span>{date}</span></div>
                            {dateMessages.map((msg) => (
                                <div key={msg.id ?? `optimistic-${msg.created_at}`} className={`message ${msg.sender_type === 'admin' ? 'sent' : 'received'}`}>
                                    <div className="message-content">
                                        {msg.message_text && <p>{msg.message_text}</p>}
                                        {getImageSrc(msg) && <img src={getImageSrc(msg)} alt="Attachment" className="attached-image" />}
                                    </div>
                                    <span className="message-time">{formatTime(msg.created_at)}</span>
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form className="chat-input" onSubmit={sendMessage}>
                    {imagePreviewUrl && (
                        <div className="image-preview-container">
                            <img src={imagePreviewUrl} alt="Preview" className="image-preview" />
                            <button type="button" onClick={removePreview} className="remove-preview-button" aria-label="Remove image attachment">
                                <FaTimes />
                            </button>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        id="admin-image-upload"
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

export default AdminChatBox;