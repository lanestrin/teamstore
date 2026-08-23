/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as csvDemoCatalog from "../csvDemoCatalog.js";
import type * as docs_selectedProductsData from "../docs/selectedProductsData.js";
import type * as http from "../http.js";
import type * as lib_authz from "../lib/authz.js";
import type * as organizations from "../organizations.js";
import type * as productVariants from "../productVariants.js";
import type * as products from "../products.js";
import type * as resendOTPasswordReset from "../resendOTPasswordReset.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  csvDemoCatalog: typeof csvDemoCatalog;
  "docs/selectedProductsData": typeof docs_selectedProductsData;
  http: typeof http;
  "lib/authz": typeof lib_authz;
  organizations: typeof organizations;
  productVariants: typeof productVariants;
  products: typeof products;
  resendOTPasswordReset: typeof resendOTPasswordReset;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
