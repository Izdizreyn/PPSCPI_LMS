import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import StudentSidebar from "../components/StudentSidebar";
import { adminLinks, teacherLinks } from "../config/navLinks";
import "./ChatPortal.css";

export default function ChatPortal({ mode }) {
  const { user, token, logout } = useAuth();
  const isTeacher = mode === "teacher";
  const isAdmin = mode === "admin";
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [roomRosterOpen, setRoomRosterOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageConversationId, setMessageConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const latestMessageId = useRef(0);
  const activeConversationId = useRef(null);
  const messageConversationIdRef = useRef(null);
  const messageListRef = useRef(null);

  const authConfig = useCallback(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token],
  );

  const loadConversations = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/chat/conversations.php`,
        authConfig(),
      );
      const nextConversations = response.data.conversations || [];
      setConversations(nextConversations);
      setSelectedId((currentId) => {
        if (nextConversations.some((item) => item.id === currentId)) {
          return currentId;
        }
        return nextConversations[0]?.id ?? null;
      });
      setError("");
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        logout();
        return;
      }
      setError(
        requestError.response?.data?.message ||
          "Conversations could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [authConfig, logout]);

  const loadMessages = useCallback(
    async (conversationId, initial = false) => {
      if (!conversationId) return;
      const afterId = initial ? 0 : latestMessageId.current;
      try {
        const response = await axios.get(
          `${API_BASE_URL}/chat/messages.php`,
          {
            ...authConfig(),
            params: { conversation_id: conversationId, after_id: afterId },
          },
        );
        const incoming = response.data.messages || [];
        if (activeConversationId.current !== conversationId) return;
        if (initial) {
          setMessages(incoming);
          setMessageConversationId(conversationId);
          messageConversationIdRef.current = conversationId;
        } else if (incoming.length) {
          if (messageConversationIdRef.current !== conversationId) {
            setMessageConversationId(conversationId);
            messageConversationIdRef.current = conversationId;
            setMessages(incoming);
          } else {
            setMessages((current) => {
              const existingIds = new Set(
                current.map((message) => message.id),
              );
              return [
                ...current,
                ...incoming.filter((message) => !existingIds.has(message.id)),
              ];
            });
          }
        }
        if (incoming.length) {
          latestMessageId.current = Math.max(
            latestMessageId.current,
            ...incoming.map((message) => Number(message.id)),
          );
        }
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          logout();
          return;
        }
        setError(
          requestError.response?.data?.message || "Messages could not be loaded.",
        );
      }
    },
    [authConfig, logout],
  );

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadConversations, 0);
    const pollId = window.setInterval(loadConversations, 5000);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(pollId);
    };
  }, [loadConversations]);

  useEffect(() => {
    activeConversationId.current = selectedId;
    latestMessageId.current = 0;
    if (!selectedId) return undefined;

    const initialLoadId = window.setTimeout(
      () => loadMessages(selectedId, true),
      0,
    );
    const pollId = window.setInterval(() => loadMessages(selectedId), 3000);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(pollId);
    };
  }, [selectedId, loadMessages]);

  useEffect(() => {
    if (messageConversationId === selectedId && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, messageConversationId, selectedId]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !selectedId || sending) return;

    setSending(true);
    setError("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/chat/messages.php`,
        { conversation_id: selectedId, message },
        authConfig(),
      );
      if (response.data.success && response.data.message) {
        const newMessage = response.data.message;
        setMessages((current) => [...current, newMessage]);
        setMessageConversationId(selectedId);
        messageConversationIdRef.current = selectedId;
        latestMessageId.current = Number(newMessage.id);
        setDraft("");
        loadConversations();
      }
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        logout();
        return;
      }
      setError(
        requestError.response?.data?.message || "Message could not be sent.",
      );
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId,
  );

  const content = (
    <main className={`chat-portal ${isTeacher ? "chat-portal-staff" : ""}`}>
      <header className="chat-heading">
        <div>
          <h1>
            {isTeacher ? "Room Chats" : isAdmin ? "Student Chats" : "Student Chat"}
          </h1>
          <p>
            {isTeacher
                ? "Chat with students in your assigned advisory rooms."
                : isAdmin
                  ? "Reply to students who message the school through the student portal."
                  : "Message the school through the admin dashboard, or join your room chat."}
          </p>
        </div>
        <span className="chat-live-indicator">Updates every few seconds</span>
      </header>
      {error && <p className="chat-error" role="alert">{error}</p>}
      <div className="chat-workspace">
        <aside className="chat-conversation-list" aria-label="Conversations">
          {loading ? (
            <p className="chat-empty">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <p className="chat-empty">
              {isTeacher
                ? "No room chats are available. Check your advisory-room assignments and enrolled student roster."
                : isAdmin
                  ? "No students have started a chat yet."
                  : "No chat is available for your account."}
            </p>
          ) : (
            conversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                className={`chat-conversation${conversation.id === selectedId ? " selected" : ""}`}
                onClick={() => {
                  setSelectedId(conversation.id);
                  setRoomRosterOpen(false);
                }}
              >
                <span className="chat-conversation-heading">
                  <strong>{conversation.title}</strong>
                  {Number(conversation.unread_count) > 0 && (
                    <span className="chat-unread-count">
                      {conversation.unread_count}
                    </span>
                  )}
                </span>
                <span className="chat-conversation-preview">
                  {conversation.last_message || "No messages yet"}
                </span>
                {conversation.updated_at && (
                  <time>{new Date(conversation.updated_at).toLocaleString()}</time>
                )}
              </button>
            ))
          )}
        </aside>

        <section className="chat-thread" aria-label="Message thread">
          {selectedConversation ? (
            <>
              <header className="chat-thread-header">
                <div className="chat-thread-title">
                  <h2>{selectedConversation.title}</h2>
                  {selectedConversation.type === "section" && (
                    <p>
                      {selectedConversation.year_level}
                      {selectedConversation.strand
                        ? ` · ${selectedConversation.strand}`
                        : ""}
                    </p>
                  )}
                  {selectedConversation.type === "staff" && !isAdmin && (
                    <p>Private conversation with the school admin.</p>
                  )}
                </div>
                {isTeacher && selectedConversation.type === "section" && (
                  <div className="chat-room-roster">
                    <button
                      type="button"
                      className="chat-room-roster-toggle"
                      aria-expanded={roomRosterOpen}
                      aria-controls="chat-room-roster-list"
                      onClick={() => setRoomRosterOpen((open) => !open)}
                    >
                      Students ({selectedConversation.students?.length || 0})
                    </button>
                    {roomRosterOpen && (
                      <div className="chat-room-roster-panel" id="chat-room-roster-list">
                        <strong>Students in this room</strong>
                        {selectedConversation.students?.length ? (
                          <ul>
                            {selectedConversation.students.map((student) => (
                              <li key={student.lrn}>
                                <span>{student.full_name}</span>
                                <span>{student.lrn}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No students enrolled</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </header>
              <div className="chat-message-list" ref={messageListRef}>
                {messageConversationId !== selectedId || messages.length === 0 ? (
                  <p className="chat-empty">Start the conversation.</p>
                ) : (
                  messages.map((message) => {
                    const ownMessage = isTeacher || isAdmin
                      ? message.sender_role === "staff" &&
                        Number(message.sender_id) === Number(user?.id ?? user?.user_id)
                      : message.sender_role === "student" &&
                        Number(message.sender_id) === Number(user?.id ?? user?.user_id);
                    return (
                      <article
                        className={`chat-message${ownMessage ? " own" : ""}`}
                        key={message.id}
                      >
                        <div className="chat-message-meta">
                          <strong>{message.sender_name}</strong>
                          <time>{new Date(message.created_at).toLocaleString()}</time>
                        </div>
                        <p>{message.message_text}</p>
                      </article>
                    );
                  })
                )}
              </div>
              <form className="chat-compose" onSubmit={sendMessage}>
                <label className="visually-hidden" htmlFor="chat-message">
                  Write a message
                </label>
                <div className="chat-compose-field">
                  <textarea
                    id="chat-message"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    placeholder="Write a message..."
                    maxLength={2000}
                    rows={2}
                    required
                  />
                  <span className="chat-compose-hint">
                    Enter to send · Shift+Enter for a new line
                  </span>
                </div>
                <button type="submit" disabled={sending || !draft.trim()}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <p className="chat-empty chat-thread-empty">
              Select a conversation to read and send messages.
            </p>
          )}
        </section>
      </div>
    </main>
  );

  if (isTeacher || isAdmin) {
    return (
      <AdminLayout links={isAdmin ? adminLinks : teacherLinks}>
        {content}
      </AdminLayout>
    );
  }

  return (
    <div className="student-chat-layout">
      <StudentSidebar />
      {content}
    </div>
  );
}
