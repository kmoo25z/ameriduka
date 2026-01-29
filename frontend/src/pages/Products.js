import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../App";
import { Navbar, Footer } from "../components/shared/Layout";
import ProductCard from "../components/shared/ProductCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";

const Products = () => {
  const { user, authAxios } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currency, setCurrency] = useState("KES");

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    brand: searchParams.get("brand") || "",
    condition: searchParams.get("condition") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sortBy: searchParams.get("sortBy") || "created_at",
    sortOrder: searchParams.get("sortOrder") || "desc",
    page: parseInt(searchParams.get("page")) || 1,
  });

  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          axios.get(`${API}/products/categories`),
          axios.get(`${API}/products/brands`),
        ]);
        setCategories(catRes.data);
        setBrands(brandRes.data);
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };
    fetchFiltersData();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.search) params.set("search", filters.search);
        if (filters.category) params.set("category", filters.category);
        if (filters.brand) params.set("brand", filters.brand);
        if (filters.condition) params.set("condition", filters.condition);
        if (filters.minPrice) params.set("min_price", filters.minPrice);
        if (filters.maxPrice) params.set("max_price", filters.maxPrice);
        params.set("sort_by", filters.sortBy);
        params.set("sort_order", filters.sortOrder);
        params.set("page", filters.page.toString());
        params.set("limit", "12");

        const response = await axios.get(`${API}/products?${params.toString()}`);
        setProducts(response.data.products);
        setTotal(response.data.total);
        setTotalPages(response.data.total_pages);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Update URL params
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "created_at" && value !== "desc" && value !== 1) {
        params.set(key, value.toString());
      }
    });
    setSearchParams(params);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      brand: "",
      condition: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "created_at",
      sortOrder: "desc",
      page: 1,
    });
  };

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

  const activeFiltersCount = [
    filters.category,
    filters.brand,
    filters.condition,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold text-white">
                {filters.category 
                  ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}` 
                  : "All Products"}
              </h1>
              <p className="text-neutral-400 mt-1">{total} products found</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Currency Selector */}
              <div className="flex items-center gap-1 bg-card border border-neutral-800 rounded-lg p-1">
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
              
              {/* Sort */}
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(val) => {
                  const [sortBy, sortOrder] = val.split("-");
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
                }}
              >
                <SelectTrigger className="w-[180px] bg-card border-neutral-800" data-testid="sort-select">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-card border-neutral-800">
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  <SelectItem value="price_usd-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_usd-desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating-desc">Highest Rated</SelectItem>
                  <SelectItem value="sold_count-desc">Best Selling</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Filter Toggle */}
              <Button
                variant="outline"
                className="border-neutral-800"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="filter-toggle"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className={`${showFilters ? "block" : "hidden"} md:block w-64 flex-shrink-0`}>
              <div className="glass-card p-6 sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-white">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-primary hover:underline"
                      data-testid="clear-filters"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                
                {/* Search */}
                <div>
                  <label className="text-sm text-neutral-400 mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <Input
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="input-dark pl-10"
                      data-testid="filter-search"
                    />
                  </div>
                </div>
                
                {/* Category */}
                <div>
                  <label className="text-sm text-neutral-400 mb-2 block">Category</label>
                  <Select
                    value={filters.category || "all"}
                    onValueChange={(val) => handleFilterChange("category", val === "all" ? "" : val)}
                  >
                    <SelectTrigger className="bg-card border-neutral-800" data-testid="filter-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-neutral-800">
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.category} value={cat.category}>
                          {cat.category} ({cat.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Brand */}
                <div>
                  <label className="text-sm text-neutral-400 mb-2 block">Brand</label>
                  <Select
                    value={filters.brand || "all"}
                    onValueChange={(val) => handleFilterChange("brand", val === "all" ? "" : val)}
                  >
                    <SelectTrigger className="bg-card border-neutral-800" data-testid="filter-brand">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-neutral-800">
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b.brand} value={b.brand}>
                          {b.brand} ({b.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Condition */}
                <div>
                  <label className="text-sm text-neutral-400 mb-2 block">Condition</label>
                  <Select
                    value={filters.condition || "all"}
                    onValueChange={(val) => handleFilterChange("condition", val === "all" ? "" : val)}
                  >
                    <SelectTrigger className="bg-card border-neutral-800" data-testid="filter-condition">
                      <SelectValue placeholder="All Conditions" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-neutral-800">
                      <SelectItem value="all">All Conditions</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="refurbished">Refurbished</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Price Range */}
                <div>
                  <label className="text-sm text-neutral-400 mb-2 block">Price Range (USD)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                      className="input-dark"
                      data-testid="filter-min-price"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                      className="input-dark"
                      data-testid="filter-max-price"
                    />
                  </div>
                </div>
              </div>
            </aside>
            
            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="product-card animate-pulse">
                      <div className="aspect-square bg-neutral-800 rounded-xl mb-4"></div>
                      <div className="h-4 bg-neutral-800 rounded mb-2"></div>
                      <div className="h-6 bg-neutral-800 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product.product_id}
                        product={product}
                        currency={currency}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        className="border-neutral-800"
                        disabled={filters.page <= 1}
                        onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                        data-testid="prev-page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-neutral-400 px-4">
                        Page {filters.page} of {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        className="border-neutral-800"
                        disabled={filters.page >= totalPages}
                        onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                        data-testid="next-page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <p className="text-neutral-400 text-lg">No products found</p>
                  <p className="text-neutral-500 mt-2">Try adjusting your filters</p>
                  <Button
                    variant="outline"
                    className="mt-4 border-neutral-800"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Products;
