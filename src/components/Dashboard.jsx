import { useMemo, useState } from "react";
import ComparisonTray from "@/components/ComparisonTray";
import ControlsBar from "@/components/ControlsBar";
import FilterSidebar from "@/components/FilterSidebar";
import HeroSection from "@/components/HeroSection";
import HistoryAndSaved from "@/components/HistoryAndSaved";
import HowItWorks from "@/components/HowItWorks";
import InsightsPanel from "@/components/InsightsPanel";
import ProductGrid from "@/components/ProductGrid";
import ProductModal from "@/components/ProductModal";
import RecommendationCarousel from "@/components/RecommendationCarousel";
import ThemeToggle from "@/components/ThemeToggle";
import { SITE_NAME } from "@/config/site";
import { products, trendingSearches } from "@/data/mockData";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function Dashboard({ user, theme, onToggleTheme, onLogout }) {
  const maxPrice = Math.max(...products.map((item) => item.price));
  const [query, setQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortBy, setSortBy] = useState("similarity");
  const [viewMode, setViewMode] = useState("grid");
  const [searchHistory, setSearchHistory] = useLocalStorage("lens-search-history", []);
  const [savedSearches, setSavedSearches] = useLocalStorage("lens-saved-searches", [
    "minimal watches",
    "olive chinos",
  ]);
  const [wishlist, setWishlist] = useLocalStorage("lens-wishlist", []);
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage("lens-recently-viewed", []);
  const [compareList, setCompareList] = useState([]);
  const [filters, setFilters] = useState({
    categories: [],
    brands: [],
    colors: [],
    inStockOnly: false,
    maxPrice,
  });

  const handleRunSearch = (newQuery) => {
    const finalQuery = (newQuery ?? query).trim();
    if (newQuery) setQuery(newQuery);
    if (!finalQuery) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSearchHistory((prev) => [finalQuery, ...prev.filter((item) => item !== finalQuery)].slice(0, 8));
      if (Math.random() > 0.5) {
        setSavedSearches((prev) => [finalQuery, ...prev.filter((item) => item !== finalQuery)].slice(0, 6));
      }
    }, 700);
  };

  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase();
    let results = products.filter((item) => {
      const queryMatch =
        !q ||
        [item.name, item.category, item.brand, item.color, item.style, item.texture]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const categoryMatch = !filters.categories.length || filters.categories.includes(item.category);
      const brandMatch = !filters.brands.length || filters.brands.includes(item.brand);
      const colorMatch = !filters.colors.length || filters.colors.includes(item.color);
      const stockMatch = !filters.inStockOnly || item.available;
      const priceMatch = item.price <= filters.maxPrice;

      return queryMatch && categoryMatch && brandMatch && colorMatch && stockMatch && priceMatch;
    });

    if (sortBy === "similarity") results = results.sort((a, b) => b.match - a.match);
    if (sortBy === "rating") results = results.sort((a, b) => b.rating - a.rating);
    if (sortBy === "priceLow") results = results.sort((a, b) => a.price - b.price);
    if (sortBy === "priceHigh") results = results.sort((a, b) => b.price - a.price);

    return results;
  }, [query, filters, sortBy]);

  const completeTheLook = filteredProducts.slice(3, 9);

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    setRecentlyViewed((prev) => [product, ...prev.filter((entry) => entry.id !== product.id)].slice(0, 6));
  };

  const toggleWishlist = (id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((productId) => productId !== id) : [...prev, id]
    );
  };

  const toggleCompare = (product) => {
    setCompareList((prev) => {
      if (prev.some((entry) => entry.id === product.id)) {
        return prev.filter((entry) => entry.id !== product.id);
      }
      return [...prev, product].slice(0, 4);
    });
  };

  return (
    <div className="lens-app">
      <header className="top-nav">
        <div className="brand">
          <span className="brand-icon">?</span>
          {SITE_NAME}
        </div>
        <nav>
          <a href="#hero">Discover</a>
          <a href="#catalog">Catalog</a>
          <a href="#saved">Saved</a>
        </nav>
        <div className="nav-actions">
          <span className="user-greeting">Hi, {user.name}</span>
          <button type="button" className="logout-btn" onClick={onLogout}>
            Sign out
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </header>

      <HeroSection
        query={query}
        setQuery={setQuery}
        onImageUpload={(event) => setSelectedImage(event.target.files?.[0]?.name ?? null)}
        onCameraUpload={() => setSelectedImage("camera-capture.jpg")}
        onRunSearch={() => handleRunSearch()}
        onChipClick={(chip) => handleRunSearch(chip)}
      />

      <HistoryAndSaved
        searchHistory={searchHistory}
        savedSearches={savedSearches.length ? savedSearches : trendingSearches.slice(0, 2)}
        onReuseSearch={(term) => handleRunSearch(term)}
      />

      <section className="catalog-layout" id="catalog">
        <FilterSidebar filters={filters} setFilters={setFilters} maxPrice={maxPrice} />

        <main className="catalog-content">
          <ControlsBar
            sortBy={sortBy}
            setSortBy={setSortBy}
            viewMode={viewMode}
            setViewMode={setViewMode}
            count={filteredProducts.length}
          />
          <InsightsPanel query={query} selectedImage={selectedImage} />
          <ProductGrid
            items={filteredProducts}
            viewMode={viewMode}
            onOpen={handleOpenProduct}
            loading={loading}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            compareList={compareList}
            onCompareToggle={toggleCompare}
          />
        </main>
      </section>

      <HowItWorks />
      <RecommendationCarousel items={completeTheLook} title="Complete the look" />
      <RecommendationCarousel items={recentlyViewed} title="Recently viewed" />
      <ComparisonTray
        items={compareList}
        onRemove={(id) => setCompareList((prev) => prev.filter((entry) => entry.id !== id))}
      />

      <footer id="saved">Powered by image embeddings and vector similarity.</footer>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
