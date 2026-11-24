import { useRef, useState } from "react";
import Icon from "../ui/Icon";
import { Avatar, Notice, PageHead } from "../ui/bits";
import { getProfile, saveProfile } from "../utils/store";

// Shrinks the chosen picture to a 256px square so it is small enough to keep in the browser.
const toAvatar = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const side = Math.min(img.width, img.height);
      canvas
        .getContext("2d")
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });

const Profile = () => {
  const [form, setForm] = useState(getProfile);
  const [saved, setSaved] = useState(getProfile);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileRef = useRef(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = (e) => {
    setMessage("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("Please choose an image file (JPG, PNG or WebP)");
    if (file.size > 8 * 1024 * 1024) return setError("That image is too large. Choose one under 8 MB");
    try {
      const image = await toAvatar(file);
      setMessage("");
      setForm((f) => ({ ...f, image }));
    } catch {
      setError("Could not read that image");
    }
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Your name cannot be empty");
    const next = { ...form, name: form.name.trim() };
    if (!saveProfile(next)) return setError("Could not save. Your browser storage may be full or blocked");
    setForm(next);
    setSaved(next);
    setMessage("Profile updated");
  };

  return (
    <>
      <PageHead title="Profile" sub="Your name, photo and shop details." />
      <Notice>{error}</Notice>
      <Notice kind="success" onClose={() => setMessage("")}>{message}</Notice>

      <div className="split split-profile">
        <section className="panel profile-card">
          <div className="avatar-edit">
            <Avatar profile={form} size={132} />
            <button type="button" className="avatar-cam" onClick={() => fileRef.current.click()} aria-label="Change photo">
              <Icon name="camera" size={18} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
          </div>
          <h2>{form.name || "Your name"}</h2>
          <p className="muted">{form.shop || "Add your shop name"}</p>
          <div className="stack-sm">
            <button type="button" className="btn btn-ghost btn-block" onClick={() => fileRef.current.click()}>
              <Icon name="camera" size={18} /> {form.image ? "Change photo" : "Upload photo"}
            </button>
            {form.image ? (
              <button type="button" className="btn btn-quiet btn-block" onClick={() => { setMessage(""); setForm({ ...form, image: "" }); }}>
                Remove photo
              </button>
            ) : null}
          </div>
        </section>

        <form className="panel form-panel" onSubmit={submit}>
          <div className="panel-head"><h2>Personal details</h2></div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="pf-name">Full name</label>
              <input id="pf-name" name="name" value={form.name} onChange={set} />
            </div>
            <div className="field">
              <label htmlFor="pf-email">Email</label>
              <input id="pf-email" value={form.email || "Not available"} readOnly aria-describedby="pf-email-help" />
              <small id="pf-email-help" className="muted">This is your login, so it stays fixed.</small>
            </div>
            <div className="field">
              <label htmlFor="pf-phone">Phone</label>
              <input id="pf-phone" name="phone" type="tel" value={form.phone} onChange={set} />
            </div>
            <div className="field">
              <label htmlFor="pf-shop">Shop or business</label>
              <input id="pf-shop" name="shop" value={form.shop} onChange={set} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="pf-loc">Location</label>
            <input id="pf-loc" name="location" value={form.location} onChange={set} />
          </div>

          <div className="field">
            <label htmlFor="pf-bio">About</label>
            <textarea id="pf-bio" name="bio" rows="3" value={form.bio} onChange={set} maxLength={240} />
          </div>

          <p className="muted small">
            Profile details are stored in this browser, not on the server.
          </p>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={() => { setForm(saved); setMessage(""); }}>
              Discard changes
            </button>
            <button type="submit" className="btn btn-primary" disabled={!dirty}>
              Save profile
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Profile;
