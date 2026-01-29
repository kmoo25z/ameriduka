import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../App";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Warehouse, 
  UserCog, Menu, X, LogOut, Search, Mail, Phone, DollarSign
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

const AdminCustomers = () => {
  const { authAxios } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const fetchCustomers = async () => {
    try {
      const response = await authAxios.get(`/admin/customers?limit=50${search ? `&search=${search}` : ""}`);
      setCustomers(response.data.customers);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [search]);

  return (
    <AdminLayout title="Customers (CRM)">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark pl-10"
            data-testid="search-customers"
          />
        </div>
        <span className="text-neutral-400 text-sm">{total} customers</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-neutral-800/50 rounded-lg animate-pulse"></div>)}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16"><Users className="h-16 w-16 mx-auto text-neutral-700 mb-4" /><p className="text-neutral-400">No customers found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <div key={customer.user_id} className="glass-card p-6" data-testid={`customer-${customer.user_id}`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {customer.picture ? (
                    <img src={customer.picture} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-primary font-semibold text-lg">{customer.name?.[0] || "?"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{customer.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-neutral-400 mt-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-400 mt-1">
                      <Phone className="h-3 w-3" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800">
                <div>
                  <p className="text-xs text-neutral-500">Orders</p>
                  <p className="font-semibold text-white">{customer.order_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Total Spent</p>
                  <p className="font-semibold text-emerald-400">${(customer.total_spent_usd || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Points</p>
                  <p className="font-semibold text-primary">{customer.loyalty_points || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCustomers;
