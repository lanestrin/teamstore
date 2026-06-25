import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LuChevronRight,
  LuGrid2X2,
  LuList,
  LuMapPin,
  LuSearch,
} from "react-icons/lu";

import styles from "./StoresPage.module.scss";

import jaguarsLogo from "../../assets/images/jaguars_logo.png";
import knightsLogo from "../../assets/images/knights_logo.png";
import lionsLogo from "../../assets/images/lions_logo.png";
import tigersLogo from "../../assets/images/tigers_logo.png";
import trojanLogo from "../../assets/images/trojan_logo.png";

const stores = [
  {
    slug: "jaguars-soccer",
    name: "Jaguars Soccer",
    sport: "Soccer",
    level: "High School",
    state: "MO",
    products: 124,
    logo: jaguarsLogo,
  },
  {
    slug: "knights-baseball",
    name: "Knights Baseball",
    sport: "Baseball",
    level: "High School",
    state: "KS",
    products: 96,
    logo: knightsLogo,
  },
  {
    slug: "lions-track",
    name: "Lions Track",
    sport: "Track & Field",
    level: "High School",
    state: "MO",
    products: 88,
    logo: lionsLogo,
  },
  {
    slug: "tigers-athletics",
    name: "Tigers Athletics",
    sport: "Multi-Sport",
    level: "High School",
    state: "KS",
    products: 156,
    logo: tigersLogo,
  },
  {
    slug: "trojans-lacrosse",
    name: "Trojans Lacrosse",
    sport: "Lacrosse",
    level: "High School",
    state: "MO",
    products: 74,
    logo: trojanLogo,
  },
];

const nearbyStores = [
  {
    name: "Blue Valley West",
    distance: "2.1 miles away",
    logo: jaguarsLogo,
  },
  {
    name: "Staley Falcons",
    distance: "3.4 miles away",
    logo: knightsLogo,
  },
  {
    name: "Liberty North",
    distance: "4.2 miles away",
    logo: lionsLogo,
  },
  {
    name: "Lee's Summit West",
    distance: "5.6 miles away",
    logo: tigersLogo,
  },
  {
    name: "Oak Park High School",
    distance: "7.3 miles away",
    logo: trojanLogo,
  },
];

export default function StoresPage() {
  const [view, setView] = useState<"list" | "grid">("list");

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Find Your Team Store</h1>

        <p>
          Search by school, team, mascot, club, or city.
        </p>

        <div className={styles.search}>
          <LuSearch />

          <input
            type="search"
            placeholder="Search team, school, mascot, club, or city..."
          />
        </div>
      </section>

      <section className={styles.filters}>
        <label>
          <span>Sport</span>

          <select>
            <option>All Sports</option>
            <option>Baseball</option>
            <option>Basketball</option>
            <option>Cheer</option>
            <option>Football</option>
            <option>Soccer</option>
            <option>Track & Field</option>
            <option>Volleyball</option>
          </select>
        </label>

        <label>
          <span>Level</span>

          <select>
            <option>All Levels</option>
            <option>Youth</option>
            <option>Middle School</option>
            <option>High School</option>
            <option>Club</option>
          </select>
        </label>

        <label>
          <span>State</span>

          <select>
            <option>All States</option>
            <option>MO</option>
            <option>KS</option>
          </select>
        </label>

        <label>
          <span>Sort By</span>

          <select>
            <option>A-Z</option>
            <option>Most Products</option>
            <option>Newest</option>
          </select>
        </label>
      </section>

      <section className={styles.results}>
        <div className={styles.resultsHeader}>
          <h2>
            <span>128</span> Stores Found
          </h2>

          <div className={styles.viewToggle}>
            <button
              type="button"
              className={
                view === "grid"
                  ? styles.activeView
                  : ""
              }
              onClick={() => setView("grid")}
            >
              <LuGrid2X2 />
              Grid View
            </button>

            <button
              type="button"
              className={
                view === "list"
                  ? styles.activeView
                  : ""
              }
              onClick={() => setView("list")}
            >
              <LuList />
              List View
            </button>
          </div>
        </div>

        {view === "list" ? (
          <div className={styles.storeList}>
            {stores.map((store) => (
              <Link
                key={store.slug}
                to={`/store/${store.slug}`}
                className={styles.storeRow}
              >
                <img
                  src={store.logo}
                  alt={store.name}
                />

                <strong>{store.name}</strong>

                <div className={styles.tags}>
                  <span>{store.sport}</span>
                  <span>{store.level}</span>
                  <span>{store.state}</span>
                </div>

                <small>
                  {store.products} Products
                </small>

                <LuChevronRight
                  className={styles.rowIcon}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.gridView}>
            {stores.map((store) => (
              <Link
                key={store.slug}
                to={`/store/${store.slug}`}
                className={styles.gridCard}
              >
                <div
                  className={styles.gridCardImage}
                >
                  <img
                    src={store.logo}
                    alt={store.name}
                  />
                </div>

                <div
                  className={styles.gridCardContent}
                >
                  <strong>{store.name}</strong>

                  <div className={styles.gridTags}>
                    <span>{store.sport}</span>
                    <span>{store.level}</span>
                  </div>

                  <small>
                    {store.products} Products
                  </small>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className={styles.pagination}>
          <button className={styles.currentPage}>
            1
          </button>

          <button>2</button>

          <button>3</button>

          <span>...</span>

          <button>11</button>

          <button>
            <LuChevronRight />
          </button>
        </div>
      </section>

      <section className={styles.nearby}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Stores Near You</h2>

            <p>
              <LuMapPin />
              Based on your location
            </p>
          </div>

          <button type="button">
            <LuMapPin />
            Use my location
          </button>
        </div>

        <div className={styles.nearbyGrid}>
          {nearbyStores.map((store) => (
            <div
              key={store.name}
              className={styles.nearbyCard}
            >
              <img
                src={store.logo}
                alt={store.name}
              />

              <strong>{store.name}</strong>

              <span>{store.distance}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <div>
          <h2>Don't See Your Team?</h2>

          <p>
            Create a TeamStore in minutes and
            start your own team shop today.
          </p>
        </div>

        <Link to="/create-store">
          Create Your Store
        </Link>
      </section>
    </div>
  );
}
