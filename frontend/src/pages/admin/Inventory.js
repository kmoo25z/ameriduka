import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../App";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Warehouse, 
  UserCog, Menu, X, LogOut, AlertTriangle, Edit2, Check
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
          {navigation.map((item) => (
            <Link key={item.name} to={item.href} className={`sidebar-link ${location.pathname === item.href ? "active" : ""}`}>
              <item.icon className="h-5 w-5" />{item.name}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-medium">{user?.name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Link to="/" className="flex-1"><Button variant="ghost" className="w-full text-neutral-400 text-sm">View Store</Button></Link>
            <Button variant="ghost" className="text-red-400" onClick={logout}><LogOut className="h-4 w-4" /></Button>
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
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div>
      </div>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full bg-card border-r border-neutral-800" onClick={(e) => e.stopPropagation()}>
            <nav className="px-4 py-20 space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} to={item.href} className={`sidebar-link ${location.pathname === item.href ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  <item.icon className="h-5 w-5" />{item.name}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
      <main className="flex-1 lg:ml-64"><div className="pt-16 lg:pt-0"><div className="px-4 sm:px-6 lg:px-8 py-8">{title && <h1 className="font-heading text-2xl font-bold text-white mb-6">{title}</h1>}{children}</div></div></main>
    </div>
  );
};

const AdminInventory = () => {
  const { authAxios } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [newStock, setNewStock] = useState("");

  const fetchInventory = async () => {
    try {
      const response = await authAxios.get(`/admin/inventory?low_stock_only=${lowStockOnly}&limit=100`);
      setInventory(response.data.products);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, [lowStockOnly]);

  const updateStock = async (productId) => {
    try {
      await authAxios.put(`/admin/inventory/${productId}/stock?stock=${parseInt(newStock)}`);
      toast.success("Stock updated!");
      setEditingStock(null);
      fetchInventory();
    } catch (error) {
      toast.error("Failed to update stock");
    }
  };

  return (
    <AdminLayout title="Inventory Management">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant={lowStockOnly ? "default" : "outline"}
          className={lowStockOnly ? "btn-primary" : "border-neutral-800"}
          onClick={() => setLowStockOnly(!lowStockOnly)}
          data-testid="low-stock-filter"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Low Stock Only
        </Button>
        <span className="text-neutral-400 text-sm">{inventory.length} items</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-neutral-800/50 rounded-lg"></div>)}</div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-16"><Warehouse className="h-16 w-16 mx-auto text-neutral-700 mb-4" /><p className="text-neutral-400">No inventory items found</p></div>
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
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Sold</th>
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-sm text-neutral-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.product_id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0">
                          <img src={item.images?.[0] || "https://via.placeholder.com/100"} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs text-neutral-500">{item.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-300 text-sm">{item.category}</td>
                    <td className="px-4 py-3 text-white text-sm">${item.price_usd?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {editingStock === item.product_id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            className="input-dark w-20 h-8 text-sm"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-400" onClick={() => updateStock(item.product_id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className={item.stock <= 5 ? "text-red-400 font-medium" : "text-neutral-300"}>{item.stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-300 text-sm">{item.sold_count || 0}</td>
                    <td className="px-4 py-3">
                      {item.stock === 0 ? (
                        <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">Out of Stock</Badge>
                      ) : item.stock <= 5 ? (
                        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Low Stock</Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">In Stock</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingStock(item.product_id); setNewStock(item.stock.toString()); }}
                        data-testid={`edit-stock-${item.product_id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
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

export default AdminInventory;
