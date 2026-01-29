import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../App";
import { ShoppingCart, User, Menu, X, Search, LogOut, Package, LayoutDashboard, Heart, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isAdmin = user && ["admin", "manager", "sales", "warehouse", "accountant", "support"].includes(user.role);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">TG</span>
            </div>
            <span className="font-heading font-bold text-xl text-white hidden sm:block">TechGalaxy</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search phones, laptops, accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-dark w-full pl-10 pr-4 py-2 text-sm"
                data-testid="search-input"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/products" className="text-neutral-400 hover:text-white transition-colors" data-testid="nav-products">
              Products
            </Link>
            
            {user ? (
              <>
                <Link to="/cart" className="relative text-neutral-400 hover:text-white transition-colors" data-testid="nav-cart">
                  <ShoppingCart className="h-5 w-5" />
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-neutral-400 hover:text-white" data-testid="user-menu-trigger">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-card border-neutral-800">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-neutral-500">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-neutral-800" />
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="flex items-center gap-2 cursor-pointer" data-testid="nav-orders">
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer" data-testid="nav-admin">
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-neutral-800" />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-red-400 cursor-pointer"
                      data-testid="logout-btn"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="text-neutral-400 hover:text-white" data-testid="nav-login">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="btn-primary text-sm px-4 py-2" data-testid="nav-register">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-neutral-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-800 animate-fade-in">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-dark w-full pl-10 pr-4 py-2 text-sm"
                />
              </div>
            </form>
            <div className="flex flex-col gap-2">
              <Link to="/products" className="px-4 py-2 text-neutral-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                Products
              </Link>
              {user ? (
                <>
                  <Link to="/cart" className="px-4 py-2 text-neutral-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                    Cart
                  </Link>
                  <Link to="/orders" className="px-4 py-2 text-neutral-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                    My Orders
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="px-4 py-2 text-neutral-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                      Admin Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="px-4 py-2 text-red-400 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-neutral-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/register" className="px-4 py-2 text-primary" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-neutral-800 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TG</span>
              </div>
              <span className="font-heading font-bold text-xl text-white">TechGalaxy</span>
            </div>
            <p className="text-neutral-500 text-sm">
              Kenya's premier destination for phones, laptops, and tech accessories.
            </p>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><Link to="/products?category=phones" className="hover:text-white transition-colors">Phones</Link></li>
              <li><Link to="/products?category=laptops" className="hover:text-white transition-colors">Laptops</Link></li>
              <li><Link to="/products?category=tablets" className="hover:text-white transition-colors">Tablets</Link></li>
              <li><Link to="/products?category=accessories" className="hover:text-white transition-colors">Accessories</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li>Nairobi, Kenya</li>
              <li>+254 700 000 000</li>
              <li>info@techgalaxy.ke</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">
            © 2025 TechGalaxy. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span>KES</span>
            <span className="text-neutral-700">|</span>
            <span>USD</span>
            <span className="text-neutral-700">|</span>
            <span>EUR</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
