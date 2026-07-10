import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChatService } from '../../services/chat';
import type { Message, ChatConnection } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${dim} rounded-full object-cover shrink-0`}
      />
    );
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white`}
    >
      {initials}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function groupByDate(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = [];
  let lastLabel = '';
  for (const msg of messages) {
    const d = new Date(msg.created_at);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
    let label: string;
    if (diffDays === 0) label = 'Today';
    else if (diffDays === 1) label = 'Yesterday';
    else label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    if (label !== lastLabel) {
      groups.push({ label, messages: [msg] });
      lastLabel = label;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversation list (left panel)
// ─────────────────────────────────────────────────────────────────────────────

function ConversationList({
  connections,
  loading,
  error,
  activeId,
  onSelect,
}: {
  connections: ChatConnection[];
  loading: boolean;
  error: string | null;
  activeId: string | null;
  onSelect: (c: ChatConnection) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-100 px-4 py-3.5">
        <h2 className="text-base font-bold text-gray-900">Messages</h2>
        <p className="text-xs text-gray-400 mt-0.5">Your active mentorship chats</p>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-100 border-t-primary" />
        </div>
      )}

      {error && !loading && (
        <div className="m-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && connections.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <span className="text-4xl">💬</span>
          <p className="text-sm font-semibold text-gray-700">No conversations yet</p>
          <p className="text-xs text-gray-400">
            Accept or receive a mentorship request to start chatting.
          </p>
        </div>
      )}

      <ul className="flex-1 overflow-y-auto">
        {connections.map((conn) => {
          const isActive = conn.connection_id === activeId;
          return (
            <li key={conn.connection_id}>
              <button
                onClick={() => onSelect(conn)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 border-r-2 border-indigo-600'
                    : 'hover:bg-gray-50 border-r-2 border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={conn.other_user_name} avatarUrl={conn.other_user_avatar} />
                  {conn.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                      {conn.unread_count > 9 ? '9+' : conn.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span
                      className={`truncate text-sm ${
                        conn.unread_count > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'
                      }`}
                    >
                      {conn.other_user_name}
                    </span>
                    {conn.last_message_at && (
                      <span className="shrink-0 text-[10px] text-gray-400">
                        {formatTime(conn.last_message_at)}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-0.5 truncate text-xs ${
                      conn.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'
                    }`}
                  >
                    {conn.last_message ?? (
                      <span className="italic">
                        {conn.other_user_role === 'mentor' ? 'Your mentor' : 'Your learner'}
                      </span>
                    )}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat window (right panel)
// ─────────────────────────────────────────────────────────────────────────────

function ChatWindow({
  connection,
  currentUserId,
  onBack,
}: {
  connection: ChatConnection;
  currentUserId: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load messages + mark as read
  const loadMessages = useCallback(async () => {
    setLoadingMsgs(true);
    setMsgError(null);
    const res = await ChatService.getMessages(connection.connection_id);
    if (res.error) {
      setMsgError(res.error);
    } else {
      setMessages(res.data ?? []);
      // Mark all incoming as read silently
      await ChatService.markConnectionRead(connection.connection_id, currentUserId);
    }
    setLoadingMsgs(false);
  }, [connection.connection_id, currentUserId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    const channel = ChatService.subscribeToMessages(
      connection.connection_id,
      (newMsg) => {
        setMessages((prev) => {
          // Avoid duplicates (optimistic + realtime)
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        // Auto-mark read if it's incoming
        if (newMsg.receiver_id === currentUserId) {
          ChatService.markConnectionRead(connection.connection_id, currentUserId);
        }
      },
    );
    return () => {
      channel.unsubscribe();
    };
  }, [connection.connection_id, currentUserId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setSendError(null);

    // Optimistic insert
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      connection_id: connection.connection_id,
      sender_id: currentUserId,
      receiver_id: connection.other_user_id,
      content: trimmed,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    textareaRef.current?.focus();

    const res = await ChatService.sendMessage(
      connection.connection_id,
      currentUserId,
      connection.other_user_id,
      trimmed,
    );

    if (res.error) {
      // Roll back optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(trimmed); // restore text
      setSendError(res.error);
    } else {
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? (res.data as Message) : m)),
      );
    }
    setSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const groups = groupByDate(messages);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        {/* Back button — shown on mobile or always as navigation */}
        <button
          onClick={onBack}
          className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer md:hidden"
          aria-label="Back to conversations"
        >
          ←
        </button>
        <Avatar name={connection.other_user_name} avatarUrl={connection.other_user_avatar} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{connection.other_user_name}</p>
          <p className="text-[10px] text-gray-400 capitalize">
            {connection.other_user_role === 'mentor' ? '✦ Your Mentor' : '✦ Your Learner'}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50/50">
        {loadingMsgs && (
          <div className="flex items-center justify-center py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-100 border-t-primary" />
          </div>
        )}

        {msgError && !loadingMsgs && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700 text-center">
            {msgError}
            <button onClick={loadMessages} className="ml-1 underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {!loadingMsgs && !msgError && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <span className="text-5xl">👋</span>
            <p className="text-sm font-semibold text-gray-700">
              Start the conversation!
            </p>
            <p className="text-xs text-gray-400 max-w-xs">
              Say hello to {connection.other_user_name}. You can ask questions, share goals, or schedule your first session.
            </p>
          </div>
        )}

        {!loadingMsgs &&
          groups.map((group) => (
            <div key={group.label}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 border-t border-gray-200" />
                <span className="shrink-0 rounded-full bg-gray-200 px-3 py-0.5 text-[10px] font-semibold text-gray-500">
                  {group.label}
                </span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {group.messages.map((msg) => {
                const isMine = msg.sender_id === currentUserId;
                const isOptimistic = msg.id.startsWith('opt-');
                return (
                  <div
                    key={msg.id}
                    className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMine && (
                      <Avatar
                        name={connection.other_user_name}
                        avatarUrl={connection.other_user_avatar}
                        size="sm"
                      />
                    )}
                    <div
                      className={`mx-2 max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isMine
                          ? 'rounded-br-sm bg-primary text-white'
                          : 'rounded-bl-sm bg-white text-gray-800 border border-gray-100'
                      } ${isOptimistic ? 'opacity-70' : ''}`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p
                        className={`mt-1 text-right text-[10px] ${
                          isMine ? 'text-primary-200' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                        {isMine && (
                          <span className="ml-1">
                            {isOptimistic ? '·' : msg.is_read ? ' ✓✓' : ' ✓'}
                          </span>
                        )}
                      </p>
                    </div>
                    {isMine && (
                      <div className="w-8 shrink-0" /> /* spacer to match avatar on other side */
                    )}
                  </div>
                );
              })}
            </div>
          ))}

        <div ref={bottomRef} />
      </div>

      {/* Send error */}
      {sendError && (
        <div className="shrink-0 border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
          ⚠ {sendError}
          <button
            onClick={() => setSendError(null)}
            className="ml-2 text-red-500 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={handleFormSubmit}
        className="shrink-0 border-t border-gray-100 bg-white px-4 py-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              // Auto-grow up to ~5 lines
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            maxLength={2000}
            className="flex-1 resize-none overflow-hidden rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors"
            style={{ minHeight: '42px' }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {sending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 translate-x-0.5"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </div>
        {text.length > 1800 && (
          <p className="mt-1 text-right text-[10px] text-gray-400">{text.length}/2000</p>
        )}
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root page — wires inbox list + chat window together
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user } = useAuth();
  const { connectionId } = useParams<{ connectionId?: string }>();
  const navigate = useNavigate();

  const [connections, setConnections] = useState<ChatConnection[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [activeConn, setActiveConn] = useState<ChatConnection | null>(null);

  const loadConnections = useCallback(async () => {
    if (!user?.id) return;
    setLoadingList(true);
    setListError(null);
    const res = await ChatService.getConnections(user.id);
    if (res.error) {
      setListError(res.error);
    } else {
      const list = res.data ?? [];
      setConnections(list);

      // Auto-select from URL param or first conversation
      if (connectionId) {
        const match = list.find((c) => c.connection_id === connectionId);
        if (match) setActiveConn(match);
      } else if (list.length > 0 && !activeConn) {
        // On desktop, auto-open the first conversation
        setActiveConn(list[0]);
      }
    }
    setLoadingList(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, connectionId]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleSelect = (conn: ChatConnection) => {
    setActiveConn(conn);
    navigate(`/chat/${conn.connection_id}`, { replace: true });
    // Optimistically clear unread badge
    setConnections((prev) =>
      prev.map((c) =>
        c.connection_id === conn.connection_id ? { ...c, unread_count: 0 } : c,
      ),
    );
  };

  const handleBack = () => {
    setActiveConn(null);
    navigate('/chat', { replace: true });
  };

  // On mobile: show either list or window, not both
  // On desktop (md+): show both panels side-by-side
  const showList = !activeConn; // mobile: show list when no active convo
  const showWindow = !!activeConn;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-none md:rounded-2xl md:border md:border-gray-100 md:shadow-sm">
      {/* Left panel — conversation list */}
      <div
        className={`${
          showList ? 'flex' : 'hidden'
        } w-full flex-col bg-white md:flex md:w-72 md:shrink-0 md:border-r md:border-gray-100`}
      >
        <ConversationList
          connections={connections}
          loading={loadingList}
          error={listError}
          activeId={activeConn?.connection_id ?? null}
          onSelect={handleSelect}
        />
      </div>

      {/* Right panel — chat window */}
      <div
        className={`${
          showWindow ? 'flex' : 'hidden'
        } flex-1 flex-col bg-white md:flex`}
      >
        {activeConn && user?.id ? (
          <ChatWindow
            key={activeConn.connection_id}
            connection={activeConn}
            currentUserId={user.id}
            onBack={handleBack}
          />
        ) : (
          /* Empty state shown on desktop when no conversation is selected */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
            <span className="text-6xl">💬</span>
            <p className="text-lg font-bold text-gray-800">Select a conversation</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Choose a mentor or learner from the list to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
