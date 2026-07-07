"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { useAuth, API_URL } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import {
  Star,
  ShoppingCart,
  Heart,
  GitCompare,
  Shield,
  Truck,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";

interface ProductClientProps {
  productId: string;
}

export const ProductClient: React.FC<ProductClientProps> = ({ productId }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, inWishlist } = useWishlist();
  const { toggleCompare, inCompare } = useCompare();
  const { token, user } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery
  const [activeImage, setActiveImage] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  // Specs/Tabs state
  const [activeTab, setActiveTab] = useState<"specs" | "description" | "reviews">("specs");

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch Product Details
        const prodRes = await fetch(`${API_URL}/products/${productId}`);
        if (!prodRes.ok) {
          router.push("/404");
          return;
        }
        const prodData = await prodRes.json();
        setProduct(prodData);
        setActiveImage(prodData.image_urls[0]);

        // Fetch Reviews
        const reviewsRes = await fetch(`${API_URL}/products/${productId}/reviews`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData);
        }

        // Fetch Related Products (same category/brand)
        const relatedRes = await fetch(
          `${API_URL}/products?category=${prodData.category}&limit=4`
        );
        if (relatedRes.ok) {
          const relatedData = await relatedRes.json();
          // Filter out active product
          setRelatedProducts(relatedData.filter((p: any) => p.id !== prodData.id));
        }
      } catch (err) {
        console.error("Error loading product details", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) return null;

  const isWishlisted = inWishlist(product.id);
  const isCompared = inCompare(product.id);
  const discountedPrice = product.price * (1 - product.discount / 100);

  // Handle image zoom calculations
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleBuyNow = () => {
    addToCart(product, 1);
    router.push("/checkout");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setSubmittingReview(true);
    setReviewMessage("");
    try {
      const response = await fetch(`${API_URL}/products/${product.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      if (response.ok) {
        setReviewComment("");
        setReviewMessage("Review submitted successfully!");
        
        // Reload reviews and product rating
        const reviewsRes = await fetch(`${API_URL}/products/${product.id}/reviews`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData);
        }
        
        const prodRes = await fetch(`${API_URL}/products/${product.id}`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProduct(prodData);
        }
      } else {
        setReviewMessage("Failed to submit review. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setReviewMessage("An error occurred. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go Back</span>
        </button>

        {/* Product Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          
          {/* Gallery: 5 cols */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Active Display Image */}
            <div
              className="relative aspect-square w-full rounded-2xl border border-glass-border bg-white overflow-hidden p-6 cursor-zoom-in"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={activeImage}
                alt={product.name}
                className="h-full w-full object-contain transition-transform duration-200"
                style={
                  isZoomed
                    ? {
                        transform: "scale(2)",
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      }
                    : undefined
                }
              />
            </div>

            {/* Thumbnails Row */}
            {product.image_urls.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.image_urls.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`h-16 w-16 p-2 rounded-xl border bg-white shrink-0 overflow-hidden ${
                      activeImage === img ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Info: 7 cols */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            
            {/* Top Row Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                product.condition === "New" 
                  ? "bg-green-500/10 text-green-500"
                  : product.condition === "Refurbished"
                  ? "bg-blue-500/10 text-blue-500"
                  : "bg-amber-500/10 text-amber-500"
              }`}>
                {product.condition} Condition
              </span>
              <span className="px-3 py-1 rounded-full bg-secondary text-foreground text-xs font-bold uppercase">
                {product.brand}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-4xl font-black text-foreground mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Stars & Reviews summary */}
            <div className="flex items-center gap-4 mb-6 border-b border-border/40 pb-4">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                <Star className="h-4.5 w-4.5 fill-current" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{reviews.length} Customer Reviews</span>
              </span>
            </div>

            {/* Pricing Summary */}
            <div className="mb-8 p-6 rounded-3xl bg-secondary/25 border border-glass-border max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-semibold">Total Price (Sri Lanka)</span>
                {product.discount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-red-500 text-white font-extrabold text-[10px]">
                    SAVE {product.discount}%
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-foreground">
                  LKR {discountedPrice.toLocaleString()}
                </span>
                {product.discount > 0 && (
                  <span className="text-sm text-muted-foreground line-through">
                    LKR {product.price.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-primary" />
                <span>Islandwide Delivery Available. Pay via Cash on Delivery or Bank Transfer.</span>
              </div>
            </div>

            {/* Stock status indicator */}
            <div className="mb-6 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${product.stock > 0 ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-xs font-bold">
                {product.stock > 0 ? `In Stock (${product.stock} units available)` : "Out of Stock"}
              </span>
            </div>

            {/* Checkout Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-xl">
              <button
                onClick={() => addToCart(product, 1)}
                disabled={product.stock <= 0}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                <span>Add To Cart</span>
              </button>
              
              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex-1 h-12 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-all flex items-center justify-center"
              >
                Buy It Now
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3 rounded-xl border transition-all ${
                    isWishlisted ? "border-red-500/40 bg-red-500/5 text-red-500" : "border-border hover:border-red-500/30"
                  }`}
                  title="Wishlist"
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => toggleCompare(product)}
                  className={`p-3 rounded-xl border transition-all ${
                    isCompared ? "border-primary/40 bg-primary/5 text-primary" : "border-border hover:border-primary/30"
                  }`}
                  title="Compare"
                >
                  <GitCompare className="h-5 w-5" />
                </button>
              </div>
            </div>



          </div>
        </div>

        {/* Tab content area */}
        <section className="mb-20">
          <div className="flex border-b border-border/60 gap-6 mb-8 text-sm font-semibold">
            <button
              onClick={() => setActiveTab("specs")}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === "specs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Specifications Table
            </button>
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === "description" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === "reviews" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Customer Reviews ({reviews.length})
            </button>
          </div>

          {/* 1. Tab: Specs Table */}
          {activeTab === "specs" && (
            <div className="max-w-2xl rounded-2xl border border-glass-border overflow-hidden bg-card/40 backdrop-blur-md">
              <table className="w-full text-left text-xs">
                <tbody>
                  <tr className="border-b border-border/40">
                    <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20 w-1/3">Processor</td>
                    <td className="px-6 py-4 font-semibold">{product.specs.cpu}</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">RAM Memory</td>
                    <td className="px-6 py-4 font-semibold">{product.specs.ram}</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Storage</td>
                    <td className="px-6 py-4 font-semibold">{product.specs.storage}</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Graphics (GPU)</td>
                    <td className="px-6 py-4 font-semibold">{product.specs.gpu}</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Display Size & Resolution</td>
                    <td className="px-6 py-4 font-semibold">{product.specs.display}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Operating System</td>
                    <td className="px-6 py-4 font-semibold">{product.specs.os}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Tab: Description */}
          {activeTab === "description" && (
            <div className="max-w-3xl leading-relaxed text-sm text-foreground/80 space-y-4">
              <p>{product.description || "No full description provided."}</p>
              <h4 className="font-bold text-foreground mt-6">Product Overview:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Inspected and authenticated by the Mr_Laptop.lk expert tech division.</li>
                <li>Clean installation of {product.specs.os}. Ready for immediate setup.</li>
                <li>Accompanied by the original laptop adapter and charger.</li>
                <li>Shipped inside robust bubble-boxed packaging to survive islandwide routes.</li>
              </ul>
            </div>
          )}

          {/* 3. Tab: Reviews */}
          {activeTab === "reviews" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Reviews List: 7 columns */}
              <div className="lg:col-span-7 space-y-6">
                <h3 className="text-base font-bold mb-4">Customer Opinions ({reviews.length})</h3>
                {reviews.length > 0 ? (
                  reviews.map((r) => (
                    <div key={r.id} className="p-5 rounded-2xl border border-glass-border bg-card/30 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-amber-500">
                          {[...Array(r.rating)].map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-current" />
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-xs text-foreground/85 leading-relaxed mb-3">"{r.comment}"</p>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        BY {r.user_name || "Verified Customer"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Be the first to review this laptop.</p>
                )}
              </div>

              {/* Submit Review: 5 columns */}
              <div className="lg:col-span-5">
                <div className="p-6 rounded-3xl border border-glass-border bg-card">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Post a Review</h3>
                  {user ? (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      
                      {/* Rating selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Rating</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className={`p-1.5 rounded-full hover:bg-secondary transition-all ${
                                star <= reviewRating ? "text-amber-500" : "text-muted-foreground"
                              }`}
                            >
                              <Star className="h-5 w-5 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Comment</label>
                        <textarea
                          rows={3}
                          required
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="What did you think of this device's specs, condition, and performance?..."
                          className="w-full p-3 rounded-lg bg-secondary border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="w-full h-10 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/95 transition-all flex items-center justify-center"
                      >
                        {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
                      </button>

                      {reviewMessage && (
                        <p className={`text-xs font-bold ${reviewMessage.includes("success") ? "text-green-500" : "text-red-500"}`}>
                          {reviewMessage}
                        </p>
                      )}

                    </form>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground mb-4">You must be logged in to leave reviews.</p>
                      <button
                        onClick={() => router.push("/auth/login")}
                        className="px-6 h-9 rounded-full bg-secondary border text-xs font-bold hover:bg-secondary/80 transition-all"
                      >
                        Sign In Now
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </section>

        {/* Related Laptops section */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-border/40 pt-16 mb-12">
            <h2 className="text-xl sm:text-2xl font-black mb-8 tracking-tight">Related Premium Systems</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
};
