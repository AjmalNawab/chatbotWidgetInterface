import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const ChatWidget = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const textareaRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(
      "https://chatbotserver-production-a836.up.railway.app/",
      {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, []);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      console.log("✅ Connected to WebSocket server");
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log("❌ Disconnected from WebSocket server");
      setIsConnected(false);
    };

    const onMessageReceived = (msg) => {
      if (msg && (msg.text || msg.message)) {
        setMessages((prev) => [
          ...prev,
          {
            text: msg.text || msg.message,
            sender: msg.sender || "bot",
            timestamp: msg.timestamp || new Date().toISOString(),
            status: msg.status || null,
          },
        ]);
        setIsBotTyping(false);
      }
    };

    const onTypingStatus = (isTyping) => {
      setIsBotTyping(isTyping);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("receive_message", onMessageReceived);
    socket.on("typing_status", onTypingStatus);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receive_message", onMessageReceived);
      socket.off("typing_status", onTypingStatus);
    };
  }, [socket]);

  // Send a message
  const sendMessage = () => {
    if (!message.trim()) return;

    if (!isConnected || !socket) {
      // Add visual feedback for offline state
      setMessages((prev) => [
        ...prev,
        {
          text: "WebSocket is offline. Message will be sent when online.",
          sender: "system",
          timestamp: new Date().toISOString(),
          status: "error",
        },
      ]);
      return;
    }

    socket.emit("send_message", message);

    // Clear typing status
    if (typingTimeout) clearTimeout(typingTimeout);
    socket.emit("typing_status", "");

    setMessage("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Handle the keypress (for Enter key)
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  };

  return (
    <div className="container">
      <div className="chatbot-popup">
        <div className="chat-header">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "0",
            }}
          >
            <div
              className="header-info"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "0",
                padding: "0",
              }}
            >
              <span className="bot-icon">🤖</span>
              <h2 className="logo-text" style={{ margin: "0" }}>
                ChatBot
              </h2>
            </div>
            <div
              className="status-container"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                margin: "0 0 0 28px",
                padding: "0",
                lineHeight: "1",
              }}
            >
              <span
                className={
                  isConnected ? "status-dot online" : "status-dot offline"
                }
                style={{
                  marginRight: "4px",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: isConnected ? "#4CAF50" : "#F44336",
                }}
              ></span>
              <span
                style={{
                  fontSize: "10px",
                  color: isConnected ? "#4CAF50" : "#F44336",
                  margin: "0",
                  padding: "0",
                }}
              >
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="chat-body">
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-wrapper ${
                  msg.sender === "user"
                    ? "left"
                    : msg.sender === "system"
                    ? "system"
                    : "right"
                }`}
              >
                <div className={`message-bubble ${msg.sender}`}>
                  <div className="message-sender">
                    {msg.sender === "user"
                      ? "You"
                      : msg.sender === "system"
                      ? "System"
                      : "Bot"}
                  </div>
                  <div className="message-content">{msg.text}</div>
                  <div className="message-timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {msg.sender === "user" && msg.status === "delivered" && (
                      <span> &nbsp; &nbsp;Delivered</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isBotTyping && (
              <div className="message-wrapper right">
                <div className="message-bubble bot typing-indicator">
                  <div className="message-sender">Bot</div>
                  <div className="message-content typing-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="bottom-space" />
          </div>
        </div>

        <div className="chat-footer">
          <div className="chat-form">
            <textarea
              ref={textareaRef}
              className="message-input"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                autoResizeTextarea();

                if (typingTimeout) clearTimeout(typingTimeout);
                if (socket && isConnected) {
                  setTypingTimeout(
                    setTimeout(() => {
                      socket.emit("typing_status", e.target.value.trim());
                    }, 300)
                  );
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={
                isConnected
                  ? "Type a message..."
                  : "Connection closed. Try again."
              }
              rows={1}
            />

            <button
              onClick={sendMessage}
              className={`Sendmaterial-symbols-rounded ${
                !isConnected ? "offline" : ""
              }`}
              disabled={!message.trim()}
            >
              <span className="material-symbols-rounded">send</span>
              {!isConnected && <span className="offline-tooltip"></span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
