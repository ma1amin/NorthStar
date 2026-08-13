export const fixtureCategories = [
  ["Developer Tools", "developer-tools", "Synthetic tools for building, operating, and connecting software."],
  ["Design & Collaboration", "design-collaboration", "Synthetic resources for interface design and collaborative planning."],
  ["Data & AI", "data-ai", "Synthetic resources for analysis, pipelines, and responsible model operations."],
  ["Research & Knowledge", "research-knowledge", "Synthetic resources for research, knowledge organization, and evidence work."],
  ["Learning", "learning", "Synthetic resources for guided learning and skills practice."],
  ["Productivity", "productivity", "Synthetic resources for planning, communication, and focused work."],
  ["Organizations & Communities", "organizations-communities", "Synthetic ecosystem entities used to demonstrate verifiable graph relationships."],
];

export const fixtureSubcategories = [
  ["developer-tools", "Version Control", "version-control", "Source control and change collaboration."],
  ["developer-tools", "Delivery & APIs", "delivery-apis", "Delivery automation and API-focused tools."],
  ["developer-tools", "Observability", "observability", "Service health and system observability."],
  ["design-collaboration", "Interface Design", "interface-design", "Interface and design-system work."],
  ["design-collaboration", "Visual Collaboration", "visual-collaboration", "Collaborative planning and visual workshops."],
  ["data-ai", "Analytics", "analytics", "Data analysis and reporting workflows."],
  ["data-ai", "Model Operations", "model-operations", "Model lifecycle and data-pipeline workflows."],
  ["research-knowledge", "Knowledge Management", "knowledge-management", "Knowledge bases and reusable research context."],
  ["research-knowledge", "Research Discovery", "research-discovery", "Source-led research and discovery work."],
  ["learning", "Structured Learning", "structured-learning", "Course and curriculum-based learning."],
  ["productivity", "Work Management", "work-management", "Planning, delivery, and task collaboration."],
  ["productivity", "Communication", "communication", "Team communication and coordination."],
  ["organizations-communities", "Stewards & Funders", "stewards-funders", "Synthetic maintainers, funders, and user communities."],
];

export const fixtureTags = [
  "open-source", "collaboration", "automation", "api", "observability", "design-system", "whiteboarding", "analytics", "data-pipeline", "responsible-ai", "knowledge-base", "research", "learning", "productivity", "communication", "community", "governance", "funding", "version-control", "planning",
];

export const fixtureResources = [
  ["Atlas Forge", "atlas-forge", "Synthetic local-development fixture for source collaboration and contribution review testing.", "developer-tools", "version-control", "freemium", ["version-control", "collaboration", "open-source"], true],
  ["Branch Pilot", "branch-pilot", "Synthetic alternative source-control fixture for comparison and graph exploration.", "developer-tools", "version-control", "free", ["version-control", "collaboration"], false],
  ["Beacon CI", "beacon-ci", "Synthetic delivery automation fixture that connects development work to reliable releases.", "developer-tools", "delivery-apis", "freemium", ["automation", "api", "collaboration"], true],
  ["Orbit API", "orbit-api", "Synthetic API workspace fixture for testing developer integrations and relationship search.", "developer-tools", "delivery-apis", "free", ["api", "automation"], false],
  ["Pulse Watch", "pulse-watch", "Synthetic observability fixture for tracing reliable systems and graph dependencies.", "developer-tools", "observability", "paid", ["observability", "automation"], false],
  ["Prism Studio", "prism-studio", "Synthetic interface-design fixture with a discoverable ecosystem and design-system context.", "design-collaboration", "interface-design", "freemium", ["design-system", "collaboration"], true],
  ["Canvas Orbit", "canvas-orbit", "Synthetic visual workshop fixture for planning architecture and customer journeys together.", "design-collaboration", "visual-collaboration", "free", ["whiteboarding", "collaboration", "planning"], false],
  ["Flow Sketch", "flow-sketch", "Synthetic design-system fixture that demonstrates alternatives and shared component workflows.", "design-collaboration", "interface-design", "open_source", ["design-system", "open-source"], false],
  ["Metric Grove", "metric-grove", "Synthetic analytics fixture for dashboards, discovery metrics, and transparent reporting.", "data-ai", "analytics", "paid", ["analytics", "observability", "collaboration"], true],
  ["Model Dock", "model-dock", "Synthetic model-operations fixture for evaluating responsible data and model workflows.", "data-ai", "model-operations", "enterprise", ["responsible-ai", "data-pipeline", "governance"], false],
  ["Stream Ledger", "stream-ledger", "Synthetic data-pipeline fixture that supports repeatable, auditable information flows.", "data-ai", "model-operations", "open_source", ["data-pipeline", "open-source", "governance"], false],
  ["Quarry Notes", "quarry-notes", "Synthetic knowledge-base fixture for preserving research context and evidence trails.", "research-knowledge", "knowledge-management", "freemium", ["knowledge-base", "research", "collaboration"], true],
  ["Scout Index", "scout-index", "Synthetic research-discovery fixture for structured sources, findings, and related resources.", "research-knowledge", "research-discovery", "free", ["research", "knowledge-base"], false],
  ["Atlas Library", "atlas-library", "Synthetic public knowledge-hub fixture that anchors reusable learning and research collections.", "research-knowledge", "knowledge-management", "open_source", ["knowledge-base", "learning", "open-source"], false],
  ["Course Loft", "course-loft", "Synthetic course platform fixture for structured learning pathways and skill discovery.", "learning", "structured-learning", "freemium", ["learning", "community"], false],
  ["Skill Path", "skill-path", "Synthetic practice and progress fixture for comparing guided learning routes.", "learning", "structured-learning", "free", ["learning", "productivity"], false],
  ["Flow Board", "flow-board", "Synthetic work-management fixture for planning, knowledge handoff, and contributor coordination.", "productivity", "work-management", "freemium", ["productivity", "planning", "collaboration"], true],
  ["Relay Desk", "relay-desk", "Synthetic team communication fixture for testing competitors, integrations, and use-case pathways.", "productivity", "communication", "paid", ["communication", "collaboration", "productivity"], false],
  ["Focus Field", "focus-field", "Synthetic focus-planning fixture for individual work and collection-driven study plans.", "productivity", "work-management", "free", ["productivity", "planning", "learning"], false],
  ["Luma Labs", "luma-labs", "Synthetic organization fixture used only to demonstrate Built By relationships in local graph testing.", "organizations-communities", "stewards-funders", "enterprise", ["community", "design-system"], false],
  ["Makers Guild", "makers-guild", "Synthetic steward fixture used only to demonstrate Maintained By relationships in local graph testing.", "organizations-communities", "stewards-funders", "open_source", ["community", "governance", "open-source"], false],
  ["Open Stewardship Fund", "open-stewardship-fund", "Synthetic funder fixture used only to demonstrate Funded By relationships in local graph testing.", "organizations-communities", "stewards-funders", "free", ["funding", "governance"], false],
  ["Northwind Academy", "northwind-academy", "Synthetic user-community fixture used only to demonstrate Used By relationships in local graph testing.", "organizations-communities", "stewards-funders", "free", ["community", "learning"], false],
];

export const fixtureRelationships = [
  ["atlas-forge", "branch-pilot", "alternative_to", "Two synthetic source-control options for comparing workflow trade-offs.", "comparison"],
  ["prism-studio", "flow-sketch", "alternative_to", "Two synthetic interface-design approaches for a shared design-system workflow.", "comparison"],
  ["course-loft", "skill-path", "similar_to", "Two synthetic learning paths with different practice and curriculum approaches.", "learning"],
  ["atlas-forge", "beacon-ci", "integrates_with", "Source collaboration can connect to delivery automation in a shared release workflow.", "integration"],
  ["flow-board", "relay-desk", "integrates_with", "Work planning can connect to team communication for coordination.", "integration"],
  ["prism-studio", "luma-labs", "built_by", "Luma Labs is the synthetic builder entity for this local graph fixture.", "provenance"],
  ["atlas-forge", "makers-guild", "maintained_by", "Makers Guild is the synthetic steward entity for this local graph fixture.", "provenance"],
  ["course-loft", "open-stewardship-fund", "funded_by", "Open Stewardship Fund is the synthetic funder entity for this local graph fixture.", "provenance"],
  ["flow-board", "northwind-academy", "used_by", "Northwind Academy is the synthetic user-community entity for this local graph fixture.", "adoption"],
  ["model-dock", "stream-ledger", "depends_on", "Responsible model operations depend on an auditable synthetic data-pipeline layer.", "dependency"],
  ["scout-index", "atlas-library", "part_of", "Research discovery is represented as part of a reusable public knowledge hub.", "ecosystem"],
  ["flow-board", "relay-desk", "competitor_of", "The synthetic work-management and communication fixtures overlap in collaboration use cases.", "comparison"],
  ["metric-grove", "pulse-watch", "integrates_with", "Analytics and observability complement discovery-quality monitoring.", "integration"],
  ["quarry-notes", "scout-index", "integrates_with", "Knowledge capture and research discovery share structured evidence context.", "integration"],
  ["canvas-orbit", "prism-studio", "similar_to", "Visual collaboration and interface design are adjacent creative workflows.", "ecosystem"],
  ["orbit-api", "beacon-ci", "similar_to", "Both synthetic developer fixtures participate in delivery-oriented workflows.", "ecosystem"],
  ["focus-field", "skill-path", "integrates_with", "Focus planning supports repeatable learning practice.", "integration"],
  ["pulse-watch", "metric-grove", "depends_on", "Synthetic observability review uses analytics context for investigation.", "dependency"],
  ["atlas-library", "course-loft", "used_by", "The synthetic learning platform uses the public knowledge hub for course context.", "adoption"],
  ["stream-ledger", "makers-guild", "maintained_by", "The synthetic data-pipeline fixture is stewarded by the local community entity.", "provenance"],
  ["model-dock", "open-stewardship-fund", "funded_by", "The synthetic model-operations fixture has a local funding relationship for graph testing.", "provenance"],
  ["flow-sketch", "luma-labs", "built_by", "The synthetic design-system fixture shares a local builder entity.", "provenance"],
  ["relay-desk", "northwind-academy", "used_by", "The synthetic communication fixture is used by the local academy entity.", "adoption"],
  ["beacon-ci", "orbit-api", "part_of", "The API workspace is represented as part of a delivery ecosystem for graph navigation.", "ecosystem"],
];

export const fixtureCollections = [
  ["Build a reliable delivery loop", "delivery-loop", "A synthetic collection for source collaboration, API work, delivery automation, and observability.", ["atlas-forge", "orbit-api", "beacon-ci", "pulse-watch"]],
  ["Design system discovery", "design-system-discovery", "A synthetic collection for interface design, visual collaboration, and the ecosystem entities behind them.", ["prism-studio", "flow-sketch", "canvas-orbit", "luma-labs"]],
  ["Responsible research stack", "responsible-research-stack", "A synthetic collection for research discovery, evidence, knowledge capture, and governed data workflows.", ["scout-index", "quarry-notes", "atlas-library", "stream-ledger", "model-dock"]],
  ["Learning and focused practice", "learning-focused-practice", "A synthetic collection for course discovery, practice, planning, and community context.", ["course-loft", "skill-path", "focus-field", "northwind-academy"]],
];
