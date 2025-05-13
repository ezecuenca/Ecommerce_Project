import React from 'react';

// Helper function to format time nicely (e.g., "5:30 PM" or "Yesterday" or "Apr 28")
const formatInboxTime = (timestamp) => {
    if (!timestamp) return '';
    try {
        const messageDate = new Date(timestamp);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        if (messageDate.toDateString() === now.toDateString()) {
            // Today: Show time
            return messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            // Yesterday
            return 'Yesterday';
        } else {
            // Older: Show date (e.g., Apr 28)
            return messageDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
    } catch (e) {
        return ''; // Handle invalid date format
    }
};

const ChatInboxList = ({ conversations, onSelect, currentProfileId }) => {
    if (!conversations || conversations.length === 0) {
        return <div className="chat-inbox-empty">No conversations found.</div>;
    }

    return (
        <div className="chat-inbox-list">
            {conversations.map((convo) => {
                // Fallback for name and avatar
                const displayName = convo.customer_name?.trim() || 'Customer';
                const avatarUrl = convo.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=40`;
                const lastMessageSnippet = convo.last_message_text ?
                    (convo.last_message_text.length > 35 ? convo.last_message_text.substring(0, 35) + '...' : convo.last_message_text)
                    : '[No messages yet]'; // Or handle image placeholder better

                const isActive = convo.profile_id === currentProfileId; // Check if this convo is currently selected

                return (
                    <div
                        key={convo.profile_id}
                        className={`chat-inbox-item ${isActive ? 'active' : ''}`}
                        onClick={(e) => onSelect(convo, e)} // Pass convo data and event
                        role="button" // Semantics
                        tabIndex={0}  // Keyboard accessibility
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(convo, e); }} // Keyboard accessibility
                    >
                        <img src={avatarUrl} alt={displayName} className="inbox-avatar" />
                        <div className="inbox-details">
                            <div className="inbox-header">
                                <span className="inbox-name">{displayName}</span>
                                <span className="inbox-time">{formatInboxTime(convo.last_message_time)}</span>
                            </div>
                            <div className="inbox-message-preview">
                                {convo.unread_count > 0 && <span className="inbox-unread-dot"></span>}
                                <span className="inbox-snippet">{lastMessageSnippet}</span>
                            </div>
                        </div>
                        {convo.unread_count > 0 && (
                            <span className="inbox-unread-count">{convo.unread_count}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ChatInboxList;