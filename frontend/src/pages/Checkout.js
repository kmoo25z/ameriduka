import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API, useAuth } from "../App";
import { Navbar, Footer } from "../components/shared/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { CreditCard, Smartphone, Wallet, CheckCircle, Loader2 } from "lucide-react";

const Checkout = () => {
  const { authAxios, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cart, setCart] = useState({ items: [], subtotal_usd: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState("KES");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  
  const [formData, setFormData] = useState({
    shipping_address: "",
    shipping_city: "",
    shipping_country: "Kenya",
    phone: user?.phone || "",
    notes: "",
  });

  const exchangeRates = { USD: 1, KES: 129.5, EUR: 0.92 };
  const rate = exchangeRates[currency] || 1;
  const currencySymbols = { USD: "$", KES: "KES ", EUR: "€" };
  const symbol = currencySymbols[currency] || "$";

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await authAxios.get(`/cart?currency=${currency}`);
        if (response.data.items.length === 0) {
          toast.error("Your cart is empty");
          navigate("/cart");
          return;
        }
        setCart(response.data);
      } catch (error) {
        console.error("Error fetching cart:", error);
        toast.error("Failed to load cart");
        navigate("/cart");
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
    
    // Check for cancelled payment
    if (searchParams.get("cancelled") === "true") {
      toast.error("Payment was cancelled");
    }
  }, [currency]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    try {
      const response = await authAxios.get(`/promos/validate/${promoCode.trim()}`);
      if (response.data.valid) {
        if (cart.subtotal_usd < response.data.min_order_usd) {
          toast.error(`Minimum order of $${response.data.min_order_usd} required`);
          return;
        }
        setDiscount(response.data.discount_percent);
        toast.success(`${response.data.discount_percent}% discount applied!`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid promo code");
      setDiscount(0);
    }
  };

  const shipping = formData.shipping_country === "Kenya" ? 5 : 25;
  const subtotalWithDiscount = cart.subtotal_usd * (1 - discount / 100);
  const total = subtotalWithDiscount + shipping;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.shipping_address || !formData.shipping_city || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create order
      const orderResponse = await authAxios.post("/orders", {
        items: cart.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        shipping_address: formData.shipping_address,
        shipping_city: formData.shipping_city,
        shipping_country: formData.shipping_country,
        phone: formData.phone,
        currency: currency,
        payment_method: paymentMethod,
        notes: formData.notes,
      });
      
      const orderId = orderResponse.data.order_id;
      
      if (paymentMethod === "stripe") {
        // Create Stripe checkout session
        const checkoutResponse = await authAxios.post("/payments/stripe/checkout", {
          order_id: orderId,
          origin_url: window.location.origin,
        });
        
        // Redirect to Stripe
        window.location.href = checkoutResponse.data.url;
      } else if (paymentMethod === "mpesa") {
        toast.info("M-Pesa integration requires Safaricom credentials. Redirecting to order...");
        navigate(`/orders/${orderId}`);
      } else {
        // PayPal - Show message for now
        toast.info("PayPal integration in progress. Order created.");
        navigate(`/orders/${orderId}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.detail || "Failed to process order");
      setSubmitting(false);
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
          <h1 className="font-heading text-3xl font-bold text-white mb-8">Checkout</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-8">
                {/* Shipping Information */}
                <div className="glass-card p-6">
                  <h2 className="font-heading text-xl font-semibold text-white mb-6">Shipping Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm text-neutral-400 mb-2 block">Delivery Address *</label>
                      <Input
                        name="shipping_address"
                        value={formData.shipping_address}
                        onChange={handleInputChange}
                        placeholder="Street address, apartment, etc."
                        className="input-dark"
                        required
                        data-testid="shipping-address"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-neutral-400 mb-2 block">City *</label>
                      <Input
                        name="shipping_city"
                        value={formData.shipping_city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="input-dark"
                        required
                        data-testid="shipping-city"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-neutral-400 mb-2 block">Country *</label>
                      <Select
                        value={formData.shipping_country}
                        onValueChange={(value) => setFormData({ ...formData, shipping_country: value })}
                      >
                        <SelectTrigger className="bg-card border-neutral-800" data-testid="shipping-country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-neutral-800">
                          <SelectItem value="Kenya">Kenya</SelectItem>
                          <SelectItem value="Uganda">Uganda</SelectItem>
                          <SelectItem value="Tanzania">Tanzania</SelectItem>
                          <SelectItem value="Rwanda">Rwanda</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm text-neutral-400 mb-2 block">Phone Number *</label>
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+254 7XX XXX XXX"
                        className="input-dark"
                        required
                        data-testid="phone"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm text-neutral-400 mb-2 block">Order Notes (Optional)</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Special delivery instructions..."
                        className="input-dark w-full h-24 resize-none"
                        data-testid="notes"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Payment Method */}
                <div className="glass-card p-6">
                  <h2 className="font-heading text-xl font-semibold text-white mb-6">Payment Method</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("stripe")}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === "stripe"
                          ? "border-primary bg-primary/10"
                          : "border-neutral-800 hover:border-neutral-700"
                      }`}
                      data-testid="payment-stripe"
                    >
                      <CreditCard className={`h-6 w-6 mb-2 ${paymentMethod === "stripe" ? "text-primary" : "text-neutral-400"}`} />
                      <p className="font-semibold text-white">Card Payment</p>
                      <p className="text-xs text-neutral-500">Visa, Mastercard</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("mpesa")}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === "mpesa"
                          ? "border-primary bg-primary/10"
                          : "border-neutral-800 hover:border-neutral-700"
                      }`}
                      data-testid="payment-mpesa"
                    >
                      <Smartphone className={`h-6 w-6 mb-2 ${paymentMethod === "mpesa" ? "text-primary" : "text-neutral-400"}`} />
                      <p className="font-semibold text-white">M-Pesa</p>
                      <p className="text-xs text-neutral-500">Mobile Money</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("paypal")}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === "paypal"
                          ? "border-primary bg-primary/10"
                          : "border-neutral-800 hover:border-neutral-700"
                      }`}
                      data-testid="payment-paypal"
                    >
                      <Wallet className={`h-6 w-6 mb-2 ${paymentMethod === "paypal" ? "text-primary" : "text-neutral-400"}`} />
                      <p className="font-semibold text-white">PayPal</p>
                      <p className="text-xs text-neutral-500">International</p>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="glass-card p-6 sticky top-24">
                  <h2 className="font-heading text-xl font-semibold text-white mb-6">Order Summary</h2>
                  
                  {/* Currency */}
                  <div className="flex items-center gap-2 mb-4">
                    {["KES", "USD", "EUR"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          currency === c ? "bg-primary text-white" : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  
                  {/* Items */}
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                    {cart.items.map((item) => (
                      <div key={item.product_id} className="flex justify-between text-sm">
                        <span className="text-neutral-400 line-clamp-1 flex-1 mr-2">
                          {item.name} x {item.quantity}
                        </span>
                        <span className="text-white">{symbol}{(item.price_usd * item.quantity * rate).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Promo Code */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="input-dark"
                      data-testid="promo-code"
                    />
                    <Button type="button" variant="outline" className="border-neutral-800" onClick={applyPromoCode}>
                      Apply
                    </Button>
                  </div>
                  
                  {/* Totals */}
                  <div className="space-y-3 border-t border-neutral-800 pt-4">
                    <div className="flex justify-between text-neutral-400">
                      <span>Subtotal</span>
                      <span className="text-white">{symbol}{(cart.subtotal_usd * rate).toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount ({discount}%)</span>
                        <span>-{symbol}{(cart.subtotal_usd * discount / 100 * rate).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-400">
                      <span>Shipping</span>
                      <span className="text-white">{symbol}{(shipping * rate).toFixed(2)}</span>
                    </div>
                    
                    <div className="border-t border-neutral-800 pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-white">Total</span>
                        <span className="text-white" data-testid="checkout-total">
                          {symbol}{(total * rate).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="btn-primary w-full mt-6"
                    disabled={submitting}
                    data-testid="place-order"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Place Order
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-neutral-500 text-center mt-4">
                    By placing this order, you agree to our Terms of Service
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Checkout;
