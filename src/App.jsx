import { useEffect, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'
const STORAGE_KEY = 'policydesk-conversations'
const suggestions = [
  {
    icon: 'clock',
    title: 'Working hours',
    question: 'According to the company policy handbook, what are the standard working hours?',
  },
  {
    icon: 'calendar',
    title: 'Leave policy',
    question: 'According to the company policy handbook, how many casual leave and sick leave days do employees receive?',
  },
  {
    icon: 'laptop',
    title: 'Remote work',
    question: 'According to the company policy handbook, what are the requirements for working remotely?',
  },
  {
    icon: 'receipt',
    title: 'Expenses',
    question: 'According to the company policy handbook, how do I submit an expense for reimbursement?',
  },
]

function Icon({ name, size = 18 }) {
  const paths = {
    add: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    arrow: <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
    laptop: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M2 21h20" /></>,
    receipt: <><path d="M4 3v18l4-2 4 2 4-2 4 2V3l-4 2-4-2-4 2z" /><path d="M8 9h8M8 13h6" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function createConversation() {
  return {
    id: crypto.randomUUID(),
    title: 'New conversation',
    updatedAt: Date.now(),
    messages: [],
  }
}

function readConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(saved)
      ? saved.filter(
          (chat) =>
            chat &&
            typeof chat.id === 'string' &&
            Array.isArray(chat.messages),
        )
      : []
  } catch {
    return []
  }
}

function App() {
  const [conversations, setConversations] = useState(readConversations)
  const [activeId, setActiveId] = useState(() => {
    const saved = readConversations()
    return saved[0]?.id || null
  })
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiOnline, setApiOnline] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const inputRef = useRef(null)
  const chatAreaRef = useRef(null)

  const activeChat = conversations.find((chat) => chat.id === activeId)
  const hasMessages = Boolean(activeChat?.messages.length)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  }, [conversations])

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((response) => {
        setApiOnline(response.ok)
      })
      .catch(() => setApiOnline(false))
  }, [])

  useEffect(() => {
    const chatArea = chatAreaRef.current
    if (!chatArea) return
    if (!hasMessages) {
      chatArea.scrollTop = 0
      return
    }
    chatArea.scrollTop = chatArea.scrollHeight
  }, [activeId, activeChat?.messages, loading])

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`
  }, [draft])

  function updateConversation(id, updater) {
    setConversations((current) =>
      current.map((chat) => (chat.id === id ? updater(chat) : chat)),
    )
  }

  function startNewChat() {
    const chat = createConversation()
    setConversations((current) => [chat, ...current])
    setActiveId(chat.id)
    setDraft('')
    setError('')
    setSidebarOpen(false)
    inputRef.current?.focus()
  }

  function clearChat() {
    const chat = createConversation()
    setConversations((current) => [chat, ...current.filter((item) => item.id !== activeId)])
    setActiveId(chat.id)
    setDraft('')
    setError('')
  }

  function chooseChat(id) {
    setActiveId(id)
    setDraft('')
    setError('')
    setSidebarOpen(false)
  }

  async function sendMessage(text = draft) {
    const message = text.trim()
    if (!message || loading) return

    const chat = activeChat || createConversation()
    const chatId = chat.id
    if (!activeChat) {
      setConversations((current) => [chat, ...current])
      setActiveId(chatId)
    }

    const userMessage = { role: 'user', content: message }
    setError('')
    setDraft('')
    setLoading(true)
    updateConversation(chatId, (current) => ({
      ...current,
      title: current.messages.length ? current.title : message.slice(0, 42),
      updatedAt: Date.now(),
      messages: [...current.messages, userMessage],
    }))

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: chatId, message }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.detail || 'The assistant could not complete your request.')
      }
      if (typeof payload.answer !== 'string' || !payload.answer.trim()) {
        throw new Error('The assistant returned an empty response. Please try again.')
      }

      updateConversation(chatId, (current) => ({
        ...current,
        updatedAt: Date.now(),
        messages: [...current.messages, { role: 'assistant', content: payload.answer }],
      }))
    } catch (requestError) {
      updateConversation(chatId, (current) => ({
        ...current,
        messages: current.messages.filter((item) => item !== userMessage),
      }))
      setDraft(message)
      setError(requestError.message || 'Unable to reach the assistant. Please try again.')
      setApiOnline(false)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage()
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  function chooseSuggestion(question) {
    setDraft(question)
    inputRef.current?.focus()
  }

  const recentConversations = conversations
    .filter((chat) => chat.messages.length)
    .sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Icon name="sparkle" size={19} /></div>
          <div className="brand-copy">
            <span className="brand-name">PolicyDesk</span>
            <span className="brand-caption">KNOWLEDGE ASSISTANT</span>
          </div>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>

        <button className="new-chat-button" onClick={startNewChat}>
          <Icon name="add" size={19} />
          <span>New conversation</span>
          <span className="new-chat-shortcut">⌘ K</span>
        </button>

        <div className="sidebar-section">
          <div className="section-label">YOUR CHATS</div>
          {recentConversations.length ? (
            <div className="conversation-list">
              {recentConversations.map((chat) => (
                <button
                  className={`conversation-link ${chat.id === activeId ? 'conversation-active' : ''}`}
                  key={chat.id}
                  onClick={() => chooseChat(chat.id)}
                  title={chat.title}
                >
                  <Icon name="message" size={16} />
                  <span>{chat.title || 'New conversation'}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-history">Your conversations will appear here.</p>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="source-card">
            <div className="source-icon"><Icon name="document" size={17} /></div>
            <div className="source-copy">
              <span className="source-title">Knowledge source</span>
              <span className="source-name">Company policy handbook</span>
            </div>
            <span className="source-dot" />
          </div>
          <div className="sidebar-footer">
            <span className={`connection-dot ${apiOnline === false ? 'connection-offline' : ''}`} />
            <span>{apiOnline === false ? 'API unavailable' : apiOnline ? 'Connected to assistant' : 'Connecting to assistant'}</span>
            <span className="footer-version">RAG · v1.0</span>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <div className="topbar-context">
            <span className="topbar-title">Company handbook</span>
            <span className="topbar-divider">/</span>
            <span className="topbar-subtitle">{hasMessages ? activeChat.title : 'Ask anything'}</span>
          </div>
          <button className="clear-button" onClick={clearChat} disabled={!hasMessages} title="Clear this conversation">
            <Icon name="trash" size={16} />
            <span>Clear chat</span>
          </button>
        </header>

        <section ref={chatAreaRef} className="chat-area">
          {hasMessages ? (
            <div className="message-list">
              {activeChat.messages.map((message, index) => (
                <article className={`message-row message-${message.role}`} key={`${activeChat.id}-${index}`}>
                  <div className={`avatar avatar-${message.role}`}>
                    {message.role === 'assistant' ? <Icon name="sparkle" size={17} /> : 'Y'}
                  </div>
                  <div className="message-content">
                    <div className="message-author">{message.role === 'assistant' ? 'PolicyDesk' : 'You'}</div>
                    <div className="message-text">{message.content}</div>
                  </div>
                </article>
              ))}
              {loading && (
                <article className="message-row message-assistant">
                  <div className="avatar avatar-assistant"><Icon name="sparkle" size={17} /></div>
                  <div className="message-content">
                    <div className="message-author">PolicyDesk</div>
                    <div className="typing-indicator" aria-label="Generating response"><i /><i /><i /></div>
                  </div>
                </article>
              )}
            </div>
          ) : (
            <div className="welcome">
              <div className="welcome-badge"><span className="badge-spark"><Icon name="sparkle" size={14} /></span> YOUR HANDBOOK, MADE SIMPLE</div>
              <h1>Good questions deserve<br /><span>clear answers.</span></h1>
              <p className="welcome-description">
                Ask about your company policies. I’ll find the answer in the handbook and help you make sense of it.
              </p>
              <div className="suggestion-grid">
                {suggestions.map((item) => (
                  <button className="suggestion-card" key={item.title} onClick={() => chooseSuggestion(item.question)}>
                    <span className="suggestion-icon"><Icon name={item.icon} size={17} /></span>
                    <span className="suggestion-copy"><strong>{item.title}</strong><span>{item.question}</span></span>
                    <span className="suggestion-arrow"><Icon name="arrow" size={15} /></span>
                  </button>
                ))}
              </div>
              <div className="welcome-footnote">
                <span className="footnote-line" />
                Answers grounded in your company policy handbook
                <span className="footnote-line" />
              </div>
            </div>
          )}
          {error && <div className="error-banner" role="alert">{error}</div>}
        </section>

        <div className="composer-wrap">
          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your handbook..."
              rows={1}
              aria-label="Message"
              disabled={loading}
            />
            <div className="composer-bottom">
              <span className="composer-hint"><span className="keyboard-key">↵</span> to send <span className="hint-divider">·</span> <span className="keyboard-key">⇧ ↵</span> for a new line</span>
              <button className="send-button" type="submit" disabled={!draft.trim() || loading} aria-label="Send message">
                <Icon name="send" size={17} />
              </button>
            </div>
          </form>
          <p className="disclaimer">PolicyDesk can make mistakes. Please verify important information with HR.</p>
        </div>
      </main>
    </div>
  )
}

export default App
