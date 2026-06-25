import FeaturedStores from "./components/FeatureStores/FeaturedStores";
import FeaturesBar from "./components/FeaturesBar/FeaturesBar";
import HeroSection from "./components/HeroSection/HeroSection";
import TrendingProducts from "./components/TrendingProducts/TrendingProducts";


export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesBar />
      <FeaturedStores />
      <TrendingProducts />
    </>
  );
}
