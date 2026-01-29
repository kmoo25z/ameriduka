import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { API, useAuth } from "../App";
import { Navbar, Footer } from "../components/shared/Layout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, CreditCard, ArrowLeft, RefreshCw } from "lucide-react";

const OrderDetail = () => {
  const { orderId } = useParams();
  const { authAxios } = useAuth();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const fetchOrder = async () => {
    try {
      const response = await authAxios.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    
    // Check payment status if returning from Stripe
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, [orderId]);

  const checkPaymentStatus = async (sessionId) => {
    setCheckingPayment(true);
    try {
      let attempts = 0;
      const maxAttempts = 5;
      
      const pollStatus = async () => {
        const response = await authAxios.get(`/payments/stripe/status/${sessionId}`);
        
        if (response.data.payment_status === "paid") {
          toast.success("Payment successful!");
          fetchOrder();
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollStatus, 2000);
        } else {
          toast.info("Payment status pending. Please check back later.");
        }
      };
      
      await pollStatus();
    } catch (error) {
      console.error("Error checking payment:", error);
    } finally {
      setCheckingPayment(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = ["pending", "processing", "packed", "shipped", "delivered"];
    return steps.indexOf(status);
  };

  const statusSteps = [
    { status: "pending", label: "Order Placed", icon: Clock },
    { status: "processing", label: "Processing", icon: Package },
    { status: "packed", label: "Packed", icon: Package },
    { status: "shipped", label: "Shipped", icon: Truck },
    { status: "delivered", label: "Delivered", icon: CheckCircle },
  ];

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

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold text-white mb-4">Order Not Found</h2>
          <Link to="/orders">
            <Button className="btn-primary">View All Orders</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStep = getStatusStep(order.status);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Link */}
          <Link to="/orders" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-2xl font-bold text-white">Order Details</h1>
              <p className="text-neutral-400 font-mono">{order.order_id}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className={`${
                order.payment_status === "completed" 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              } border`}>
                Payment: {order.payment_status}
              </Badge>
              
              {checkingPayment && (
                <RefreshCw className="h-4 w-4 text-primary animate-spin" />
              )}
            </div>
          </div>
          
          {/* Status Timeline */}
          {!isCancelled && (
            <div className="glass-card p-6 mb-8">
              <h2 className="font-heading text-lg font-semibold text-white mb-6">Order Status</h2>
              
              <div className="relative">
                <div className="flex justify-between">
                  {statusSteps.map((step, index) => {
                    const isActive = index <= currentStep;
                    const isCurrent = index === currentStep;
                    
                    return (
                      <div key={step.status} className="flex flex-col items-center relative z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive 
                            ? isCurrent 
                              ? "bg-primary text-white" 
                              : "bg-emerald-500 text-white"
                            : "bg-neutral-800 text-neutral-500"
                        }`}>
                          <step.icon className="h-5 w-5" />
                        </div>
                        <span className={`text-xs mt-2 ${isActive ? "text-white" : "text-neutral-500"}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-neutral-800">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {order.tracking_number && (
                <div className="mt-6 p-4 bg-neutral-900/50 rounded-lg">
                  <p className="text-sm text-neutral-400">Tracking Number</p>
                  <p className="font-mono text-white">{order.tracking_number}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Order Items */}
          <div className="glass-card p-6 mb-8">
            <h2 className="font-heading text-lg font-semibold text-white mb-4">Items</h2>
            
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-neutral-800 last:border-0">
                  <div>
                    <p className="text-white font-medium">{item.product_name}</p>
                    <p className="text-sm text-neutral-400">Qty: {item.quantity}</p>
                    {item.imei && (
                      <p className="text-xs text-neutral-500 font-mono">IMEI: {item.imei}</p>
                    )}
                  </div>
                  <p className="text-white">${(item.price_usd * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-neutral-800 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span>${order.subtotal_usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Shipping</span>
                <span>${order.shipping_usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-white">
                <span>Total</span>
                <span>{order.currency} {order.total_local.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Shipping & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6">
              <h2 className="font-heading text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Shipping Address
              </h2>
              <div className="space-y-2 text-neutral-300">
                <p>{order.shipping_address}</p>
                <p>{order.shipping_city}, {order.shipping_country}</p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-neutral-500" />
                  {order.phone}
                </p>
              </div>
            </div>
            
            <div className="glass-card p-6">
              <h2 className="font-heading text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Information
              </h2>
              <div className="space-y-2 text-neutral-300">
                <p className="capitalize">Method: {order.payment_method}</p>
                <p className="capitalize">Status: {order.payment_status}</p>
                <p className="text-sm text-neutral-500">
                  Ordered on {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
          
          {order.notes && (
            <div className="glass-card p-6 mt-8">
              <h2 className="font-heading text-lg font-semibold text-white mb-2">Order Notes</h2>
              <p className="text-neutral-300">{order.notes}</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OrderDetail;
