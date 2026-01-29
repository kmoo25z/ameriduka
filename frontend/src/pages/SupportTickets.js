import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { Navbar, Footer } from "../components/shared/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Plus, MessageCircle, Clock, CheckCircle, Loader2 } from "lucide-react";

const SupportTickets = () => {
  const { authAxios, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  
  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    category: "general",
    order_id: ""
  });

  const fetchTickets = async () => {
    try {
      const response = await authAxios.get("/tickets");
      setTickets(response.data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ticketData = {
        subject: newTicket.subject,
        message: newTicket.message,
        category: newTicket.category,
        order_id: newTicket.order_id || null
      };
      await authAxios.post("/tickets", ticketData);
      toast.success("Ticket created!");
      setIsDialogOpen(false);
      setNewTicket({ subject: "", message: "", category: "general", order_id: "" });
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;
    try {
      await authAxios.post(`/tickets/${selectedTicket.ticket_id}/reply?message=${encodeURIComponent(replyMessage)}`);
      toast.success("Reply sent!");
      setReplyMessage("");
      fetchTickets();
      // Update selected ticket
      const updatedTicket = await authAxios.get("/tickets");
      const updated = updatedTicket.data.find(t => t.ticket_id === selectedTicket.ticket_id);
      setSelectedTicket(updated);
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "in_progress": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "resolved": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "closed": return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
      default: return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-3xl font-bold text-white">Support Tickets</h1>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="new-ticket">
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-neutral-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Category</label>
                    <Select value={newTicket.category} onValueChange={(v) => setNewTicket({...newTicket, category: v})}>
                      <SelectTrigger className="bg-card border-neutral-800"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-neutral-800">
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="order">Order Issue</SelectItem>
                        <SelectItem value="payment">Payment Problem</SelectItem>
                        <SelectItem value="refund">Refund Request</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Subject *</label>
                    <Input 
                      value={newTicket.subject} 
                      onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})} 
                      className="input-dark" 
                      placeholder="Brief description of your issue"
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Order ID (Optional)</label>
                    <Input 
                      value={newTicket.order_id} 
                      onChange={(e) => setNewTicket({...newTicket, order_id: e.target.value})} 
                      className="input-dark" 
                      placeholder="ord_xxxxx"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Message *</label>
                    <textarea 
                      value={newTicket.message} 
                      onChange={(e) => setNewTicket({...newTicket, message: e.target.value})} 
                      className="input-dark w-full h-32 resize-none" 
                      placeholder="Describe your issue in detail..."
                      required 
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Create Ticket"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tickets List */}
            <div className="lg:col-span-1 space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-neutral-800/50 rounded-lg"></div>)}
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-16">
                  <MessageCircle className="h-12 w-12 mx-auto text-neutral-700 mb-4" />
                  <p className="text-neutral-400">No tickets yet</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <button
                    key={ticket.ticket_id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`glass-card p-4 w-full text-left transition-all ${
                      selectedTicket?.ticket_id === ticket.ticket_id ? "border-primary" : ""
                    }`}
                    data-testid={`ticket-${ticket.ticket_id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-white line-clamp-1">{ticket.subject}</p>
                      <Badge className={`${getStatusColor(ticket.status)} border text-xs`}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 capitalize mb-1">{ticket.category}</p>
                    <p className="text-xs text-neutral-400">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </button>
                ))
              )}
            </div>
            
            {/* Ticket Detail */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="glass-card p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{selectedTicket.subject}</h2>
                      <p className="text-sm text-neutral-400 mt-1">
                        {selectedTicket.category} • Created {new Date(selectedTicket.created_at).toLocaleString()}
                      </p>
                      {selectedTicket.order_id && (
                        <Link to={`/orders/${selectedTicket.order_id}`} className="text-primary text-sm hover:underline">
                          Order: {selectedTicket.order_id}
                        </Link>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(selectedTicket.status)} border`}>
                      {selectedTicket.status.replace("_", " ")}
                    </Badge>
                  </div>
                  
                  {/* Messages */}
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto custom-scrollbar">
                    {selectedTicket.messages?.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`p-4 rounded-lg ${
                          msg.from === "support" ? "bg-primary/10 ml-8" : "bg-neutral-800/50 mr-8"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${msg.from === "support" ? "text-primary" : "text-white"}`}>
                            {msg.from === "support" ? "Support Team" : "You"}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-neutral-300">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Reply Form */}
                  {selectedTicket.status !== "closed" && (
                    <div className="flex gap-3">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="input-dark flex-1 h-20 resize-none"
                        data-testid="ticket-reply"
                      />
                      <Button onClick={handleReply} className="btn-primary" disabled={!replyMessage.trim()}>
                        Send
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-card p-6 flex items-center justify-center min-h-[400px]">
                  <p className="text-neutral-400">Select a ticket to view details</p>
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

export default SupportTickets;
