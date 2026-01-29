import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Navbar, Footer } from "../components/shared/Layout";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, X, Star, Check } from "lucide-react";

const Compare = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [comparisonFields, setComparisonFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("KES");

  const exchangeRates = { USD: 1, KES: 129.5, EUR: 0.92 };
  const rate = exchangeRates[currency] || 1;
  const currencySymbols = { USD: "$", KES: "KES ", EUR: "€" };
  const symbol = currencySymbols[currency] || "$";

  useEffect(() => {
    const productIds = searchParams.get("ids")?.split(",") || [];
    
    if (productIds.length < 2) {
      setLoading(false);
      return;
    }

    const fetchComparison = async () => {
      try {
        const response = await axios.post(`${API}/products/compare`, productIds);
        setProducts(response.data.products);
        setComparisonFields(response.data.comparison_fields);
      } catch (error) {
        toast.error("Failed to load comparison");
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [searchParams]);

  const removeProduct = (productId) => {
    const newProducts = products.filter(p => p.product_id !== productId);
    const newIds = newProducts.map(p => p.product_id).join(",");
    if (newProducts.length >= 2) {
      window.location.href = `/compare?ids=${newIds}`;
    } else {
      window.location.href = "/products";
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

  if (products.length < 2) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold text-white mb-4">Select Products to Compare</h2>
          <p className="text-neutral-400 mb-6">Add 2-4 products from the catalog to compare</p>
          <Link to="/products">
            <Button className="btn-primary">Browse Products</Button>
          </Link>
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/products" className="text-neutral-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="font-heading text-3xl font-bold text-white">Compare Products</h1>
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
          
          {/* Comparison Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Products Header */}
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left px-4 py-4 w-48 bg-neutral-900/50 sticky left-0">
                      <span className="text-neutral-400">Compare</span>
                    </th>
                    {products.map((product) => (
                      <th key={product.product_id} className="px-4 py-4 min-w-64 text-left">
                        <div className="relative">
                          <button
                            onClick={() => removeProduct(product.product_id)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <Link to={`/products/${product.product_id}`}>
                            <div className="w-32 h-32 rounded-lg overflow-hidden bg-neutral-900 mb-3 mx-auto">
                              <img
                                src={product.images?.[0] || "https://via.placeholder.com/200"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="font-semibold text-white text-center line-clamp-2 hover:text-primary transition-colors">
                              {product.name}
                            </p>
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                
                <tbody>
                  {/* Price Row */}
                  <tr className="border-b border-neutral-800/50">
                    <td className="px-4 py-4 bg-neutral-900/50 sticky left-0 font-medium text-white">Price</td>
                    {products.map((product) => (
                      <td key={product.product_id} className="px-4 py-4 text-center">
                        <p className="text-xl font-bold text-primary">{symbol}{(product.price_usd * rate).toFixed(2)}</p>
                        {product.original_price_usd && product.original_price_usd > product.price_usd && (
                          <p className="text-sm text-neutral-500 line-through">
                            {symbol}{(product.original_price_usd * rate).toFixed(2)}
                          </p>
                        )}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Rating Row */}
                  <tr className="border-b border-neutral-800/50">
                    <td className="px-4 py-4 bg-neutral-900/50 sticky left-0 font-medium text-white">Rating</td>
                    {products.map((product) => (
                      <td key={product.product_id} className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-neutral-400 mt-1">{product.rating.toFixed(1)} ({product.review_count})</p>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Brand Row */}
                  <tr className="border-b border-neutral-800/50">
                    <td className="px-4 py-4 bg-neutral-900/50 sticky left-0 font-medium text-white">Brand</td>
                    {products.map((product) => (
                      <td key={product.product_id} className="px-4 py-4 text-center text-neutral-300">{product.brand}</td>
                    ))}
                  </tr>
                  
                  {/* Condition Row */}
                  <tr className="border-b border-neutral-800/50">
                    <td className="px-4 py-4 bg-neutral-900/50 sticky left-0 font-medium text-white">Condition</td>
                    {products.map((product) => (
                      <td key={product.product_id} className="px-4 py-4 text-center capitalize text-neutral-300">{product.condition}</td>
                    ))}
                  </tr>
                  
                  {/* Warranty Row */}
                  <tr className="border-b border-neutral-800/50">
                    <td className="px-4 py-4 bg-neutral-900/50 sticky left-0 font-medium text-white">Warranty</td>
                    {products.map((product) => (
                      <td key={product.product_id} className="px-4 py-4 text-center text-neutral-300">{product.warranty_months} months</td>
                    ))}
                  </tr>
                  
                  {/* Stock Row */}
                  <tr className="border-b border-neutral-800/50">
                    <td className="px-4 py-4 bg-neutral-900/50 sticky left-0 font-medium text-white">Availability</td>
                    {products.map((product) => (
                      <td key={product.product_id} className="px-4 py-4 text-center">
                        {product.stock > 10 ? (
                          <span className="text-emerald-400 flex items-center justify-center gap-1">
                            <Check className="h-4 w-4" /> In Stock
                          </span>
                        ) : product.stock > 0 ? (
                          <span className="text-amber-400">Only {product.stock} left</span>
                        ) : (
                          <span className="text-red-400">Out of Stock</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  
                  {/* Specification Rows */}
                  {comparisonFields.map((field) => (
                    <tr key={field} className="border-b border-neutral-800/50">
                      <td className="px-4 py-4 bg-neutral-900/50 sticky left-0 font-medium text-white capitalize">
                        {field.replace(/_/g, " ")}
                      </td>
                      {products.map((product) => (
                        <td key={product.product_id} className="px-4 py-4 text-center text-neutral-300">
                          {product.specifications?.[field] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {products.map((product) => (
              <Link key={product.product_id} to={`/products/${product.product_id}`}>
                <Button className="btn-primary w-full">
                  View {product.brand}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Compare;
