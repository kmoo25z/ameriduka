import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../App";
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Warehouse, 
  UserCog, BarChart3, Tag, Menu, X, LogOut, ChevronRight,
  TrendingUp, TrendingDown, DollarSign, AlertTriangle
} from "lucide-react";
import { Button } from "../../components/ui/button";

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
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-neutral-800">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">TG</span>
          </div>
          <span className="font-heading font-bold text-lg text-white">Admin</span>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* User */}
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
              <Button variant="ghost" className="w-full text-neutral-400 text-sm">
                View Store
              </Button>
            </Link>
            <Button variant="ghost" className="text-red-400" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">TG</span>
            </div>
            <span className="font-heading font-bold text-lg text-white">Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} data-testid="mobile-menu-toggle">
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <aside className="w-64 h-full bg-card border-r border-neutral-800" onClick={(e) => e.stopPropagation()}>
            <nav className="px-4 py-20 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`sidebar-link ${isActive ? "active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <div className="pt-16 lg:pt-0">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {title && (
              <h1 className="font-heading text-2xl font-bold text-white mb-6">{title}</h1>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => {
  const { authAxios } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authAxios.get("/admin/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = stats ? [
    {
      title: "Total Revenue",
      value: `$${stats.total_revenue_usd.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Today's Revenue",
      value: `$${stats.today_revenue_usd.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Orders",
      value: stats.total_orders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Total Customers",
      value: stats.total_customers.toLocaleString(),
      icon: Users,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Total Products",
      value: stats.total_products.toLocaleString(),
      icon: Package,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Pending Orders",
      value: stats.pending_orders.toLocaleString(),
      icon: AlertTriangle,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Low Stock Items",
      value: stats.low_stock_count.toLocaleString(),
      icon: Warehouse,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Today's Orders",
      value: stats.today_orders.toLocaleString(),
      icon: BarChart3,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
    },
  ] : [];

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="stats-card animate-pulse">
              <div className="h-12 w-12 bg-neutral-800 rounded-lg mb-4"></div>
              <div className="h-4 bg-neutral-800 rounded mb-2 w-1/2"></div>
              <div className="h-8 bg-neutral-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat) => (
              <div key={stat.title} className="stats-card" data-testid={`stat-${stat.title.toLowerCase().replace(/\s/g, "-")}`}>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center mb-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <p className="text-sm text-neutral-400">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
          
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/admin/orders" className="glass-card p-6 hover:border-primary/50 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-white">Manage Orders</h3>
                  <p className="text-sm text-neutral-400 mt-1">{stats?.pending_orders || 0} pending orders</p>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-600 group-hover:text-primary transition-colors" />
              </div>
            </Link>
            
            <Link to="/admin/inventory" className="glass-card p-6 hover:border-primary/50 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-white">Inventory</h3>
                  <p className="text-sm text-neutral-400 mt-1">{stats?.low_stock_count || 0} low stock items</p>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-600 group-hover:text-primary transition-colors" />
              </div>
            </Link>
            
            <Link to="/admin/products" className="glass-card p-6 hover:border-primary/50 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-white">Products</h3>
                  <p className="text-sm text-neutral-400 mt-1">{stats?.total_products || 0} total products</p>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-600 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
