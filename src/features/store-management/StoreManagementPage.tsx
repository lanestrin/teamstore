import { useQuery } from "convex/react";
import { LuArrowLeft, LuExternalLink } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

import styles from "./StoreManagementPage.module.scss";
import StoreProductsManager from "../../components/StoreProductManager/StoreProductsManager";

type ManagementTab = "details" | "branding" | "artwork" | "products" | "settings";

const tabs: Array<{
  id: ManagementTab;
  label: string;
  enabled: boolean;
}> = [
  { id: "details", label: "Store Details", enabled: false },
  { id: "branding", label: "Branding", enabled: false },
  { id: "artwork", label: "Artwork", enabled: false },
  { id: "products", label: "Products", enabled: true },
  { id: "settings", label: "Settings", enabled: false },
];

function formatStoreType(storeType: "fanwear" | "uniform" | "hybrid" | undefined): string {
  switch (storeType) {
    case "fanwear":
      return "Fanwear";
    case "uniform":
      return "Uniform Package";
    case "hybrid":
      return "Uniforms + Fanwear";
    default:
      return "Not set";
  }
}

function formatActivity(activity: string | undefined): string {
  if (!activity) {
    return "Not set";
  }

  return activity
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDeadline(deadline: string | undefined): string {
  if (!deadline) {
    return "None";
  }

  const parsedDate = new Date(`${deadline}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return deadline;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

export default function StoreManagementPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();

  const store = useQuery(
    api.stores.getStoreForManagement,
    storeId
      ? {
          storeId: storeId as Id<"stores">,
        }
      : "skip",
  );

  if (!storeId) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.stateCard}>
            <h1>Store not found</h1>
            <p>The store ID is missing from this URL.</p>

            <button type="button" className={styles.primaryAction} onClick={() => navigate("/account")}>
              Return to My Stores
            </button>
          </section>
        </div>
      </main>
    );
  }

  if (store === undefined) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.stateCard}>
            <p>Loading store...</p>
          </section>
        </div>
      </main>
    );
  }

  if (store === null) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.stateCard}>
            <h1>Store not found</h1>
            <p>This store does not exist, is not active, or you do not have access to manage it.</p>

            <button type="button" className={styles.primaryAction} onClick={() => navigate("/account")}>
              Return to My Stores
            </button>
          </section>
        </div>
      </main>
    );
  }

  const storeName = store.name?.trim() || store.organizationName?.trim() || "Untitled Store";

  const storePath = store.organizationSlug && store.slug ? `/store/${store.organizationSlug}/${store.slug}` : null;

  const publicStoreUrl = store.organizationSlug && store.slug ? `teamstore.com/store/${store.organizationSlug}/${store.slug}` : null;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topActions}>
          <button type="button" className={styles.backAction} onClick={() => navigate("/account")}>
            <LuArrowLeft aria-hidden="true" />
            Back to My Stores
          </button>

          {storePath && (
            <button type="button" className={styles.secondaryAction} onClick={() => navigate(storePath)}>
              View Store
              <LuExternalLink aria-hidden="true" />
            </button>
          )}
        </div>

        <section className={styles.storeHeader}>
          <div className={styles.identity}>
            <div className={styles.logo}>
              {store.logoUrl ? <img src={store.logoUrl} alt="" /> : <span aria-hidden="true">{storeName.charAt(0).toUpperCase()}</span>}
            </div>

            <div className={styles.identityContent}>
              <div className={styles.titleRow}>
                <h1>{storeName}</h1>
                <span className={styles.activeStatus}>Active</span>
              </div>

              {publicStoreUrl && <p className={styles.storeUrl}>{publicStoreUrl}</p>}
            </div>
          </div>

          <dl className={styles.storeFacts}>
            <div>
              <dt>Store Type</dt>
              <dd>{formatStoreType(store.storeType)}</dd>
            </div>

            <div>
              <dt>Activity</dt>
              <dd>{formatActivity(store.activity)}</dd>
            </div>

            <div>
              <dt>Order Deadline</dt>
              <dd>{formatDeadline(store.requiredItemsDeadline)}</dd>
            </div>
          </dl>
        </section>

        <nav className={styles.tabs} aria-label="Store management">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${tab.id === "products" ? styles.activeTab : ""}`}
              disabled={!tab.enabled}
              aria-current={tab.id === "products" ? "page" : undefined}
            >
              {tab.label}

              {!tab.enabled && <span className={styles.comingSoon}>Soon</span>}
            </button>
          ))}
        </nav>

        <section className={styles.content}>
          <StoreProductsManager store={store} />
        </section>
      </div>
    </main>
  );
}
