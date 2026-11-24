import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, errorText, fetchProducts } from "../utils/api";

// Loads the user's products. Logs out automatically if the token is rejected.
const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const list = await fetchProducts();
        if (alive) {
          setProducts(list);
          setError("");
        }
      } catch (err) {
        if (err.response?.status === 401) {
          clearSession();
          navigate("/");
          return;
        }
        if (alive) setError(errorText(err, "Could not load products"));
      }
      if (alive) setLoading(false);
    };
    run();
    return () => {
      alive = false;
    };
  }, [tick, navigate]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { products, loading, error, reload };
};

export default useProducts;
