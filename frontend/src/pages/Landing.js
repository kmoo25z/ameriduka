import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../App";
import { Navbar, Footer } from "../components/shared/Layout";
import ProductCard from "../components/shared/ProductCard";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { ArrowRight, Smartphone, Laptop, Tablet, Headphones, Shield, Truck, CreditCard, RefreshCw } from "lucide-react";

const Landing = () => {
  const { user, authAxios } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("KES");

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await axios.get(`${API}/products/featured?limit=8`);
        setFeaturedProducts(response.data);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleAddToCart = async (product) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }
    try {
      await authAxios.post("/cart/add", { product_id: product.product_id, quantity: 1 });
      toast.success("Added to cart!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add to cart");
    }
  };

  const categories = [
    { name: "Phones", icon: Smartphone, href: "/products?category=phones", color: "from-primary-500 to-primary-600" },
    { name: "Laptops", icon: Laptop, href: "/products?category=laptops", color: "from-secondary-500 to-secondary-600" },
    { name: "Tablets", icon: Tablet, href: "/products?category=tablets", color: "from-emerald-500 to-emerald-600" },
    { name: "Audio", icon: Headphones, href: "/products?category=audio", color: "from-amber-500 to-amber-600" },
  ];

  const features = [
    { icon: Shield, title: "Warranty Included", desc: "All products come with manufacturer warranty" },
    { icon: Truck, title: "Fast Delivery", desc: "Same-day delivery in Nairobi, next-day nationwide" },
    { icon: CreditCard, title: "Secure Payments", desc: "M-Pesa, Stripe, PayPal accepted" },
    { icon: RefreshCw, title: "Easy Returns", desc: "30-day hassle-free return policy" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden mesh-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Hero Content */}
            <div className="lg:col-span-7 space-y-6 animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                <span className="text-primary text-sm font-medium">New Arrivals</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Premium Tech for{" "}
                <span className="gradient-text">Kenya & Beyond</span>
              </h1>
              
              <p className="text-lg text-neutral-400 max-w-xl">
                Discover the latest smartphones, laptops, and accessories. 
                Shop with confidence with our warranty guarantee and fast nationwide delivery.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/products">
                  <Button className="btn-primary" data-testid="shop-now-btn">
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/products?category=phones">
                  <Button className="btn-secondary" data-testid="explore-phones-btn">
                    Explore Phones
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold text-white">10K+</p>
                  <p className="text-sm text-neutral-500">Happy Customers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">500+</p>
                  <p className="text-sm text-neutral-500">Products</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">24/7</p>
                  <p className="text-sm text-neutral-500">Support</p>
                </div>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-3xl blur-3xl"></div>
                <img
                  src="https://images.unsplash.com/photo-1759588071836-fcfca86e43de?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"
                  alt="Premium Smartphone"
                  className="relative z-10 w-full h-full object-cover rounded-3xl shadow-glow"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-white mb-4">Shop by Category</h2>
            <p className="text-neutral-400">Find what you're looking for</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.href}
                className="glass-card p-6 text-center hover:-translate-y-1 transition-all group"
                data-testid={`category-${cat.name.toLowerCase()}`}
              >
                <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <cat.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-heading font-semibold text-white">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-3xl font-bold text-white mb-2">Featured Products</h2>
              <p className="text-neutral-400">Handpicked selection of our best sellers</p>
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
                  data-testid={`currency-${c.toLowerCase()}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-card animate-pulse">
                  <div className="aspect-square bg-neutral-800 rounded-xl mb-4"></div>
                  <div className="h-4 bg-neutral-800 rounded mb-2"></div>
                  <div className="h-6 bg-neutral-800 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  currency={currency}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-400">No featured products yet. Check back soon!</p>
            </div>
          )}
          
          <div className="text-center mt-10">
            <Link to="/products">
              <Button className="btn-secondary" data-testid="view-all-products">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="text-center p-6">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Upgrade Your Tech?
            </h2>
            <p className="text-neutral-400 mb-8">
              Join thousands of happy customers who trust TechGalaxy for their tech needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/products">
                <Button className="btn-primary" data-testid="cta-shop-now">
                  Start Shopping
                </Button>
              </Link>
              {!user && (
                <Link to="/register">
                  <Button className="btn-secondary" data-testid="cta-create-account">
                    Create Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Landing;
