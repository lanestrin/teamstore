import FeaturedStores from "./components/FeatureStores/FeaturedStores";
import HeroSection from "./components/HeroSection/HeroSection";
import TrendingProducts from "./components/TrendingProducts/TrendingProducts";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedStores />
      <TrendingProducts />
    </>
  );
}
