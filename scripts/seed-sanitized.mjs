import mysql from "mysql2/promise";
import { fixtureCategories, fixtureCollections, fixtureRelationships, fixtureResources, fixtureSubcategories, fixtureTags } from "./seed-fixtures.mjs";

if (process.env.NORTHSTAR_ALLOW_SEED !== "1") {
  throw new Error("Refusing to seed. Run only against a disposable local database with NORTHSTAR_ALLOW_SEED=1.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for local sanitized seeding.");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const curatorOpenId = "northstar-sanitized-seed-curator";

try {
  await connection.execute(
    "INSERT INTO users (openId, name, email, loginMethod, role, reputation) VALUES (?, ?, NULL, ?, ?, 0) ON DUPLICATE KEY UPDATE name = VALUES(name)",
    [curatorOpenId, "NorthStar Seed Curator", "seed", "admin"],
  );
  const [[curator]] = await connection.execute("SELECT id FROM users WHERE openId = ? LIMIT 1", [curatorOpenId]);

  for (const [name, slug, description] of fixtureCategories) {
    await connection.execute(
      "INSERT INTO categories (name, slug, description, `order`) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)",
      [name, slug, description],
    );
  }
  for (const name of fixtureTags) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await connection.execute("INSERT INTO tags (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)", [name, slug]);
  }
  for (const [categorySlug, name, slug, description] of fixtureSubcategories) {
    const [[category]] = await connection.execute("SELECT id FROM categories WHERE slug = ? LIMIT 1", [categorySlug]);
    await connection.execute(
      "INSERT INTO subcategories (categoryId, name, slug, description, `order`) VALUES (?, ?, ?, ?, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)",
      [category.id, name, slug, description],
    );
  }

  for (const [title, slug, description, categorySlug, subcategorySlug, pricing, resourceTags, featured] of fixtureResources) {
    const [[category]] = await connection.execute("SELECT id FROM categories WHERE slug = ? LIMIT 1", [categorySlug]);
    const [[subcategory]] = await connection.execute("SELECT id FROM subcategories WHERE categoryId = ? AND slug = ? LIMIT 1", [category.id, subcategorySlug]);
    const url = `https://example.com/northstar-fixtures/${slug}`;
    await connection.execute(
      "INSERT INTO resources (title, slug, description, url, categoryId, subcategoryId, pricing, license, builtBy, submittedBy, status, featured, approvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 'Sanitized development fixture', 'NorthStar Seed', ?, 'approved', ?, NOW()) ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), url = VALUES(url), categoryId = VALUES(categoryId), subcategoryId = VALUES(subcategoryId), pricing = VALUES(pricing), license = VALUES(license), builtBy = VALUES(builtBy), featured = VALUES(featured)",
      [title, slug, description, url, category.id, subcategory.id, pricing, curator.id, featured ? 1 : 0],
    );
    const [[resource]] = await connection.execute("SELECT id FROM resources WHERE slug = ? LIMIT 1", [slug]);
    await connection.execute("DELETE FROM resource_tags WHERE resourceId = ?", [resource.id]);
    for (const tagName of resourceTags) {
      const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const [[tag]] = await connection.execute("SELECT id FROM tags WHERE slug = ? LIMIT 1", [tagSlug]);
      await connection.execute("INSERT IGNORE INTO resource_tags (resourceId, tagId) VALUES (?, ?)", [resource.id, tag.id]);
    }
    await connection.execute("DELETE FROM resource_sources WHERE resourceId = ? AND url LIKE 'https://example.com/northstar-fixtures/%'", [resource.id]);
    await connection.execute(
      "INSERT INTO resource_sources (resourceId, url, sourceType, attribution, licenseNote, verificationStatus, addedBy, verifiedBy, verifiedAt) VALUES (?, ?, 'official', 'NorthStar sanitized development fixture', 'Synthetic local test data only', 'approved', ?, ?, NOW())",
      [resource.id, `${url}/source`, curator.id, curator.id],
    );
  }

  for (const [sourceSlug, targetSlug, type, rationale, sourceContext] of fixtureRelationships) {
    const [[source]] = await connection.execute("SELECT id FROM resources WHERE slug = ? LIMIT 1", [sourceSlug]);
    const [[target]] = await connection.execute("SELECT id FROM resources WHERE slug = ? LIMIT 1", [targetSlug]);
    await connection.execute(
      "INSERT INTO relationships (sourceId, targetId, type, strength, verified, createdBy, status, evidenceUrl, rationale, sourceContext) VALUES (?, ?, ?, '0.80', 1, ?, 'approved', ?, ?, ?) ON DUPLICATE KEY UPDATE strength = VALUES(strength), verified = VALUES(verified), status = VALUES(status), evidenceUrl = VALUES(evidenceUrl), rationale = VALUES(rationale), sourceContext = VALUES(sourceContext)",
      [source.id, target.id, type, curator.id, `https://example.com/northstar-fixtures/evidence/${sourceSlug}-${targetSlug}-${type}`, rationale, sourceContext],
    );
  }

  for (const [name, slug, description, resourceSlugs] of fixtureCollections) {
    await connection.execute(
      "INSERT INTO collections (ownerId, name, slug, description, isPublic, upvotes) VALUES (?, ?, ?, ?, 1, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), isPublic = VALUES(isPublic)",
      [curator.id, name, slug, description],
    );
    const [[collection]] = await connection.execute("SELECT id FROM collections WHERE ownerId = ? AND slug = ? LIMIT 1", [curator.id, slug]);
    await connection.execute("DELETE FROM collection_resources WHERE collectionId = ?", [collection.id]);
    for (const [order, resourceSlug] of resourceSlugs.entries()) {
      const [[resource]] = await connection.execute("SELECT id FROM resources WHERE slug = ? LIMIT 1", [resourceSlug]);
      await connection.execute("INSERT IGNORE INTO collection_resources (collectionId, resourceId, `order`) VALUES (?, ?, ?)", [collection.id, resource.id, order]);
    }
  }
  console.log(`Sanitized NorthStar development seed completed with ${fixtureResources.length} resources and ${fixtureRelationships.length} verified graph fixtures. No live data was exported or imported.`);
} finally {
  await connection.end();
}
