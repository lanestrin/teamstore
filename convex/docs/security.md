# Security controls

Store artwork is untrusted, including previously saved SVG snapshots. Every inline
SVG insertion passes through DOMPurify with an SVG profile. Scripts, event handlers,
HTML, stylesheet tags, inline CSS, navigation, and animation elements are removed.
Text, paths, template IDs, editor attributes, and image references remain supported.

The public variant endpoint returns an explicit customer-facing field list. Supplier
costs and supplier identifiers remain available only through admin-protected APIs.

Password reset codes use Web Crypto with rejection sampling. Convex Auth continues
to handle code expiry and verification-attempt limits. The custom users table retains
the library's profile fields and exact `email` and `phone` index names.

## Uploads

The authenticated `storeUploads.uploadFile` action replaces `generateUploadUrl`.
Clients send file bytes through the Convex client, which supplies authentication.
The server checks file signatures, assigns the stored MIME type, and enforces:

- PNG, JPEG, or SVG; 1 byte to 5 MiB per file.
- 30 upload reservations per user per hour.
- 100 files and 100 MiB per user, including in-flight reservations.
- Ownership checks whenever files are attached to a draft.
- Scheduled cleanup of unused uploads after 24 hours and detached files after a
  grace period. Files referenced by another store are retained.

Limits are defined in `convex/lib/storeFiles.ts`. Quota reservations and attachment
changes are transactional. Failed uploads release reservations and delete their blob
when storage has already succeeded. The old unrestricted URL endpoint is removed.

Deploy the backend schema/functions and updated frontend together; older clients
using `generateUploadUrl` must refresh. No live deployment is performed by tests.

## Existing files

Files uploaded before ownership tracking are preserved when already attached to a
store. They cannot be attached to a different store through the new APIs. They are
excluded from automatic deletion and new per-user storage accounting because their
ownership and shared references cannot be inferred safely from storage metadata.
Audit these legacy files and references before backfilling ownership or deleting
unreferenced blobs. New uploads are tracked and subject to the controls above.
