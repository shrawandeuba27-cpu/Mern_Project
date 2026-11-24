import { useEffect } from "react";
import Icon from "./Icon";
import { stockStatus } from "../utils/api";

export const StatusPill = ({ qty }) => {
  const s = stockStatus(qty);
  const label = s === "out" ? "Out of stock" : s === "low" ? "Low stock" : "In stock";
  return <span className={`pill pill-${s}`}>{label}</span>;
};

export const Avatar = ({ profile, size = 40 }) => {
  const initial = (profile?.name || "?").trim().charAt(0).toUpperCase();
  return profile?.image ? (
    <img className="avatar" src={profile.image} alt="" style={{ width: size, height: size }} />
  ) : (
    <span className="avatar avatar-letter" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {initial}
    </span>
  );
};

export const PageHead = ({ title, sub, children }) => (
  <div className="page-head">
    <div>
      <h1>{title}</h1>
      {sub ? <p className="muted">{sub}</p> : null}
    </div>
    <div className="page-head-actions">{children}</div>
  </div>
);

export const Notice = ({ kind = "error", children, onClose }) =>
  children ? (
    <div className={`notice notice-${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span>{children}</span>
      {onClose ? (
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Dismiss">
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </div>
  ) : null;

export const Modal = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Empty = ({ icon = "box", title, text, children }) => (
  <div className="empty">
    <span className="empty-icon">
      <Icon name={icon} size={26} />
    </span>
    <strong>{title}</strong>
    {text ? <p className="muted">{text}</p> : null}
    {children}
  </div>
);
