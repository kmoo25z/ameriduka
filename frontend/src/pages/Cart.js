import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API, useAuth } from "../App";
import { Navbar, Footer } from "../components/shared/Layout";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";

const Cart = () => {
  const { authAxios } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal_usd: 0, subtotal_local: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [currency, setCurrency] = useState("KES");

  const exchangeRates = { USD: 1, KES: 129.5, EUR: 0.92 };
  const rate = exchangeRates[currency] || 1;
  const currencySymbols = { USD: "$", KES: "KES ", EUR: "€" };
  const symbol = currencySymbols[currency] || "$";

  const fetchCart = async () => {
    try {
      const response = await authAxios.get(`/cart?currency=${currency}`);
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [currency]);

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 0) return;
    setUpdating(productId);
    try {
      await authAxios.put("/cart/update", { product_id: productId, quantity: newQuantity });
      await fetchCart();
      if (newQuantity === 0) {
        toast.success("Item removed from cart");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update cart");
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    try {
      await authAxios.delete("/cart/clear");
      setCart({ items: [], subtotal_usd: 0, subtotal_local: 0 });
      toast.success("Cart cleared");
    } catch (error) {
      toast.error("Failed to clear cart");
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
            <h1 className="font-heading text-3xl font-bold text-white">Shopping Cart</h1>
            
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
          
          {cart.items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-16 w-16 mx-auto text-neutral-700 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
              <p className="text-neutral-400 mb-6">Add some products to get started</p>
              <Link to="/products">
                <Button className="btn-primary" data-testid="continue-shopping">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.product_id}
                    className="glass-card p-4 flex gap-4"
                    data-testid={`cart-item-${item.product_id}`}
                  >
                    <Link to={`/products/${item.product_id}`} className="flex-shrink-0">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-900">
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&q=80"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product_id}`}>
                        <h3 className="font-semibold text-white hover:text-primary transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-lg font-bold text-white mt-1">
                        {symbol}{(item.price_usd * rate).toFixed(2)}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-neutral-800 rounded-lg">
                          <button
                            className="p-2 hover:bg-neutral-800/50 transition-colors disabled:opacity-50"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            disabled={updating === item.product_id}
                            data-testid={`decrease-${item.product_id}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 font-medium">{item.quantity}</span>
                          <button
                            className="p-2 hover:bg-neutral-800/50 transition-colors disabled:opacity-50"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={updating === item.product_id || item.quantity >= item.stock}
                            data-testid={`increase-${item.product_id}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => updateQuantity(item.product_id, 0)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          disabled={updating === item.product_id}
                          data-testid={`remove-${item.product_id}`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                    onClick={clearCart}
                    data-testid="clear-cart"
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="glass-card p-6 sticky top-24">
                  <h2 className="font-heading text-xl font-semibold text-white mb-6">Order Summary</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-neutral-400">
                      <span>Subtotal ({cart.items.length} items)</span>
                      <span className="text-white">{symbol}{(cart.subtotal_usd * rate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Shipping</span>
                      <span className="text-white">Calculated at checkout</span>
                    </div>
                    
                    <div className="border-t border-neutral-800 pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-white">Total</span>
                        <span className="text-white" data-testid="cart-total">
                          {symbol}{(cart.subtotal_usd * rate).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Taxes included</p>
                    </div>
                  </div>
                  
                  <Button
                    className="btn-primary w-full mt-6"
                    onClick={() => navigate("/checkout")}
                    data-testid="proceed-to-checkout"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Link to="/products" className="block mt-4">
                    <Button variant="ghost" className="w-full text-neutral-400">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Cart;
