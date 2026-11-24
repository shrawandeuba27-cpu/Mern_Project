import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Icon from "../ui/Icon";
import { Empty, Notice, PageHead, StatusPill } from "../ui/bits";
import { fmtDate } from "../utils/format";
import { clearSession, errorText, fetchProduct, money } from "../utils/api";
import { getTransactions } from "../utils/store";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const p = await fetchProduct(id);
        if (alive) setProduct(p);
      } catch (err) {
        if (err.response?.status === 401) {
          clearSession();
          navigate("/");
          return;
        }
        if (alive) setError(errorText(err, "Product not found"));
      }
      if (alive) setLoading(false);
    };
    run();
    return () => {
      alive = false;
    };
  }, [id, navigate]);

  const history = getTransactions().filter((t) => t.productId === id);

  return (
    <>
      <Link to="/products" className="back-link">
        <Icon name="back" size={16} /> All products
      </Link>
      <Notice>{error}</Notice>
      {loading ? <p className="muted">Loading product...</p> : null}

      {product ? (
        <>
          <PageHead title={product.name} sub={product.category}>
            <Link className="btn btn-ghost" to={`/stock-out?product=${id}`}>
              <Icon name="up" size={18} /> Stock-out
            </Link>
            <Link className="btn btn-primary" to={`/stock-in?product=${id}`}>
              <Icon name="down" size={18} /> Stock-in
            </Link>
          </PageHead>

          <div className="stats stats-3">
            <div className="stat">
              <span className="stat-label">In stock</span>
              <span className="stat-value">{product.quantity}</span>
              <StatusPill qty={product.quantity} />
            </div>
            <div className="stat">
              <span className="stat-label">Price</span>
              <span className="stat-value">{money(product.price)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Stock value</span>
              <span className="stat-value">{money(product.price * product.quantity)}</span>
            </div>
          </div>

          <section className="panel">
            <div className="panel-head">
              <h2>Movement history</h2>
              <span className="muted small">Added {fmtDate(product.createdAt)}</span>
            </div>
            {history.length === 0 ? (
              <Empty icon="history" title="No movements recorded" text="Stock-in and stock-out for this product will show up here." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th className="num">Qty</th>
                      <th className="num">Stock after</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((t) => (
                      <tr key={t.id}>
                        <td data-label="Date">{fmtDate(t.date)}</td>
                        <td data-label="Type"><span className={`tag tag-${t.type}`}>{t.type === "in" ? "Stock-in" : "Stock-out"}</span></td>
                        <td data-label="Reason">{t.reason}</td>
                        <td data-label="Qty" className="num">{t.type === "in" ? "+" : "−"}{t.qty}</td>
                        <td data-label="Stock after" className="num">{t.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </>
  );
};

export default ProductDetail;
