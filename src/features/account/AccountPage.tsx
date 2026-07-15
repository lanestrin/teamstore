import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { LuSearch, LuStore } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

import ActionCard from "./components/ActionCard/ActionCard";
import FavoriteStores from "./components/FavoriteStores/FavoriteStores";
import HelpCard from "./components/HelpCard/HelpCard";
import RecentOrders from "./components/RecentOrders/RecentOrders";

import { favoriteStores, recentOrders } from "../../mocks/account";

import styles from "./AccountPage.module.scss";

function getFirstName(
  name: string | undefined,
  email: string | undefined,
): string {
  const normalizedName = name?.trim();

  if (normalizedName) {
    return normalizedName.split(/\s+/)[0];
  }

  if (email) {
    return email.split("@")[0];
  }

  return "there";
}

function getStoreName(
  name: string | undefined,
  organizationName: string | undefined,
): string {
  return name?.trim() || organizationName?.trim() || "Untitled store";
}

function formatUpdatedDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function AccountPage() {
  const navigate = useNavigate();

  const currentUser = useQuery(api.users.current);

  const drafts = useQuery(api.organizations.listMyDrafts);

  const activeStores = useQuery(api.organizations.listMyActiveStores);

  const deleteDraft = useMutation(api.organizations.deleteDraft);

  const archiveStore = useMutation(api.organizations.archiveStore);

  const [deletingDraftId, setDeletingDraftId] = useState<Id<"stores"> | null>(
    null,
  );

  const [archivingStoreId, setArchivingStoreId] = useState<Id<"stores"> | null>(
    null,
  );

  const displayName = getFirstName(currentUser?.name, currentUser?.email);

  const hasStores =
    (drafts?.length ?? 0) > 0 || (activeStores?.length ?? 0) > 0;

  async function handleDeleteDraft(storeId: Id<"stores">): Promise<void> {
    if (deletingDraftId !== null) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this store draft? This cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingDraftId(storeId);

    try {
      await deleteDraft({
        storeId,
      });
    } catch (error) {
      window.alert(getErrorMessage(error));
    } finally {
      setDeletingDraftId(null);
    }
  }

  async function handleArchiveStore(storeId: Id<"stores">): Promise<void> {
    if (archivingStoreId !== null) {
      return;
    }

    const shouldArchive = window.confirm(
      "Archive this store? It will no longer appear as an active store.",
    );

    if (!shouldArchive) {
      return;
    }

    setArchivingStoreId(storeId);

    try {
      await archiveStore({
        storeId,
      });
    } catch (error) {
      window.alert(getErrorMessage(error));
    } finally {
      setArchivingStoreId(null);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>ACCOUNT</span>

          <h1>Welcome back, {displayName}!</h1>

          <p>Manage your stores and orders, or discover a new TeamStore.</p>
        </header>

        <section className={styles.actions}>
          <ActionCard
            icon={LuSearch}
            title="Find a Store"
            description="Browse apparel from your favorite teams, schools, and organizations."
            actionText="Browse Stores"
            onClick={() => navigate("/stores")}
          />

          <ActionCard
            icon={LuStore}
            title={hasStores ? "Create Another Store" : "Create a Store"}
            description="Launch a new online store for your team, school, club, or organization."
            actionText="Create Store"
            onClick={() => navigate("/create-store")}
          />
        </section>

        <section
          className={styles.storeSection}
          aria-labelledby="store-drafts-heading"
        >
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="store-drafts-heading">Store Drafts</h2>

              <p>Continue or delete stores that have not been published.</p>
            </div>

            {drafts !== undefined && (
              <span className={styles.countBadge}>{drafts.length}</span>
            )}
          </div>

          {drafts === undefined ? (
            <p className={styles.loadingMessage}>Loading store drafts...</p>
          ) : drafts.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No saved drafts</h3>

              <p>Stores you save for later will appear here.</p>
            </div>
          ) : (
            <div className={styles.storeList}>
              {drafts.map((draft) => {
                const draftName = getStoreName(
                  draft.name,
                  draft.organizationName,
                );

                const isDeleting = deletingDraftId === draft._id;

                return (
                  <article key={draft._id} className={styles.storeCard}>
                    <div className={styles.storeCardContent}>
                      <div className={styles.storeCardHeader}>
                        <h3>{draftName}</h3>

                        <span className={styles.draftStatus}>Draft</span>
                      </div>

                      <p className={styles.storeMeta}>
                        Step {draft.currentStep} of 5{" • "}
                        Updated {formatUpdatedDate(draft.updatedAt)}
                      </p>

                      {draft.slug && (
                        <p className={styles.storeSlug}>
                          teamstore.com/store/
                          {draft.slug}
                        </p>
                      )}
                    </div>

                    <div className={styles.storeCardActions}>
                      <button
                        type="button"
                        className={styles.primaryAction}
                        onClick={() =>
                          navigate(`/create-store?draftId=${draft._id}`)
                        }
                        disabled={isDeleting}
                      >
                        Continue Setup
                      </button>

                      <button
                        type="button"
                        className={styles.dangerAction}
                        onClick={() => void handleDeleteDraft(draft._id)}
                        disabled={deletingDraftId !== null}
                      >
                        {isDeleting ? "Deleting..." : "Delete Draft"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section
          className={styles.storeSection}
          aria-labelledby="active-stores-heading"
        >
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="active-stores-heading">Active Stores</h2>

              <p>Manage stores that have been published.</p>
            </div>

            {activeStores !== undefined && (
              <span className={styles.countBadge}>{activeStores.length}</span>
            )}
          </div>

          {activeStores === undefined ? (
            <p className={styles.loadingMessage}>Loading active stores...</p>
          ) : activeStores.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No active stores</h3>

              <p>Published stores will appear here.</p>
            </div>
          ) : (
            <div className={styles.storeList}>
              {activeStores.map((store) => {
                const storeName = getStoreName(
                  store.name,
                  store.organizationName,
                );

                const isArchiving = archivingStoreId === store._id;

                return (
                  <article key={store._id} className={styles.storeCard}>
                    <div className={styles.storeCardContent}>
                      <div className={styles.storeCardHeader}>
                        <h3>{storeName}</h3>

                        <span className={styles.activeStatus}>Active</span>
                      </div>

                      <p className={styles.storeMeta}>
                        Published store
                        {" • "}
                        Updated {formatUpdatedDate(store.updatedAt)}
                      </p>

                      {store.slug && (
                        <p className={styles.storeSlug}>
                          teamstore.com/store/
                          {store.slug}
                        </p>
                      )}
                    </div>

                    <div className={styles.storeCardActions}>
                      <button
                        type="button"
                        className={styles.primaryAction}
                        onClick={() =>
                          navigate(`/account/stores/${store._id}/edit`)
                        }
                        disabled={isArchiving}
                      >
                        Edit Store
                      </button>

                      {store.slug && (
                        <button
                          type="button"
                          className={styles.secondaryAction}
                          onClick={() => navigate(`/store/${store.slug}`)}
                          disabled={isArchiving}
                        >
                          View Store
                        </button>
                      )}

                      <button
                        type="button"
                        className={styles.dangerAction}
                        onClick={() => void handleArchiveStore(store._id)}
                        disabled={archivingStoreId !== null}
                      >
                        {isArchiving ? "Archiving..." : "Archive Store"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.contentGrid}>
          <FavoriteStores stores={favoriteStores} />

          <RecentOrders orders={recentOrders} />
        </section>

        <HelpCard />
      </div>
    </div>
  );
}
