// src/features/catalog/CatalogSetup.tsx
import { useState } from "react";
import { useAction, useMutation } from "convex/react";

import { api } from "../../../convex/_generated/api";

type ImportResult = {
  fetched: number;
  matched: number;
  imported: number;
  inserted: number;
  updated: number;
  variantsInserted: number;
  variantsUpdated: number;
};

type SeedResult = {
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  variantsSkipped: number;
};

export function CatalogSetup() {
  const importProducts = useAction(api.dummyJson.importProducts);

  const seedProducts = useMutation(api.seed.seedProducts);

  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("");

  const handleDummyJsonImport = async () => {
    setIsRunning(true);
    setMessage("");

    try {
      const result: ImportResult = await importProducts({
        athleticOnly: true,
        status: "draft",
      });

      setMessage(
        `Imported ${result.imported} products. ` +
          `${result.inserted} created, ` +
          `${result.updated} updated.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSeed = async () => {
    setIsRunning(true);
    setMessage("");

    try {
      const result: SeedResult = await seedProducts({
        resetExistingSeedProducts: false,
      });

      setMessage(
        `Created ${result.productsCreated} products and ` +
          `${result.variantsCreated} variants.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Seed failed.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section>
      <h1>Catalog Setup</h1>

      <button
        type="button"
        onClick={handleDummyJsonImport}
        disabled={isRunning}
      >
        {isRunning ? "Running..." : "Import DummyJSON products"}
      </button>

      <button type="button" onClick={handleSeed} disabled={isRunning}>
        {isRunning ? "Running..." : "Seed sample products"}
      </button>

      {message && <p>{message}</p>}
    </section>
  );
}
