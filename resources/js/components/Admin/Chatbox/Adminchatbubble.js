import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { FaCommentDots as ChatIcon } from "react-icons/fa";
import ChatInboxList from "./ChatInboxList";
import AdminChatBox from "./AdminChatbox";

const API_BASE_URL = "http://localhost:8000/api";

const AdminChatBubble = () => {
  // --- State ---
  const [isInboxVisible, setIsInboxVisible] = useState(false);
  const [inboxConversations, setInboxConversations] = useState([]);
  const [isInboxLoading, setIsInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState(null);
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [modalPosition, setModalPosition] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // New state for total unread messages
  const inboxContainerRef = useRef(null);

  // --- Memoized Token ---
  const token = useMemo(() => localStorage.getItem("access_token"), []);

  // --- Fetch Inbox Data ---
  const fetchInbox = useCallback(async () => {
    if (!token) {
      setInboxError("Authentication required.");
      return;
    }
    setIsInboxLoading(true);
    setInboxError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/chat/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const conversations = Array.isArray(response.data) ? response.data : [];
      setInboxConversations(conversations);

      // Calculate total unread messages
      const totalUnread = conversations.reduce((acc, conversation) => {
        // Option 1: If API provides an unread_count per conversation
        if (conversation.unread_count !== undefined) {
          return acc + (conversation.unread_count || 0);
        }
        // Option 2: If API provides messages with is_read field
        if (conversation.messages && Array.isArray(conversation.messages)) {
          const unreadInConversation = conversation.messages.filter(msg => !msg.is_read).length;
          return acc + unreadInConversation;
        }
        return acc;
      }, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("Error fetching admin inbox:", error.response?.data || error.message);
      setInboxError("Failed to load conversations.");
      setInboxConversations([]);
      setUnreadCount(0);
    } finally {
      setIsInboxLoading(false);
    }
  }, [token]);

  // --- Effect to Fetch Inbox ---
  useEffect(() => {
    fetchInbox(); // Initial fetch
    const intervalId = setInterval(fetchInbox, 5000); // Poll every 5 seconds for real-time updates
    return () => clearInterval(intervalId);
  }, [fetchInbox]);

  // --- Handle Selecting a Conversation ---
  const handleSelectConversation = useCallback((conversationData, clickEvent) => {
    if (!conversationData?.profile_id) {
      setInboxError("Invalid conversation data selected.");
      return;
    }

    setSelectedConversation(conversationData);

    const rect = clickEvent?.currentTarget?.getBoundingClientRect();
    if (rect) {
      const fallbackTop = window.innerHeight * 0.15;
      const fallbackLeft = window.innerWidth * 0.5 - 225;
      const posTop = rect.top > 100 ? rect.top - 50 : fallbackTop;
      const posLeft = rect.left > 300 ? rect.left - 300 : fallbackLeft;
      setModalPosition({ top: posTop, left: posLeft, bottom: rect.bottom, right: rect.right });
    } else {
      const fallbackTop = window.innerHeight * 0.15;
      const fallbackLeft = window.innerWidth * 0.5 - 225;
      setModalPosition({ top: fallbackTop, left: fallbackLeft });
    }

    setIsChatModalVisible(true);
    setIsInboxVisible(false);

    // Optionally reset unread count for this conversation when opened
    setInboxConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.profile_id === conversationData.profile_id
          ? { ...conv, unread_count: 0 } // Reset unread count for this conversation
          : conv
      )
    );
    setUnreadCount(prev => prev - (conversationData.unread_count || 0));
  }, []);

  // --- Handle Closing the Chat Modal ---
  const handleCloseChat = useCallback(() => {
    setIsChatModalVisible(false);
    setModalPosition(null);
  }, []);

  // --- Handle Clicking the Floating Bubble ---
  const handleChatBubbleClick = useCallback((event) => {
    setIsInboxVisible((prev) => !prev);
    if (!isInboxVisible) {
      fetchInbox();
    }
  }, [isInboxVisible, fetchInbox]);

  // --- Effect to Close Inbox on Outside Click ---
  useEffect(() => {
    const handleClickOutsideInbox = (event) => {
      const bubble = document.querySelector(".chatbox-bubble");
      if (
        inboxContainerRef.current &&
        !inboxContainerRef.current.contains(event.target) &&
        (!bubble || !bubble.contains(event.target))
      ) {
        setIsInboxVisible(false);
      }
    };
    if (isInboxVisible) {
      document.addEventListener("mousedown", handleClickOutsideInbox);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideInbox);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideInbox);
    };
  }, [isInboxVisible]);

  // --- JSX ---
  return (
    <>
      {/* Chat Bubble */}
      <div
        className="chatbox-bubble"
        onClick={handleChatBubbleClick}
        aria-label="Toggle Chat Inbox"
      >
        <ChatIcon size={24} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {/* Inbox Container */}
      {isInboxVisible && (
        <div ref={inboxContainerRef} className="chat-inbox-container">
          <div className="inbox-header">Conversations</div>
          {isInboxLoading && <div className="inbox-loading">Loading...</div>}
          {inboxError && <div className="inbox-error">{inboxError}</div>}
          {!isInboxLoading && !inboxError && (
            <ChatInboxList
              conversations={inboxConversations}
              onSelect={handleSelectConversation}
              currentProfileId={selectedConversation?.profile_id}
            />
          )}
        </div>
      )}

      {/* Admin Chat Box */}
      {isChatModalVisible && selectedConversation && modalPosition && (
        <AdminChatBox
          visible={isChatModalVisible}
          onClose={handleCloseChat}
          conversation={selectedConversation}
          position={modalPosition}
        />
      )}
    </>
  );
};

export default AdminChatBubble;