"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const starterPrompts = [
  {
    category: "WHAT YOU SABI",
    prompt: "I’m not sure what I’m naturally good at",
    icon: (
      <path
        d="M12 3.5a6.5 6.5 0 0 0-3.9 11.7c.8.6 1.4 1.5 1.5 2.5h4.8c.1-1 .7-1.9 1.5-2.5A6.5 6.5 0 0 0 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    category: "WHAT YOU ENJOY",
    prompt: "I enjoy fixing things. What skills could fit?",
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
    category: "START WITH WETIN YOU GET",
    prompt: "I have a phone and one hour a day. Where do I start?",
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
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

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
        <Link className="brand" href="/" aria-label="SABI — find wetin you sabi">
          <Image
            className="brand-logo"
            src="/sabi_actual_logo.png"
            alt=""
            width={1920}
            height={1280}
            priority
          />
          <span className="brand-product">find wetin you sabi.</span>
        </Link>
        <div className="topbar-status">
          <span className="status-spark" aria-hidden="true">✳</span>
          <span>For your next move</span>
        </div>
      </header>

      <section className="chat-panel" aria-label="SABI skill discovery chat">
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
                    NO BE ONE-SIZE-FITS-ALL
                  </p>
                  <h1>
                    You sabi
                    <br />
                    <span>something.</span>
                  </h1>
                  <p className="welcome-copy">
                    Everybody get something dem sabi. Let&apos;s find yours —
                    what comes naturally, what you enjoy, and what makes sense
                    for your life right now. Then discover how you can earn
                    from your skills.
                  </p>
                  <div className="strength-tags" aria-label="What we’ll explore">
                    <span>Wetin you sabi</span>
                    <span>Wetin you enjoy</span>
                    <span>Wetin you get</span>
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
                  <p className="discovery-label">FIND YOUR STRENGTH. EXPLORE HOW IT CAN EARN.</p>
                  <h2>Small-small, you go find your thing.</h2>
                  <p className="discovery-copy">
                    We start with you. The rest go follow.
                  </p>
                  <div className="discovery-steps">
                    <span><i>01</i> Notice wetin comes naturally</span>
                    <span><i>02</i> Follow wetin interests you</span>
                    <span><i>03</i> Start with wetin you get</span>
                  </div>
                </aside>
              </div>

              <div className="suggestions-heading">
                <span>WHERE YOU WAN START?</span>
                <span>Pick one. We go take am from there.</span>
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
                      {message.role === "assistant" ? "SABI" : "You"}
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
              aria-label="Message SABI"
              placeholder="Wetin you enjoy, wetin you sabi, or just say hi..."
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
          No one-size-fits-all path. Your next step, your pace.
          </p>
        </div>
      </section>
    </main>
  );
}
