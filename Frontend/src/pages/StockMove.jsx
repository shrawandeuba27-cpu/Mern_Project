import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useProducts from "../hooks/useProducts";
import Icon from "../ui/Icon";
import { Empty, Notice, PageHead, StatusPill } from "../ui/bits";
import { fmtDate } from "../utils/format";
import { errorText, updateProduct } from "../utils/api";
import { MOVE_REASONS, addTransaction, getTransactions } from "../utils/store";

// One page component for both Stock-in and Stock-out: only `type` changes.
const StockMove = ({ type }) => {
  const isIn = type === "in";
  const { products, loading, error, reload } = useProducts();
  const [params] = useSearchParams();
  const [productId, setProductId] = useState(params.get("product") || "");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState(MOVE_REASONS[type][0]);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0); // bumps after saving so the recent list refreshes

  const product = products.find((p) => p._id === productId);
  const amount = Number(qty);
  const after = product && amount > 0 ? product.quantity + (isIn ? amount : -amount) : null;

  const recent = useMemo(
    () => getTransactions().filter((t) => t.type === type).slice(0, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, version],
  );

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    setMessage("");
    if (!product) return setFormError("Choose a product first");
    if (!Number.isInteger(amount) || amount < 1) return setFormError("Quantity must be a whole number of 1 or more");
    if (!isIn && amount > product.quantity) {
      return setFormError(`Only ${product.quantity} in stock, you cannot remove ${amount}`);
    }

    setSaving(true);
    try {
      const saved = await updateProduct(product._id, { ...product, quantity: after });
      addTransaction({
        productId: saved._id,
        productName: saved.name,
        type,
        qty: amount,
        before: product.quantity,
        after: saved.quantity,
        reason,
        note: note.trim(),
      });
      setMessage(
        `${isIn ? "Added" : "Removed"} ${amount} ${isIn ? "to" : "from"} ${saved.name}. Stock is now ${saved.quantity}.`,
      );
      setQty("");
      setNote("");
      setVersion((v) => v + 1);
      reload();
    } catch (err) {
      setFormError(errorText(err, "Could not record the movement"));
    }
    setSaving(false);
  };

  return (
    <>
      <PageHead
        title={isIn ? "Stock-in" : "Stock-out"}
        sub={isIn ? "Record stock you bought or received." : "Record stock you sold, damaged or removed."}
      />

      <Notice>{error}</Notice>
      <Notice kind="success" onClose={() => setMessage("")}>{message}</Notice>

      <div className="split">
        <form className={`panel form-panel move-${type}`} onSubmit={submit}>
          <div className="panel-head">
            <h2>New {isIn ? "stock-in" : "stock-out"}</h2>
            <span className={`tag tag-${type}`}>
              <Icon name={isIn ? "down" : "up"} size={14} /> {isIn ? "Adds to stock" : "Removes from stock"}
            </span>
          </div>

          <Notice>{formError}</Notice>

          <div className="field">
            <label htmlFor="mprod">Product</label>
            <select id="mprod" value={productId} onChange={(e) => setProductId(e.target.value)} disabled={loading}>
              <option value="">{loading ? "Loading..." : "Choose a product"}</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.quantity} in stock)
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="mqty">Quantity</label>
              <input
                id="mqty"
                type="number"
                min="1"
                step="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="field">
              <label htmlFor="mreason">Reason</label>
              <select id="mreason" value={reason} onChange={(e) => setReason(e.target.value)}>
                {MOVE_REASONS[type]
                  .filter((r) => r !== "Manual edit" && r !== "Opening stock")
                  .map((r) => (
                    <option key={r}>{r}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="mnote">Note (optional)</label>
            <input
              id="mnote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isIn ? "e.g. Supplier invoice #204" : "e.g. Order #118"}
              maxLength={120}
            />
          </div>

          {product ? (
            <div className="preview">
              <div>
                <span className="muted small">Current stock</span>
                <strong>{product.quantity}</strong>
              </div>
              <span className="preview-arrow">{isIn ? "+" : "−"}{amount > 0 ? amount : 0}</span>
              <div>
                <span className="muted small">After</span>
                <strong className={after !== null && after <= 0 ? "text-bad" : ""}>{after ?? product.quantity}</strong>
              </div>
              <StatusPill qty={after ?? product.quantity} />
            </div>
          ) : null}

          <button className={`btn ${isIn ? "btn-primary" : "btn-out"} btn-block`} type="submit" disabled={saving || loading}>
            {saving ? "Saving..." : isIn ? "Record stock-in" : "Record stock-out"}
          </button>
        </form>

        <section className="panel">
          <div className="panel-head">
            <h2>Recent {isIn ? "stock-in" : "stock-out"}</h2>
            <Link to="/reports" className="link-sm">View all</Link>
          </div>
          {recent.length === 0 ? (
            <Empty icon="history" title="Nothing recorded yet" text="Entries you save will appear here." />
          ) : (
            <ul className="feed">
              {recent.map((t) => (
                <li key={t.id}>
                  <span className={`feed-dot dot-${t.type}`}>
                    <Icon name={t.type === "in" ? "down" : "up"} size={16} />
                  </span>
                  <div>
                    <strong>{t.productName}</strong>
                    <span className="muted small">{t.reason} · {fmtDate(t.date)}</span>
                  </div>
                  <span className={`feed-qty ${t.type === "in" ? "text-good" : "text-bad"}`}>
                    {t.type === "in" ? "+" : "−"}{t.qty}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
};

export default StockMove;
