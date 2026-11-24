import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useProducts from "../hooks/useProducts";
import Icon from "../ui/Icon";
import { Empty, Modal, Notice, PageHead, StatusPill } from "../ui/bits";
import {
  CATEGORIES,
  createProduct,
  deleteProduct,
  errorText,
  money,
  updateProduct,
} from "../utils/api";
import { addTransaction } from "../utils/store";

const blank = { name: "", category: "Electronics", price: "", quantity: "" };

const ProductForm = ({ product, onClose, onSaved }) => {
  const editing = Boolean(product);
  const [form, setForm] = useState(
    editing
      ? { name: product.name, category: product.category, price: product.price, quantity: product.quantity }
      : blank,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || form.price === "" || form.quantity === "") {
      setError("Please fill in name, price and quantity");
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, name: form.name.trim() };
      if (editing) {
        const saved = await updateProduct(product._id, data);
        const diff = Number(saved.quantity) - Number(product.quantity);
        if (diff !== 0) {
          addTransaction({
            productId: saved._id,
            productName: saved.name,
            type: diff > 0 ? "in" : "out",
            qty: Math.abs(diff),
            before: product.quantity,
            after: saved.quantity,
            reason: "Manual edit",
            note: "",
          });
        }
        onSaved(`${saved.name} updated`);
      } else {
        const saved = await createProduct(data);
        if (saved.quantity > 0) {
          addTransaction({
            productId: saved._id,
            productName: saved.name,
            type: "in",
            qty: saved.quantity,
            before: 0,
            after: saved.quantity,
            reason: "Opening stock",
            note: "",
          });
        }
        onSaved(`${saved.name} added to your inventory`);
      }
    } catch (err) {
      setError(errorText(err, "Could not save the product"));
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? "Edit product" : "Add product"} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <Notice>{error}</Notice>
        <div className="field">
          <label htmlFor="pname">Product name</label>
          <input id="pname" name="name" value={form.name} onChange={set} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="pcat">Category</label>
          <select id="pcat" name="category" value={form.category} onChange={set}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="pprice">Price</label>
            <input id="pprice" name="price" type="number" min="0" step="0.01" value={form.price} onChange={set} />
          </div>
          <div className="field">
            <label htmlFor="pqty">Quantity</label>
            <input id="pqty" name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={set} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : editing ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const Products = () => {
  const { products, loading, error, reload } = useProducts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [form, setForm] = useState(null); // null = closed, {} = new, product = edit
  const [removing, setRemoving] = useState(null);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
    );
  }, [products, query, category]);

  const saved = (text) => {
    setForm(null);
    setMessage(text);
    reload();
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(removing._id);
      setMessage(`${removing.name} deleted`);
      setRemoving(null);
      reload();
    } catch (err) {
      setActionError(errorText(err, "Could not delete the product"));
      setRemoving(null);
    }
  };

  return (
    <>
      <PageHead title="Products" sub="Add, edit and keep track of everything you sell.">
        <button className="btn btn-primary" onClick={() => setForm({})}>
          <Icon name="plus" size={18} /> Add product
        </button>
      </PageHead>

      <Notice kind="success" onClose={() => setMessage("")}>{message}</Notice>
      <Notice onClose={() => setActionError("")}>{actionError}</Notice>
      <Notice>{error}</Notice>

      <section className="panel">
        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search by name or category"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </label>
          <div className="chips" role="group" aria-label="Filter by category">
            {["All", ...CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                className={category === c ? "chip on" : "chip"}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="muted pad">Loading products...</p>
        ) : products.length === 0 ? (
          <Empty title="No products yet" text="Add your first product to start tracking stock.">
            <button className="btn btn-primary" onClick={() => setForm({})}>
              <Icon name="plus" size={18} /> Add product
            </button>
          </Empty>
        ) : shown.length === 0 ? (
          <Empty icon="search" title="Nothing matches" text="Try a different word or category." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="num">Price</th>
                  <th className="num">Quantity</th>
                  <th>Status</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p._id}>
                    <td data-label="Product">
                      <Link to={`/product/${p._id}`} className="row-title">
                        {p.name}
                      </Link>
                    </td>
                    <td data-label="Category">{p.category}</td>
                    <td data-label="Price" className="num">{money(p.price)}</td>
                    <td data-label="Quantity" className="num">{p.quantity}</td>
                    <td data-label="Status"><StatusPill qty={p.quantity} /></td>
                    <td data-label="Actions" className="num">
                      <div className="row-actions">
                        <Link to={`/product/${p._id}`} className="icon-btn" aria-label={`View ${p.name}`} title="View">
                          <Icon name="eye" size={18} />
                        </Link>
                        <button className="icon-btn" onClick={() => setForm(p)} aria-label={`Edit ${p.name}`} title="Edit">
                          <Icon name="edit" size={18} />
                        </button>
                        <button className="icon-btn danger" onClick={() => setRemoving(p)} aria-label={`Delete ${p.name}`} title="Delete">
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {form ? (
        <ProductForm product={form._id ? form : null} onClose={() => setForm(null)} onSaved={saved} />
      ) : null}

      {removing ? (
        <Modal title="Delete product?" onClose={() => setRemoving(null)}>
          <p>
            <strong>{removing.name}</strong> will be removed from your inventory. Its past stock movements stay in
            Reports.
          </p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setRemoving(null)}>
              Keep it
            </button>
            <button className="btn btn-danger" onClick={confirmDelete}>
              Delete
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
};

export default Products;
