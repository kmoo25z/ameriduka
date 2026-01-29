import { useState, useEffect } from "react";
import { useAuth } from "../../App";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";

// Import AdminLayout from Dashboard
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Warehouse, 
  UserCog, Menu, X, LogOut
} from "lucide-react";

const AdminLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Inventory", href: "/admin/inventory", icon: Warehouse },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Employees", href: "/admin/employees", icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-neutral-800">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">TG</span>
          </div>
          <span className="font-heading font-bold text-lg text-white">Admin</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="px-4 py-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-medium">{user?.name?.[0] || "A"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Link to="/" className="flex-1">
              <Button variant="ghost" className="w-full text-neutral-400 text-sm">View Store</Button>
            </Link>
            <Button variant="ghost" className="text-red-400" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
      
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">TG</span>
            </div>
            <span className="font-heading font-bold text-lg text-white">Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full bg-card border-r border-neutral-800" onClick={(e) => e.stopPropagation()}>
            <nav className="px-4 py-20 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${location.pathname === item.href ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
      
      <main className="flex-1 lg:ml-64">
        <div className="pt-16 lg:pt-0">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {title && <h1 className="font-heading text-2xl font-bold text-white mb-6">{title}</h1>}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const AdminProducts = () => {
  const { authAxios } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "phones",
    brand: "",
    condition: "new",
    price_usd: "",
    original_price_usd: "",
    stock: "",
    images: "",
    warranty_months: "12",
    featured: false,
    tags: "",
    specifications: "",
  });

  const fetchProducts = async () => {
    try {
      const response = await authAxios.get(`/products?limit=50${search ? `&search=${search}` : ""}`);
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        brand: formData.brand,
        condition: formData.condition,
        price_usd: parseFloat(formData.price_usd),
        original_price_usd: formData.original_price_usd ? parseFloat(formData.original_price_usd) : null,
        stock: parseInt(formData.stock),
        images: formData.images.split(",").map(s => s.trim()).filter(Boolean),
        warranty_months: parseInt(formData.warranty_months),
        featured: formData.featured,
        tags: formData.tags.split(",").map(s => s.trim()).filter(Boolean),
        specifications: formData.specifications ? JSON.parse(formData.specifications) : {},
      };
      
      if (editingProduct) {
        await authAxios.put(`/products/${editingProduct.product_id}`, productData);
        toast.success("Product updated!");
      } else {
        await authAxios.post("/products", productData);
        toast.success("Product created!");
      }
      
      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await authAxios.delete(`/products/${productId}`);
      toast.success("Product deleted!");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      condition: product.condition,
      price_usd: product.price_usd.toString(),
      original_price_usd: product.original_price_usd?.toString() || "",
      stock: product.stock.toString(),
      images: product.images.join(", "),
      warranty_months: product.warranty_months.toString(),
      featured: product.featured,
      tags: product.tags.join(", "),
      specifications: JSON.stringify(product.specifications, null, 2),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "", description: "", category: "phones", brand: "", condition: "new",
      price_usd: "", original_price_usd: "", stock: "", images: "", warranty_months: "12",
      featured: false, tags: "", specifications: "",
    });
  };

  return (
    <AdminLayout title="Products">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark pl-10"
            data-testid="search-products"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingProduct(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="add-product">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-neutral-800 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm text-neutral-400 mb-1 block">Name *</label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-dark" required />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-neutral-400 mb-1 block">Description *</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-dark w-full h-20 resize-none" required />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Category *</label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger className="bg-card border-neutral-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-neutral-800">
                      <SelectItem value="phones">Phones</SelectItem>
                      <SelectItem value="laptops">Laptops</SelectItem>
                      <SelectItem value="tablets">Tablets</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="wearables">Wearables</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Brand *</label>
                  <Input value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="input-dark" required />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Condition</label>
                  <Select value={formData.condition} onValueChange={(v) => setFormData({...formData, condition: v})}>
                    <SelectTrigger className="bg-card border-neutral-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-neutral-800">
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="refurbished">Refurbished</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Price (USD) *</label>
                  <Input type="number" step="0.01" value={formData.price_usd} onChange={(e) => setFormData({...formData, price_usd: e.target.value})} className="input-dark" required />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Original Price (USD)</label>
                  <Input type="number" step="0.01" value={formData.original_price_usd} onChange={(e) => setFormData({...formData, original_price_usd: e.target.value})} className="input-dark" />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Stock *</label>
                  <Input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="input-dark" required />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Warranty (months)</label>
                  <Input type="number" value={formData.warranty_months} onChange={(e) => setFormData({...formData, warranty_months: e.target.value})} className="input-dark" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-neutral-400 mb-1 block">Images (comma-separated URLs)</label>
                  <Input value={formData.images} onChange={(e) => setFormData({...formData, images: e.target.value})} className="input-dark" placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-neutral-400 mb-1 block">Tags (comma-separated)</label>
                  <Input value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} className="input-dark" placeholder="smartphone, 5g, premium" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-neutral-400 mb-1 block">Specifications (JSON)</label>
                  <textarea value={formData.specifications} onChange={(e) => setFormData({...formData, specifications: e.target.value})} className="input-dark w-full h-24 resize-none font-mono text-sm" placeholder='{"RAM": "8GB", "Storage": "256GB"}' />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({...formData, featured: e.target.checked})} id="featured" className="rounded" />
                  <label htmlFor="featured" className="text-sm text-neutral-400">Featured Product</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : (editingProduct ? "Update" : "Create")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-neutral-800/50 rounded-lg"></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-neutral-700 mb-4" />
          <p className="text-neutral-400">No products found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Product</th>
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Price</th>
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Stock</th>
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-sm text-neutral-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.product_id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0">
                          <img src={product.images?.[0] || "https://via.placeholder.com/100"} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-white line-clamp-1">{product.name}</p>
                          <p className="text-xs text-neutral-500">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-300">{product.category}</td>
                    <td className="px-4 py-3 text-white">${product.price_usd.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={product.stock <= 5 ? "text-red-400" : "text-neutral-300"}>{product.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      {product.featured && <span className="badge-info text-xs px-2 py-1 rounded-full">Featured</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)} data-testid={`edit-${product.product_id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(product.product_id)} data-testid={`delete-${product.product_id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
