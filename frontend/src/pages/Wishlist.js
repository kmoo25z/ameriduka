import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { Navbar, Footer } from "../components/shared/Layout";
import ProductCard from "../components/shared/ProductCard";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Heart, Trash2 } from "lucide-react";

const Wishlist = () => {
  const { authAxios } = useAuth();
  const [wishlist, setWishlist] = useState({ items: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("KES");

  const fetchWishlist = async () => {
    try {
      const response = await authAxios.get("/wishlist");
      setWishlist(response.data);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (productId) => {
    try {
      await authAxios.delete(`/wishlist/${productId}`);
      setWishlist(prev => ({
        items: prev.items.filter(item => item.product_id !== productId),
        count: prev.count - 1
      }));
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const addToCart = async (product) => {
    try {
      await authAxios.post("/cart/add", { product_id: product.product_id, quantity: 1 });
      toast.success("Added to cart!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-white">My Wishlist</h1>
              <p className="text-neutral-400 mt-1">{wishlist.count} items saved</p>
            </div>
            
            {/* Currency Selector */}
            <div className="flex items-center gap-2 bg-card border border-neutral-800 rounded-lg p-1">
              {["KES", "USD", "EUR"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currency === c ? "bg-primary text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          
          {wishlist.items.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 mx-auto text-neutral-700 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Your wishlist is empty</h2>
              <p className="text-neutral-400 mb-6">Save items you love for later</p>
              <Link to="/products">
                <Button className="btn-primary" data-testid="browse-products">
                  Browse Products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlist.items.map((product) => (
                <div key={product.product_id} className="relative">
                  <ProductCard
                    product={product}
                    currency={currency}
                    onAddToCart={addToCart}
                  />
                  <button
                    onClick={() => removeFromWishlist(product.product_id)}
                    className="absolute top-2 right-2 p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-400 transition-colors z-10"
                    data-testid={`remove-wishlist-${product.product_id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Wishlist;
