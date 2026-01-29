import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { Navbar, Footer } from "../components/shared/Layout";
import { Badge } from "../components/ui/badge";
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle } from "lucide-react";

const Orders = () => {
  const { authAxios } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await authAxios.get("/orders");
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
      case "packed":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
      case "refunded":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "processing":
      case "packed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "shipped":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "delivered":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "cancelled":
      case "refunded":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "pending":
      case "initiated":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-heading text-3xl font-bold text-white mb-8">My Orders</h1>
          
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto text-neutral-700 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No orders yet</h2>
              <p className="text-neutral-400 mb-6">Start shopping to see your orders here</p>
              <Link to="/products">
                <button className="btn-primary">Browse Products</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.order_id}
                  to={`/orders/${order.order_id}`}
                  className="glass-card p-6 block hover:border-primary/50 transition-colors"
                  data-testid={`order-${order.order_id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-neutral-500">Order</span>
                        <span className="font-mono text-white">{order.order_id}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={`${getStatusColor(order.status)} border`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                        <Badge className={`${getPaymentStatusColor(order.payment_status)} border`}>
                          Payment: {order.payment_status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-neutral-400 mt-3">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} • 
                        {order.currency} {order.total_local.toFixed(2)}
                      </p>
                      
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-neutral-600" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Orders;
