import { Link } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "../components/ui/button";

const ProductCard = ({ product, onAddToCart, currency = "KES" }) => {
  const exchangeRates = { USD: 1, KES: 129.5, EUR: 0.92 };
  const rate = exchangeRates[currency] || 1;
  const localPrice = (product.price_usd * rate).toFixed(2);
  const currencySymbols = { USD: "$", KES: "KES ", EUR: "€" };
  const symbol = currencySymbols[currency] || "$";

  return (
    <div className="product-card" data-testid={`product-card-${product.product_id}`}>
      {/* Badge */}
      {product.condition === "refurbished" && (
        <div className="absolute top-3 left-3 z-10">
          <span className="badge-warning text-xs px-2 py-1 rounded-full">Refurbished</span>
        </div>
      )}
      {product.featured && (
        <div className="absolute top-3 right-3 z-10">
          <span className="badge-info text-xs px-2 py-1 rounded-full">Featured</span>
        </div>
      )}
      
      {/* Image */}
      <Link to={`/products/${product.product_id}`}>
        <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-neutral-900">
          <img
            src={product.images?.[0] || "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      </Link>
      
      {/* Content */}
      <div className="space-y-2">
        <p className="text-xs text-primary uppercase tracking-wider">{product.brand}</p>
        <Link to={`/products/${product.product_id}`}>
          <h3 className="font-heading font-semibold text-white text-lg line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`}
              />
            ))}
          </div>
          <span className="text-xs text-neutral-500">({product.review_count})</span>
        </div>
        
        {/* Price */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xl font-bold text-white">{symbol}{localPrice}</p>
            {product.original_price_usd && product.original_price_usd > product.price_usd && (
              <p className="text-sm text-neutral-500 line-through">
                {symbol}{(product.original_price_usd * rate).toFixed(2)}
              </p>
            )}
          </div>
          
          {onAddToCart && (
            <Button
              size="icon"
              className="bg-primary/20 hover:bg-primary/30 text-primary rounded-full"
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              data-testid={`add-to-cart-${product.product_id}`}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Stock indicator */}
        {product.stock <= 5 && product.stock > 0 && (
          <p className="text-xs text-amber-400">Only {product.stock} left!</p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-400">Out of stock</p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
