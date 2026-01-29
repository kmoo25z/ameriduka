import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { Navbar, Footer } from "../components/shared/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { Plus, MapPin, Trash2, Edit, Star, Loader2 } from "lucide-react";

const Addresses = () => {
  const { authAxios } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    country: "Kenya",
    postal_code: "",
    is_default: false
  });

  const fetchAddresses = async () => {
    try {
      const response = await authAxios.get("/addresses");
      setAddresses(response.data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setFormData({
      label: "Home",
      full_name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      country: "Kenya",
      postal_code: "",
      is_default: false
    });
    setEditingAddress(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAddress) {
        await authAxios.put(`/addresses/${editingAddress.address_id}`, formData);
        toast.success("Address updated!");
      } else {
        await authAxios.post("/addresses", formData);
        toast.success("Address added!");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchAddresses();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save address");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      country: address.country,
      postal_code: address.postal_code || "",
      is_default: address.is_default
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await authAxios.delete(`/addresses/${addressId}`);
      toast.success("Address deleted!");
      fetchAddresses();
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-3xl font-bold text-white">My Addresses</h1>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="add-address">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-neutral-800 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-white">{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Label</label>
                      <Select value={formData.label} onValueChange={(v) => setFormData({...formData, label: v})}>
                        <SelectTrigger className="bg-card border-neutral-800"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card border-neutral-800">
                          <SelectItem value="Home">Home</SelectItem>
                          <SelectItem value="Work">Work</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Full Name *</label>
                      <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="input-dark" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Phone *</label>
                    <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input-dark" placeholder="+254 7XX XXX XXX" required />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Address Line 1 *</label>
                    <Input value={formData.address_line1} onChange={(e) => setFormData({...formData, address_line1: e.target.value})} className="input-dark" placeholder="Street address" required />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Address Line 2</label>
                    <Input value={formData.address_line2} onChange={(e) => setFormData({...formData, address_line2: e.target.value})} className="input-dark" placeholder="Apartment, suite, unit (optional)" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">City *</label>
                      <Input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="input-dark" required />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-400 mb-1 block">Country *</label>
                      <Select value={formData.country} onValueChange={(v) => setFormData({...formData, country: v})}>
                        <SelectTrigger className="bg-card border-neutral-800"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card border-neutral-800">
                          <SelectItem value="Kenya">Kenya</SelectItem>
                          <SelectItem value="Uganda">Uganda</SelectItem>
                          <SelectItem value="Tanzania">Tanzania</SelectItem>
                          <SelectItem value="Rwanda">Rwanda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Postal Code</label>
                    <Input value={formData.postal_code} onChange={(e) => setFormData({...formData, postal_code: e.target.value})} className="input-dark" placeholder="Optional" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="is_default" 
                      checked={formData.is_default} 
                      onCheckedChange={(checked) => setFormData({...formData, is_default: checked})} 
                    />
                    <label htmlFor="is_default" className="text-sm text-neutral-400">Set as default address</label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : (editingAddress ? "Update" : "Add")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-neutral-800/50 rounded-lg animate-pulse"></div>)}
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="h-16 w-16 mx-auto text-neutral-700 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No saved addresses</h2>
              <p className="text-neutral-400 mb-6">Add an address for faster checkout</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div key={address.address_id} className="glass-card p-6 relative" data-testid={`address-${address.address_id}`}>
                  {address.is_default && (
                    <div className="absolute top-4 right-4">
                      <span className="badge-info text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3" /> Default
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{address.label}</h3>
                      </div>
                      <p className="text-neutral-300">{address.full_name}</p>
                      <p className="text-neutral-400 text-sm">{address.phone}</p>
                      <p className="text-neutral-400 text-sm mt-2">
                        {address.address_line1}
                        {address.address_line2 && <>, {address.address_line2}</>}
                      </p>
                      <p className="text-neutral-400 text-sm">{address.city}, {address.country}</p>
                      {address.postal_code && <p className="text-neutral-400 text-sm">{address.postal_code}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-neutral-800">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(address)} data-testid={`edit-address-${address.address_id}`}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(address.address_id)} data-testid={`delete-address-${address.address_id}`}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Addresses;
