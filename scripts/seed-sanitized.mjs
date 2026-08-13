import mysql from "mysql2/promise";

if (process.env.NORTHSTAR_ALLOW_SEED !== "1") {
  throw new Error("Refusing to seed. Run only against a disposable local database with NORTHSTAR_ALLOW_SEED=1.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for local sanitized seeding.");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const curatorOpenId = "northstar-sanitized-seed-curator";

const categories = [
  ["Developer Tools", "developer-tools", "Tools for building and operating software."],
  ["Design", "design", "Resources for design and product collaboration."],
  ["Learning", "learning", "Learning and research resources."],
];

const tags = ["source-control", "collaboration", "design", "learning", "open-source"];
const resources = [
  ["Atlas Code", "atlas-code", "Synthetic example of a code collaboration resource used only for local development.", "https://example.com/atlas-code", "developer-tools", "freemium", "Synthetic example", "NorthStar Seed", true],
  ["Atlas Canvas", "atlas-canvas", "Synthetic example of a collaborative interface design resource used only for local development.", "https://example.com/atlas-canvas", "design", "free", "Synthetic example", "NorthStar Seed", false],
  ["Atlas Learn", "atlas-learn", "Synthetic example of an open learning resource used only for local development.", "https://example.com/atlas-learn", "learning", "open_source", "Synthetic example", "NorthStar Seed", false],
];

try {
  await connection.execute(
    "INSERT INTO users (openId, name, email, loginMethod, role, reputation) VALUES (?, ?, NULL, ?, ?, 0) ON DUPLICATE KEY UPDATE name = VALUES(name)",
    [curatorOpenId, "NorthStar Seed Curator", "seed", "admin"],
  );
  const [[curator]] = await connection.execute("SELECT id FROM users WHERE openId = ? LIMIT 1", [curatorOpenId]);

  for (const [name, slug, description] of categories) {
    await connection.execute(
      "INSERT INTO categories (name, slug, description, `order`) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)",
      [name, slug, description],
    );
  }
  for (const name of tags) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await connection.execute("INSERT INTO tags (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)", [name, slug]);
  }
  for (const [title, slug, description, url, categorySlug, pricing, license, builtBy, featured] of resources) {
    const [[category]] = await connection.execute("SELECT id FROM categories WHERE slug = ? LIMIT 1", [categorySlug]);
    await connection.execute(
      "INSERT INTO resources (title, slug, description, url, categoryId, pricing, license, builtBy, submittedBy, status, featured, approvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, NOW()) ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), url = VALUES(url), pricing = VALUES(pricing), license = VALUES(license), builtBy = VALUES(builtBy), featured = VALUES(featured)",
      [title, slug, description, url, category.id, pricing, license, builtBy, curator.id, featured ? 1 : 0],
    );
  }
  console.log("Sanitized NorthStar development seed completed. No live data was exported or imported.");
} finally {
  await connection.end();
}
