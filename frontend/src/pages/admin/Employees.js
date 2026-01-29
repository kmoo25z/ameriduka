import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../App";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { toast } from "sonner";
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Warehouse, 
  UserCog, Menu, X, LogOut, Plus, Loader2
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

const AdminEmployees = () => {
  const { authAxios, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "", name: "", phone: "", role: "sales", department: "", salary: "", commission_rate: "0"
  });

  const fetchEmployees = async () => {
    try {
      const response = await authAxios.get("/admin/employees");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authAxios.post("/admin/employees", {
        ...formData,
        salary: parseFloat(formData.salary),
        commission_rate: parseFloat(formData.commission_rate)
      });
      toast.success("Employee created! Default password: TempPass123!");
      setIsDialogOpen(false);
      setFormData({ email: "", name: "", phone: "", role: "sales", department: "", salary: "", commission_rate: "0" });
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create employee");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "manager": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "sales": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "warehouse": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "accountant": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "support": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      default: return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
    }
  };

  return (
    <AdminLayout title="Employees">
      <div className="flex items-center justify-between mb-6">
        <span className="text-neutral-400 text-sm">{employees.length} employees</span>
        
        {user?.role === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-employee">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-neutral-800">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Email *</label>
                  <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} type="email" className="input-dark" required />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Full Name *</label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-dark" required />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Phone *</label>
                  <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input-dark" required />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Role *</label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                    <SelectTrigger className="bg-card border-neutral-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-neutral-800">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1 block">Department *</label>
                  <Input value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="input-dark" placeholder="e.g., Sales, IT, Operations" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Salary (USD) *</label>
                    <Input type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} className="input-dark" required />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Commission %</label>
                    <Input type="number" step="0.1" value={formData.commission_rate} onChange={(e) => setFormData({...formData, commission_rate: e.target.value})} className="input-dark" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Create Employee"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-neutral-800/50 rounded-lg animate-pulse"></div>)}
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-16"><UserCog className="h-16 w-16 mx-auto text-neutral-700 mb-4" /><p className="text-neutral-400">No employees found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div key={emp.employee_id} className="glass-card p-6" data-testid={`employee-${emp.employee_id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">{emp.name?.[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{emp.name}</h3>
                    <p className="text-xs text-neutral-500">{emp.department}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(emp.role)}`}>
                  {emp.role}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-neutral-400">{emp.email}</p>
                <p className="text-neutral-400">{emp.phone}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-neutral-800">
                <div>
                  <p className="text-xs text-neutral-500">Salary</p>
                  <p className="font-semibold text-white">${emp.salary}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Commission</p>
                  <p className="font-semibold text-white">{emp.commission_rate}%</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Sales</p>
                  <p className="font-semibold text-emerald-400">${emp.total_sales?.toFixed(0) || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminEmployees;
