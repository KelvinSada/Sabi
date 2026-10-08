"use client";

import { DefaultChatTransport, safeValidateUIMessages, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const SAVED_CHATS_KEY = "sabipath-saved-chats-v1";

type SavedChat = {
  id: string;
  title: string;
  updatedAt: string;
  messages: UIMessage[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getChatTitle(messages: UIMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const text = firstUserMessage?.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();

  if (!text) return "Tech skill chat";
  return text.length > 48 ? `${text.slice(0, 48).trimEnd()}…` : text;
}

const starterPrompts = [
  {
    category: "NOT SURE YET",
    prompt: "I’m new to tech. Help me find a place to start.",
    icon: (
      <>
        <circle
          cx="12"
          cy="12"
          r="8.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M9.7 9a2.4 2.4 0 1 1 4.1 1.7c-1 .9-1.8 1.2-1.8 2.8m0 3v.1"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    category: "CREATIVE",
    prompt: "I like making flyers. What tech skill might fit?",
    icon: (
      <path
        d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    category: "PROBLEM-SOLVER",
    prompt: "I enjoy fixing phone or app problems. What paths fit?",
    icon: (
      <path
        d="m14.5 6.2 3.3-3.3a5.2 5.2 0 0 1-6.5 6.5l-7 7a2.1 2.1 0 1 0 3 3l7-7a5.2 5.2 0 0 0 6.5-6.5l-3.3 3.3-3-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    category: "PHONE ONLY",
    prompt: "I have a phone and an hour a day. Where can I start?",
    icon: (
      <path
        d="M8 3.8h8a1.7 1.7 0 0 1 1.7 1.7v13a1.7 1.7 0 0 1-1.7 1.7H8a1.7 1.7 0 0 1-1.7-1.7v-13A1.7 1.7 0 0 1 8 3.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    ),
  },
];

export default function ChatInterface() {
  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    status,
    stop,
    error,
    clearError,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryReady, setIsHistoryReady] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const savedChatsRef = useRef<SavedChat[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldStickToBottom = useRef(true);
  const isGenerating = status === "submitted" || status === "streaming";
  const lastMessage = messages.at(-1);
  const lastAssistantText =
    lastMessage?.role === "assistant"
      ? lastMessage.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("")
      : "";
  const isWaitingForFirstToken = isGenerating && !lastAssistantText;

  useEffect(() => {
    let isMounted = true;

    async function loadSavedChats() {
      try {
        const storedChats = localStorage.getItem(SAVED_CHATS_KEY);
        if (!storedChats) {
          if (isMounted) setIsHistoryReady(true);
          return;
        }

        const parsed: unknown = JSON.parse(storedChats);
        if (!Array.isArray(parsed)) {
          throw new Error("Saved chat history has an invalid format.");
        }

        const loadedChats: SavedChat[] = [];
        let skippedChats = false;
        for (const value of parsed) {
          if (
            !isRecord(value) ||
            typeof value.id !== "string" ||
            value.id.length === 0 ||
            typeof value.title !== "string" ||
            typeof value.updatedAt !== "string" ||
            !Number.isFinite(Date.parse(value.updatedAt)) ||
            !Array.isArray(value.messages)
          ) {
            skippedChats = true;
            continue;
          }

          const validation = await safeValidateUIMessages({
            messages: value.messages,
          });
          if (
            !validation.success ||
            validation.data.length === 0 ||
            validation.data.some(
              (message) => !["user", "assistant"].includes(message.role),
            )
          ) {
            skippedChats = true;
            continue;
          }

          loadedChats.push({
            id: value.id,
            title: value.title,
            updatedAt: value.updatedAt,
            messages: validation.data,
          });
        }

        loadedChats.sort(
          (first, second) =>
            Date.parse(second.updatedAt) - Date.parse(first.updatedAt),
        );
        if (isMounted) {
          savedChatsRef.current = loadedChats;
          setSavedChats(loadedChats);

          const mostRecentChat = loadedChats[0];
          if (mostRecentChat) {
            setActiveChatId(mostRecentChat.id);
            setMessages(mostRecentChat.messages);
          }
          if (skippedChats) {
            setHistoryError("Some saved chats could not be opened.");
          }
          setIsHistoryReady(true);
        }
      } catch (cause) {
        if (isMounted) {
          setHistoryError(
            cause instanceof Error
              ? `Could not load saved chats: ${cause.message}`
              : "Could not load saved chats from this device.",
          );
          setIsHistoryReady(true);
        }
      }
    }

    void loadSavedChats();
    return () => {
      isMounted = false;
    };
  }, [setMessages]);

  useEffect(() => {
    if (!isHistoryReady || messages.length === 0) return;

    const chat: SavedChat = {
      id: activeChatId ?? crypto.randomUUID(),
      title: getChatTitle(messages),
      updatedAt: new Date().toISOString(),
      messages,
    };
    const updatedChats = [
      chat,
      ...savedChatsRef.current.filter((savedChat) => savedChat.id !== chat.id),
    ];

    try {
      localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(updatedChats));
      savedChatsRef.current = updatedChats;
      setSavedChats(updatedChats);
      setHistoryError("");
      if (!activeChatId) setActiveChatId(chat.id);
    } catch (cause) {
      setHistoryError(
        cause instanceof Error
          ? `This chat could not be saved on this device: ${cause.message}`
          : "This chat could not be saved on this device.",
      );
    }
  }, [activeChatId, isHistoryReady, messages]);

  useEffect(() => {
    if (!isHistoryOpen) return;

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setIsHistoryOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isHistoryOpen]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea || messages.length === 0) return;

    if (shouldStickToBottom.current) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
      return;
    }

    const distanceFromBottom =
      scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
    setShowJumpButton(distanceFromBottom > 160);
  }, [messages, status]);

  function handleScroll() {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const distanceFromBottom =
      scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;
    shouldStickToBottom.current = distanceFromBottom < 72;
    setShowJumpButton(distanceFromBottom > 160);
  }

  function jumpToLatest() {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    shouldStickToBottom.current = true;
    scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: "smooth" });
    setShowJumpButton(false);
  }

  function startNewChat() {
    if (isGenerating) void stop();
    setMessages([]);
    setInput("");
    clearError();
    setActiveChatId(null);
    setIsHistoryOpen(false);
    setShowJumpButton(false);
    shouldStickToBottom.current = true;

    if (textareaRef.current) {
      textareaRef.current.style.height = "";
    }
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }

  function openSavedChat(chat: SavedChat) {
    if (isGenerating) void stop();
    setMessages(chat.messages);
    setActiveChatId(chat.id);
    setInput("");
    clearError();
    setIsHistoryOpen(false);
    setShowJumpButton(false);
    shouldStickToBottom.current = true;
    if (textareaRef.current) textareaRef.current.style.height = "";
    if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = 0;
  }

  function deleteSavedChat(chat: SavedChat) {
    const remainingChats = savedChatsRef.current.filter(
      (savedChat) => savedChat.id !== chat.id,
    );

    try {
      localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(remainingChats));
      savedChatsRef.current = remainingChats;
      setSavedChats(remainingChats);
      setHistoryError("");
      if (activeChatId === chat.id) startNewChat();
    } catch (cause) {
      setHistoryError(
        cause instanceof Error
          ? `Could not delete this saved chat: ${cause.message}`
          : "Could not delete this saved chat from this device.",
      );
    }
  }

  function submitMessage(text: string) {
    const trimmedText = text.trim();
    if (!trimmedText || isGenerating) return;

    shouldStickToBottom.current = true;
    setShowJumpButton(false);
    sendMessage({ text: trimmedText });
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "";
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage(input);
    }
  }

  return (
    <main className="chat-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="SabiPath — find your place in tech">
          <Image
            className="brand-logo"
            src="/sabi_logo_pic.png"
            alt=""
            width={640}
            height={640}
            priority
          />
          <span className="brand-copy">
            <span className="brand-name">SabiPath</span>
            <span className="brand-product">your place in tech starts here.</span>
          </span>
        </Link>
        <div className="topbar-actions">
          <button
            className="history-button"
            onClick={() => setIsHistoryOpen((isOpen) => !isOpen)}
            type="button"
            aria-expanded={isHistoryOpen}
            aria-controls="saved-chats-panel"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 5.5h12M4 10h12M4 14.5h8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span>Chats</span>
            {savedChats.length > 0 && (
              <span className="history-count">{savedChats.length}</span>
            )}
          </button>
          <div className="topbar-status">
            <span className="status-spark" aria-hidden="true">✳</span>
            <span>Your next move in tech</span>
          </div>
          {messages.length > 0 && (
            <button
              className="new-chat-button"
              onClick={startNewChat}
              type="button"
              aria-label="Start a new chat"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M3.5 9a6.5 6.5 0 1 1 1.9 4.6M3.5 4.5V9h4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>New chat</span>
            </button>
          )}
        </div>
      </header>

      {isHistoryOpen && (
        <>
          <button
            className="history-backdrop"
            type="button"
            aria-label="Close saved chats"
            onClick={() => setIsHistoryOpen(false)}
          />
          <aside
            className="history-panel"
            id="saved-chats-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-chats-heading"
            aria-label="Saved chats"
          >
            <div className="history-panel-heading">
              <div>
                <p className="history-eyebrow">YOUR JOURNEY</p>
                <h2 id="saved-chats-heading">Saved chats</h2>
              </div>
              <button
                className="history-close"
                onClick={() => setIsHistoryOpen(false)}
                type="button"
                aria-label="Close saved chats"
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="m5 5 10 10M15 5 5 15"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <p className="history-description">
              Pick up where you left off, anytime on this device.
            </p>
            <button
              className="history-new-chat"
              onClick={startNewChat}
              type="button"
            >
              <span aria-hidden="true">＋</span>
              Start a new chat
            </button>
            {historyError && (
              <p className="history-error" role="alert">{historyError}</p>
            )}
            <div className="history-list" aria-live="polite">
              {!isHistoryReady ? (
                <p className="history-empty">Loading your chats…</p>
              ) : savedChats.length === 0 ? (
                <p className="history-empty">
                  Your chats will show up here after you start a conversation.
                </p>
              ) : (
                savedChats.map((chat) => (
                  <div
                    className={`history-item${chat.id === activeChatId ? " history-item-active" : ""}`}
                    key={chat.id}
                  >
                    <button
                      className="history-item-open"
                      onClick={() => openSavedChat(chat)}
                      type="button"
                      aria-current={chat.id === activeChatId ? "page" : undefined}
                    >
                      <span className="history-item-title">{chat.title}</span>
                      <span className="history-item-date">
                        {new Date(chat.updatedAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </button>
                    <button
                      className="history-delete"
                      onClick={() => deleteSavedChat(chat)}
                      type="button"
                      aria-label={`Delete ${chat.title}`}
                    >
                      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path
                          d="M4.5 6h11m-9.5 0 .6 10h7.8l.6-10M8 6V4h4v2m-3 3v4m2-4v4"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            <p className="history-storage-note">
              Chats are saved privately in this browser on this device.
            </p>
          </aside>
        </>
      )}

      <section className="chat-panel" aria-label="SabiPath tech skill discovery chat">
        <div
          className="conversation"
          ref={scrollAreaRef}
          onScroll={handleScroll}
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-hero">
                <div className="hero-copy">
                  <p className="eyebrow">
                    <span className="eyebrow-spark" aria-hidden="true">✳</span>
                    THERE&apos;S ROOM FOR YOU IN TECH
                  </p>
                  <h1>
                    Find your
                    <br />
                    <span>place in tech.</span>
                  </h1>
                  <p className="welcome-copy">
                    Tech is more than coding. Whether you&apos;re creative,
                    patient, curious, or good with people, let&apos;s connect
                    what you already do well to a skill you can explore—at your
                    pace, with what you have.
                  </p>
                  <div className="strength-tags" aria-label="What we’ll explore">
                    <span>What you&apos;re good at</span>
                    <span>What you enjoy</span>
                    <span>What you have access to</span>
                  </div>
                </div>

                <aside className="discovery-card">
                  <div className="discovery-art" aria-hidden="true">
                    <span className="orbit orbit-one" />
                    <span className="orbit orbit-two" />
                    <span className="orbit-core">
                      <svg viewBox="0 0 32 32" fill="none">
                        <path
                          d="M16 4.5 19.1 13l8.4 3-8.4 3L16 27.5 13 19l-8.5-3 8.5-3L16 4.5Z"
                          fill="currentColor"
                        />
                        <circle cx="16" cy="16" r="2.4" fill="#F4AA61" />
                      </svg>
                    </span>
                    <span className="orbit-dot" />
                  </div>
                  <p className="discovery-label">NO BE ONLY CODING</p>
                  <h2>Different strengths. Different paths into tech.</h2>
                  <p className="discovery-copy">
                    Start with what you enjoy. We&apos;ll figure out what could fit.
                  </p>
                  <div className="discovery-steps">
                    <span><i>01</i> Tell me what comes naturally</span>
                    <span><i>02</i> Find a skill that fits you</span>
                    <span><i>03</i> Try am small-small, your way</span>
                  </div>
                </aside>
              </div>

              <div className="suggestions-heading">
                <span>WHICH ONE FEELS LIKE YOU?</span>
                <span>Pick one—or tell me in your own words.</span>
              </div>
              <div className="suggestions" aria-label="Ways to get started">
                {starterPrompts.map((prompt) => (
                  <button
                    className="suggestion"
                    key={prompt.category}
                    onClick={() => submitMessage(prompt.prompt)}
                    type="button"
                  >
                    <span className="suggestion-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">{prompt.icon}</svg>
                    </span>
                    <span className="suggestion-copy">
                      <span className="suggestion-category">{prompt.category}</span>
                      <span className="suggestion-prompt">{prompt.prompt}</span>
                    </span>
                    <svg className="suggestion-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="welcome-note">
                English · Pidgin · Yorùbá · Igbo — talk how you like.
                No laptop or coding experience needed to start exploring.
              </p>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article
                  className={`message message-${message.role}`}
                  key={message.id}
                >
                  <div className="message-avatar" aria-hidden="true">
                    {message.role === "assistant" ? (
                      <span className="assistant-mark">S</span>
                    ) : (
                      <span>You</span>
                    )}
                  </div>
                  <div className="message-content">
                    <p className="message-author">
                      {message.role === "assistant" ? "SabiPath" : "You"}
                    </p>
                    <div className="message-text">
                      {message.parts.map((part, index) =>
                        part.type === "text" ? (
                          <p key={`${message.id}-${index}`}>{part.text}</p>
                        ) : null,
                      )}
                    </div>
                  </div>
                </article>
              ))}
              {isWaitingForFirstToken && (
                <div className="message message-assistant" aria-label="Thinking">
                  <div className="message-avatar" aria-hidden="true">
                    <span className="thinking-mark">S</span>
                  </div>
                  <div className="thinking-indicator">
                    <span />
                    <span />
                    <span />
                    <span className="thinking-label">Thinking</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="chat-error" role="alert">
                  <span>
                    {error.message.includes("OpenRouter rejected") ||
                    error.message.includes("free-model request limit") ||
                    error.message.includes("free model is busy")
                      ? error.message
                      : "The AI provider couldn’t complete that reply. Please try again."}
                  </span>
                  <button type="button" onClick={() => regenerate()}>
                    Try again
                  </button>
                  <button type="button" onClick={clearError}>
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {showJumpButton && (
          <button
            className="jump-button"
            onClick={jumpToLatest}
            type="button"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M10 4v12m-5-5 5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Jump to latest
          </button>
        )}

        <div className="composer-wrap">
          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              aria-label="Message SabiPath"
              placeholder="Wetin you enjoy or find easy? Tell me—we'll find your tech fit..."
              rows={1}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                event.target.style.height = "";
                event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={handleKeyDown}
            />
            <div className="composer-bottom">
              <span className="composer-hint">
                <kbd>Enter</kbd> to send <span className="hint-dot">·</span>{" "}
                <kbd>Shift + Enter</kbd> for a new line
              </span>
              {isGenerating ? (
                <button
                  className="send-button stop-button"
                  onClick={() => stop()}
                  type="button"
                  aria-label="Stop generating"
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect
                      x="5.5"
                      y="5.5"
                      width="9"
                      height="9"
                      rx="1.5"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  className="send-button"
                  disabled={!input.trim()}
                  type="submit"
                  aria-label="Send message"
                >
                  <span>Send</span>
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M4 10h11m-4-4 4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </form>
          <p className="disclaimer">
            No experience needed. Your next step, your pace.
          </p>
        </div>
      </section>
    </main>
  );
}
