import mysql from "mysql2/promise";

const replacements = [
  {
    previousSourceUrl: "https://github.com/solid/solid",
    title: "solid-client-js",
    url: "https://github.com/inrupt/solid-client-js",
    sourceUrl: "https://github.com/inrupt/solid-client-js",
    description: "Library for accessing data and managing permissions on data stored in a Solid Pod",
    license: "MIT",
    tags: ["communication", "solid", "data-access", "permissions", "javascript"],
  },
  {
    previousSourceUrl: "https://github.com/chatscope/chat-ui-kit-react",
    title: "use-chat",
    url: "https://github.com/chatscope/use-chat",
    sourceUrl: "https://github.com/chatscope/use-chat",
    description: "React hook for state management in chat applications.",
    license: "MIT",
    tags: ["communication", "chat", "react", "frontend", "state-management"],
  },
];

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [[systemUser]] = await connection.query("SELECT id FROM users WHERE openId = 'northstar-curation-system' LIMIT 1");
  if (!systemUser?.id) throw new Error("The non-personal curation account was not found");

  const results = [];
  for (const replacement of replacements) {
    const [result] = await connection.query(
      "UPDATE submissions SET title = ?, url = ?, description = ?, sourceUrl = ?, sourceType = 'repository', license = ?, tags = ? WHERE submittedBy = ? AND sourceUrl = ? AND status = 'pending'",
      [replacement.title, replacement.url, replacement.description, replacement.sourceUrl, replacement.license, JSON.stringify(replacement.tags), systemUser.id, replacement.previousSourceUrl],
    );
    if (result.affectedRows !== 1) throw new Error(`Expected exactly one pending source record for ${replacement.previousSourceUrl}; updated ${result.affectedRows}`);
    results.push({ previousSourceUrl: replacement.previousSourceUrl, replacementSourceUrl: replacement.sourceUrl });
  }

  console.log(JSON.stringify({ repaired: results, publication: "none; corrected records remain pending human moderation" }, null, 2));
} finally {
  connection.destroy();
}
