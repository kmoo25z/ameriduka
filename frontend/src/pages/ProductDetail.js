import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../App";
import { Navbar, Footer } from "../components/shared/Layout";
import ProductCard from "../components/shared/ProductCard";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Star, ShoppingCart, Heart, Truck, Shield, RefreshCw, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";

const ProductDetail = () => {
  const { productId } = useParams();
  const { user, authAxios } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [currency, setCurrency] = useState("KES");
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const exchangeRates = { USD: 1, KES: 129.5, EUR: 0.92 };
  const rate = exchangeRates[currency] || 1;
  const currencySymbols = { USD: "$", KES: "KES ", EUR: "€" };
  const symbol = currencySymbols[currency] || "$";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productRes, reviewsRes, relatedRes] = await Promise.all([
          axios.get(`${API}/products/${productId}`),
          axios.get(`${API}/reviews/${productId}`),
          axios.get(`${API}/recommendations/${productId}`),
        ]);
        setProduct(productRes.data);
        setReviews(reviewsRes.data);
        setRelatedProducts(relatedRes.data);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }
    try {
      await authAxios.post("/cart/add", { product_id: product.product_id, quantity });
      toast.success(`Added ${quantity} item(s) to cart!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add to cart");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to write a review");
      return;
    }
    setSubmittingReview(true);
    try {
      const response = await authAxios.post("/reviews", {
        product_id: product.product_id,
        rating: newReview.rating,
        comment: newReview.comment,
      });
      setReviews([response.data, ...reviews]);
      setNewReview({ rating: 5, comment: "" });
      toast.success("Review submitted!");
      // Refresh product to get updated rating
      const productRes = await axios.get(`${API}/products/${productId}`);
      setProduct(productRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold text-white mb-4">Product Not Found</h2>
          <Link to="/products">
            <Button className="btn-primary">Browse Products</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length > 0 
    ? product.images 
    : ["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8">
            <Link to="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-white">Products</Link>
            <span>/</span>
            <Link to={`/products?category=${product.category}`} className="hover:text-white capitalize">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-neutral-300">{product.name}</span>
          </nav>
          
          {/* Product Main */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Images */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-900">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                    >
                      <ChevronLeft className="h-5 w-5 text-white" />
                    </button>
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                    >
                      <ChevronRight className="h-5 w-5 text-white" />
                    </button>
                  </>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        selectedImage === i ? "border-primary" : "border-transparent"
                      }`}
                      onClick={() => setSelectedImage(i)}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Details */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="flex items-center gap-2">
                <span className="text-primary uppercase text-sm font-medium tracking-wider">{product.brand}</span>
                {product.condition === "refurbished" && (
                  <span className="badge-warning text-xs px-2 py-1 rounded-full">Refurbished</span>
                )}
              </div>
              
              <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white" data-testid="product-title">
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`}
                    />
                  ))}
                </div>
                <span className="text-neutral-400">
                  {product.rating.toFixed(1)} ({product.review_count} reviews)
                </span>
                <span className="text-neutral-600">|</span>
                <span className="text-neutral-400">{product.sold_count} sold</span>
              </div>
              
              {/* Price */}
              <div className="flex items-baseline gap-4">
                <div className="flex items-center gap-2">
                  {["KES", "USD", "EUR"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        currency === c ? "bg-primary text-white" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="text-4xl font-bold text-white" data-testid="product-price">
                  {symbol}{(product.price_usd * rate).toFixed(2)}
                </p>
                {product.original_price_usd && product.original_price_usd > product.price_usd && (
                  <p className="text-xl text-neutral-500 line-through">
                    {symbol}{(product.original_price_usd * rate).toFixed(2)}
                  </p>
                )}
              </div>
              
              <p className="text-neutral-400 leading-relaxed">{product.description}</p>
              
              {/* Stock */}
              <div>
                {product.stock > 10 ? (
                  <p className="text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    In Stock
                  </p>
                ) : product.stock > 0 ? (
                  <p className="text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                    Only {product.stock} left
                  </p>
                ) : (
                  <p className="text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Out of Stock
                  </p>
                )}
              </div>
              
              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-neutral-800 rounded-lg">
                  <button
                    className="p-3 hover:bg-neutral-800/50 transition-colors"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    data-testid="qty-decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-6 py-3 font-medium" data-testid="quantity-display">{quantity}</span>
                  <button
                    className="p-3 hover:bg-neutral-800/50 transition-colors"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    data-testid="qty-increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <Button
                  className="btn-primary flex-1"
                  disabled={product.stock === 0}
                  onClick={handleAddToCart}
                  data-testid="add-to-cart-btn"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                
                <Button variant="outline" className="border-neutral-800" data-testid="wishlist-btn">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
                <div className="text-center">
                  <Truck className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="text-xs text-neutral-400">Free Delivery</p>
                </div>
                <div className="text-center">
                  <Shield className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="text-xs text-neutral-400">{product.warranty_months}mo Warranty</p>
                </div>
                <div className="text-center">
                  <RefreshCw className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="text-xs text-neutral-400">30-Day Returns</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Specifications */}
          {Object.keys(product.specifications || {}).length > 0 && (
            <div className="mb-16">
              <h2 className="font-heading text-2xl font-bold text-white mb-6">Specifications</h2>
              <div className="glass-card overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, value], i) => (
                      <tr key={key} className={i % 2 === 0 ? "bg-neutral-900/50" : ""}>
                        <td className="px-6 py-4 text-neutral-400 capitalize">{key.replace(/_/g, " ")}</td>
                        <td className="px-6 py-4 text-white">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Reviews */}
          <div className="mb-16">
            <h2 className="font-heading text-2xl font-bold text-white mb-6">Customer Reviews</h2>
            
            {/* Write Review */}
            {user && (
              <form onSubmit={handleSubmitReview} className="glass-card p-6 mb-8">
                <h3 className="font-semibold text-white mb-4">Write a Review</h3>
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview((prev) => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${star <= newReview.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview((prev) => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your thoughts about this product..."
                  className="input-dark w-full h-24 resize-none mb-4"
                  required
                  data-testid="review-comment"
                />
                <Button type="submit" className="btn-primary" disabled={submittingReview} data-testid="submit-review">
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            )}
            
            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.review_id} className="glass-card p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-medium">{review.user_name[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{review.user_name}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-neutral-300">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400 text-center py-8">No reviews yet. Be the first to review!</p>
            )}
          </div>
          
          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="font-heading text-2xl font-bold text-white mb-6">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.product_id} product={p} currency={currency} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductDetail;
