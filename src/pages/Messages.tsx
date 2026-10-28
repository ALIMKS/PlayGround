import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCheck, Send } from "lucide-react";
import { useStore } from "../store";

const QUICK_REPLIES = [
  "Est-il possible d'arriver plus tôt ?",
  "Le logement est-il adapté à un enfant en bas âge ?",
  "Où se garer à proximité ?",
];

export function Messages() {
  const { conversationId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const {
    conversations,
    getListing,
    sendMessage,
    markConversationRead,
    startConversation,
  } = useStore();
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const to = params.get("to");
  const listingParam = params.get("listing");

  useEffect(() => {
    if (!to || !listingParam) return;
    const id = startConversation(to, listingParam);
    navigate(`/messages/${id}`, { replace: true });
  }, [to, listingParam, startConversation, navigate]);

  const sorted = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const lastA = a.messages[a.messages.length - 1]?.at ?? "";
        const lastB = b.messages[b.messages.length - 1]?.at ?? "";
        return lastB.localeCompare(lastA);
      }),
    [conversations],
  );

  const selectedId = conversationId ?? sorted[0]?.id;
  const conversation = sorted.find((item) => item.id === selectedId);
  const listing = conversation ? getListing(conversation.listingId) : undefined;

  useEffect(() => {
    if (conversation) markConversationRead(conversation.id);
  }, [conversation, markConversationRead]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const frame = window.requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [conversation?.messages.length, typing]);

  const send = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!conversation || !draft.trim()) return;
    sendMessage(conversation.id, draft);
    setDraft("");
    setTyping(true);
    window.setTimeout(() => setTyping(false), 1900);
  };

  return (
    <div className="messages-page">
      <div className="container messages-shell">
        <aside className={`conversation-list${conversationId ? " has-selection" : ""}`}>
          <header className="conversation-head">
            <h1>Messages</h1>
            <span>{conversations.reduce((sum, item) => sum + item.unread, 0)} non lus</span>
          </header>
          <div className="conversation-items">
            {sorted.map((item) => {
              const itemListing = getListing(item.listingId);
              const last = item.messages[item.messages.length - 1];
              return (
                <Link
                  key={item.id}
                  to={`/messages/${item.id}`}
                  className={`conversation-item${item.id === selectedId ? " is-active" : ""}`}
                >
                  <span className="avatar">{item.initials}</span>
                  <span className="conversation-copy">
                    <span className="conversation-line">
                      <strong>{item.personName}</strong>
                      <em>{last ? formatTime(last.at) : ""}</em>
                    </span>
                    <span className="conversation-subject">{itemListing?.title}</span>
                    <span className="conversation-preview">
                      {last?.from === "me" ? "Vous : " : ""}
                      {last?.text}
                    </span>
                  </span>
                  {item.unread > 0 && <span className="unread-dot">{item.unread}</span>}
                </Link>
              );
            })}
          </div>
          <div className="conversation-foot">
            <p>
              Vos échanges restent dans ce navigateur. En production, ils seraient chiffrés
              et liés à la réservation.
            </p>
          </div>
        </aside>

        <section className={`chat${conversation ? "" : " chat--empty"}`}>
          {conversation ? (
            <>
              <header className="chat-head">
                <Link to="/messages" className="chat-back" aria-label="Retour aux messages">
                  <ArrowLeft size={18} />
                </Link>
                <span className="avatar">{conversation.initials}</span>
                <div className="chat-who">
                  <strong>{conversation.personName}</strong>
                  <em>
                    {listing ? `${listing.title} · ${listing.city}` : "Conversation"}
                  </em>
                </div>
                {listing && (
                  <Link to={`/listing/${listing.id}`} className="btn btn--outline btn--small">
                    <span>Voir l'annonce</span> <ArrowRight size={14} />
                  </Link>
                )}
              </header>

              <div className="chat-scroll" ref={scrollRef}>
                <div className="chat-intro">
                  <span className="avatar avatar--lg">{conversation.initials}</span>
                  <h2>{conversation.personName}</h2>
                  {listing && (
                    <p>
                      Conversation à propos de <strong>{listing.title}</strong> ·{" "}
                      {listing.city}
                    </p>
                  )}
                </div>
                {conversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`bubble-row${message.from === "me" ? " is-me" : ""}`}
                  >
                    {message.from === "them" && (
                      <span className="avatar avatar--xs">{conversation.initials}</span>
                    )}
                    <div className="bubble">
                      <p>{message.text}</p>
                      <span className="bubble-meta">
                        {formatTime(message.at)}
                        {message.from === "me" && <CheckCheck size={12} />}
                      </span>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="bubble-row">
                    <span className="avatar avatar--xs">{conversation.initials}</span>
                    <div className="bubble bubble--typing" aria-label="En train d'écrire">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
              </div>

              <form className="chat-compose" onSubmit={send}>
                <div className="quick-replies">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      type="button"
                      key={reply}
                      onClick={() => setDraft(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
                <div className="compose-row">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Écrire à ${conversation.personName.split(" ")[0]}…`}
                    aria-label="Votre message"
                  />
                  <button
                    type="submit"
                    className="send-btn"
                    disabled={!draft.trim()}
                    aria-label="Envoyer"
                  >
                    <Send size={17} />
                  </button>
                </div>
                <p className="compose-note">
                  Pour votre sécurité, ne partagez pas vos coordonnées bancaires par
                  message.
                </p>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              <h2>Vos conversations</h2>
              <p>
                Contactez un hôte depuis une annonce pour poser vos questions avant de
                réserver.
              </p>
              <Link to="/search" className="btn btn--primary">
                Explorer les séjours
              </Link>
            </div>
          )}
        </section>
      </div>
      <span className="sr-only" aria-live="polite">
        {typing ? "Votre hôte est en train d'écrire" : ""}
      </span>
    </div>
  );
}

function formatTime(value: string): string {
  const time = value.split("T")[1] ?? "";
  return time.slice(0, 5);
}
