import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../App";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Warehouse, 
  UserCog, Menu, X, LogOut, Eye, Truck, CheckCircle, Clock, XCircle
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

const AdminOrders = () => {
  const { authAxios } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      const response = await authAxios.get("/orders?limit=100");
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await authAxios.put(`/orders/${orderId}/status?status=${newStatus}`);
      toast.success("Order status updated!");
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "processing": case "packed": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "shipped": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "delivered": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "cancelled": case "refunded": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
    }
  };

  const filteredOrders = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);

  return (
    <AdminLayout title="Orders">
      <div className="flex items-center gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-card border-neutral-800" data-testid="status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-neutral-800">
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="packed">Packed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-neutral-400 text-sm">{filteredOrders.length} orders</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-neutral-800/50 rounded-lg"></div>)}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16"><ShoppingCart className="h-16 w-16 mx-auto text-neutral-700 mb-4" /><p className="text-neutral-400">No orders found</p></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Order ID</th>
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Items</th>
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Payment</th>
                  <th className="text-left px-4 py-3 text-sm text-neutral-400 font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-sm text-neutral-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.order_id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                    <td className="px-4 py-3"><span className="font-mono text-white text-sm">{order.order_id}</span></td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{order.phone}</p>
                      <p className="text-xs text-neutral-500">{order.shipping_city}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{order.items.length} items</td>
                    <td className="px-4 py-3 text-white">{order.currency} {order.total_local.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.order_id, v)}>
                        <SelectTrigger className={`w-32 h-8 text-xs ${getStatusColor(order.status)} border`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-neutral-800">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="packed">Packed</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${order.payment_status === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"} border border-current/30`}>
                        {order.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-400 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/orders/${order.order_id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
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

export default AdminOrders;
