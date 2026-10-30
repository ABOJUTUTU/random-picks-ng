# Draft catalog database

The migration is prepared at
`supabase/migrations/202610290001_product_drafts.sql`. It has not been executed
against a live database. Apply it through a trusted database owner after reviewing
the target project's existing `public.products` schema.

It creates an isolated `public.product_drafts` table. Public storefronts and the
shopping assistant continue to read `public.products`; generation writes no
products there. The only changes to the existing product table are nullable
`catalog_category` and `catalog_sku` columns and their indexes. Existing product
values, order tables, product grants and product RLS policies are preserved.

## Administrator setup

1. Find the intended owner's UUID in Supabase Authentication users.
2. As a trusted database owner, insert that UUID into
   `private.catalog_admins(user_id)`. No account is automatically allowlisted.
3. Sign in as that account in the application before using draft tools.

Keep `private` outside the Supabase API's exposed schemas. Authenticated roles
receive schema usage and execute permissions for the protected helpers; they
receive no permission to read or change the allowlist. Every elevated operation
checks the signed-in user's UUID against that table.

The public RPCs are SECURITY INVOKER wrappers. Elevated implementations are
SECURITY DEFINER functions in `private` with an empty search path and qualified
object names. A service-role key is not needed by the browser or these RPCs.

## Generation and review

The chosen six categories are Smartwatches, Sneakers, Phones, Powerbanks,
Clothes & Trousers, and Perfumes. Requesting 5000 per category creates 30000
private placeholders, subject to existing rows. Each category accepts at most
5000 placeholders per call, with at most 20 categories.

SKUs are deterministic from the trimmed, case-folded category and ordinal.
Repeating generation inserts only missing SKUs and preserves all edits,
rejections and publications. Names are explicitly `CATEGORY draft 00001`.
Prices and stock are NULL, image arrays are empty, and verification is false.
These are generated concepts, not representations of actual supplier inventory.

Supply genuine names, prices, stock, images and optional descriptions before
approval. The owner must explicitly verify the supplied information. Approval
requires a changed placeholder name, positive price, nonnegative stock, and at
least one HTTPS image URL. All image URLs must use the supported HTTPS hostname
format. URL validation checks syntax; it does not establish ownership, image
content, inventory accuracy or supplier authenticity.

Bulk updates require 1–100 rows containing all of:
`sku,name,description,price,stock,colors,types,images,verified`.
Description must be a string, array fields must be arrays of strings, and
`verified` must be an explicit boolean. Unpublished prices and stock may remain
NULL. Prices allow two decimal places; stock must be an integer.
Limits are 200 name characters, 6000 description characters, 30 colours/types
of at most 100 characters each, and 20 image URLs of at most 2000 characters.
The entire batch is validated before any update. Duplicate SKUs are rejected.
Unknown and published SKUs are skipped; `updated_count` reports actual updates.
Editing a rejected draft through this RPC returns it to draft status.

Direct authenticated edits are limited to the allowlisted administrator,
unpublished draft rows and editable content columns. SKU, category, status,
publication linkage and approval audit columns cannot be changed directly.

## RPC contract

All draft RPCs require an authenticated allowlisted administrator:

| RPC | Arguments | Result |
| --- | --- | --- |
| `catalog_is_admin` | none | boolean; false for a signed-in nonmember |
| `catalog_generate_drafts` | `categories:text[], per_category:int=5000` | `{inserted_count,total_count,categories:[{category,inserted_count,total_count}]}` |
| `catalog_update_drafts` | `rows:jsonb` | `{updated_count}` |
| `catalog_draft_summary` | none | `[{category,total_count,draft_count,ready_count,published_count,rejected_count}]` |
| `catalog_approve_drafts` | `ids:uuid[]=null, category_filter:text=null` | `{published_count,published_ids,product_ids}` |
| `catalog_reject_drafts` | `ids:uuid[]` | `{rejected_count,rejected_ids}` |

Approval selects at most 100 eligible drafts per transaction. NULL IDs select
the next eligible batch; an empty explicit ID array selects nothing. Concurrent
workers skip locked rows. Product insertion and draft publication commit
together, and the unique live SKU plus row locks prevent retry duplicates.
An existing live product with the same catalog SKU is linked without overwriting
its data. The generated placeholder description becomes NULL on publication
unless the owner replaced it. Publication records the acting user's UUID and time.

An approval loop can call the RPC until `published_count` is zero, bounded by
the initial ready count. A zero result may also mean another worker currently
holds the eligible rows; refresh the summary afterward.

`catalog_public_categories()` returns `text[]` and is available to anonymous
and authenticated callers. It reads only categories on live products with the
caller's existing product RLS permissions.

Security choices follow Supabase's official
[database function](https://supabase.com/docs/guides/database/functions) and
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
guidance.
