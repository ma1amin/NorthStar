# NorthStar Platform - Development TODO

## Phase 1: Data Model & Schema Design
- [x] Define Resource entity (title, description, URL, category, tags, pricing, license, etc.)
- [x] Define Relationship entity (type, source resource, target resource, strength)
- [x] Define User entity (profile, role, contributions, reputation)
- [x] Define Collection entity (name, description, resources, owner)
- [x] Define Vote entity (user, resource/relationship, type, timestamp)
- [x] Define Submission entity (status, metadata, relationships, submitter)
- [x] Define Category & Subcategory hierarchy
- [x] Create Drizzle schema with all tables and relationships
- [x] Generate and apply database migrations

## Phase 2: Core Backend Infrastructure
- [x] Implement OAuth integration (GitHub & Google)
- [x] Create user authentication procedures (login, logout, profile)
- [x] Implement user profile management (bio, avatar, settings)
- [x] Create resource CRUD procedures
- [x] Create relationship CRUD procedures
- [x] Implement voting system procedures
- [x] Create collection management procedures
- [x] Add role-based access control (user, moderator, admin)
- [x] Implement audit logging for submissions and changes

## Phase 3: Search & Relationship Engine
- [x] Integrate Meilisearch for full-text and fuzzy search
- [x] Index resources with metadata and tags
- [x] Implement relationship-aware search queries
- [x] Create search result ranking algorithm
- [x] Add faceted search support (category, tags, pricing)
- [x] Implement relationship traversal queries
- [x] Create "alternatives" query handler
- [x] Add search caching strategy

## Phase 4: Frontend Architecture & Navigation
- [x] Design global navigation structure (header, footer, sidebar)
- [x] Create layout components for different page types
- [x] Implement theme system (light/dark mode)
- [x] Set up routing structure (home, browse, search, detail, submit, profile, admin)
- [x] Create responsive mobile-first design system
- [x] Implement authentication UI (login, logout, profile dropdown)
- [x] Add breadcrumb navigation

## Phase 5: Resource Directory & Browsing UI
- [x] Create category listing page
- [x] Create resource grid/list view with pagination
- [x] Implement category filter UI
- [x] Implement subcategory filter UI
- [x] Implement tag filter UI
- [x] Implement pricing model filter UI
- [x] Add popularity and newest sorting options; intentionally defer ratings until authentic, policy-compliant community rating data exists.
- [x] Create empty states and loading skeletons
- [x] Implement infinite scroll or pagination controls

## Phase 6: Resource Detail Page (Node View)
- [x] Create Node View layout with tabs
- [x] Implement Alternatives tab
- [x] Implement Integrations tab
- [x] Implement Competitors tab
- [x] Implement Ecosystem tab
- [x] Implement Similar tab
- [x] Display resource metadata (title, description, URL, pricing, license)
- [x] Show "Built By" information
- [x] Add voting UI (upvote/downvote)
- [x] Add bookmark functionality
- [x] Add share buttons
- [x] Implement relationship cards with metadata

## Phase 7: Advanced Search & Relationship-Aware Results
- [x] Implement full-text search UI
- [x] Create search results page with filters
- [x] Implement typo-tolerant fuzzy matching for near-miss resource queries, not only substring matching.
- [x] Add relationship-aware query parsing (e.g., "Jira alternatives")
- [x] Create search suggestions/autocomplete
- [x] Implement live filtering during search
- [ ] Add search analytics tracking

## Phase 8: Resource Submission & Duplicate Detection
- [x] Create submission form UI
- [x] Implement URL auto-fetch for metadata
- [x] Add real-time duplicate detection
- [x] Create relationship suggestion step
- [x] Implement submission preview
- [x] Add submission validation
- [x] Create submission confirmation flow
- [x] Implement submission status tracking

## Phase 9: User Profiles, Collections & Voting
- [x] Create user profile page
- [x] Implement profile editing
- [x] Show user contributions (submitted resources)
- [x] Show user collections
- [x] Show user bookmarks
- [x] Implement reputation/karma scoring
- [x] Create collection creation UI
- [x] Implement collection editing
- [x] Add collection sharing
- [x] Create collection detail page
- [x] Implement voting UI for resources
- [x] Implement voting UI for relationships

## Phase 10: Moderation Dashboard & Admin Tools
- [x] Create admin dashboard layout
- [x] Implement submission queue view
- [x] Add approval/rejection workflow
- [ ] Create resource editing interface
- [ ] Add user management tools
- [x] Implement relationship moderation
- [ ] Create moderation logs
- [ ] Add bulk operations support
- [ ] Implement spam/abuse reporting

## Phase 11: Polish, Testing & Optimization
- [x] Implement SEO optimization (meta tags, structured data)
- [x] Add a server-generated public-content rendering strategy for Home, Browse, Search, and approved Resource Detail pages; the current app is still a client-rendered SPA shell.
- [x] Optimize images and assets
- [x] Implement lazy loading
- [x] Add accessibility features (WCAG compliance)
- [x] Test responsive design on mobile/tablet/desktop
- [x] Implement error boundaries and error pages
- [x] Add loading states and transitions
- [x] Create unit tests for core functions
- [x] Create integration tests for API routes
- [x] Performance optimization and profiling

## Phase 12: Final Review & Delivery
- [x] Review all features against requirements
- [x] Test end-to-end workflows
- [x] Create checkpoint
- [x] Final polish and bug fixes
- [x] Prepare documentation
- [x] Ready for deployment

## Verified Completion Sequence
- [x] Stabilize the Tailwind/CSS pipeline so intended colors, effects, spacing, shadows, gradients, and responsive utilities render consistently.
- [ ] Complete database-backed Browse, Node View, Search, and Submission workflows, including exact relationship labels and real-time duplicate detection.
- [x] Complete profiles, profile editing, collections, bookmarks, resource and relationship voting, reputation, and moderation workflows.
- [x] Implement and verify public-page SEO, route metadata, Open Graph, structured data, rendering strategy, accessibility, and data-integrity safeguards.
- [x] Run TypeScript checks, unit and integration tests, responsive/accessibility QA, final review, and save a verified checkpoint.
- [ ] Deliver a verified completion report with the checkpoint reference.

### Verification Notes
- [ ] Do not mark previously overstated items as complete without inspecting and testing their actual implementation.
- [ ] Do not fabricate reviews, ratings, testimonials, or community signals.
- [ ] Keep the exact Node View tab labels: Alternatives, Integrations, Competitors, Ecosystem, Similar.
- [ ] Keep the exact relationship labels: Alternative To, Similar To, Integrates With, Built By, Depends On, Part Of, Competitor Of.
- [ ] Ensure relationship-aware search queries such as "Jira alternatives" resolve correctly.
- [ ] Ensure public resource pages have a verified SEO/rendering strategy rather than merely static client-side metadata.

## Historical TODO Items
- [ ] Create category listing page
- [ ] Create resource grid/list view with pagination
- [ ] Implement category filter UI
- [ ] Implement subcategory filter UI
- [ ] Implement tag filter UI
- [ ] Implement pricing model filter UI
- [ ] Add sorting options (popularity, newest, rating)
- [ ] Create empty states and loading skeletons
- [ ] Implement infinite scroll or pagination controls
- [ ] Create Node View layout with tabs
- [ ] Implement Alternatives tab
- [ ] Implement Integrations tab
- [ ] Implement Competitors tab
- [ ] Implement Ecosystem tab
- [ ] Implement Similar tab
- [ ] Display resource metadata (title, description, URL, pricing, license)
- [ ] Show Built By information
- [ ] Add voting UI (upvote/downvote)
- [ ] Add bookmark functionality
- [ ] Add share buttons
- [ ] Implement relationship cards with metadata
- [ ] Implement full-text search UI
- [ ] Create search results page with filters
- [ ] Implement fuzzy matching
- [ ] Add relationship-aware query parsing
- [ ] Create search suggestions/autocomplete
- [ ] Implement live filtering during search
- [ ] Add search analytics tracking
- [ ] Create submission form UI
- [ ] Implement URL auto-fetch for metadata
- [ ] Add real-time duplicate detection
- [ ] Create relationship suggestion step
- [ ] Implement submission preview
- [ ] Add submission validation
- [ ] Create submission confirmation flow
- [ ] Implement submission status tracking
- [ ] Create user profile page
- [ ] Implement profile editing
- [ ] Show user contributions
- [ ] Show user collections
- [ ] Show user bookmarks
- [x] Implement reputation/karma scoring
- [ ] Create collection creation UI
- [ ] Implement collection editing
- [ ] Add collection sharing
- [ ] Create collection detail page
- [ ] Implement voting UI for resources
- [ ] Implement voting UI for relationships
- [ ] Create admin dashboard layout
- [ ] Implement submission queue view
- [ ] Add approval/rejection workflow
- [ ] Create resource editing interface
- [ ] Add user management tools
- [ ] Implement relationship moderation
- [ ] Create moderation logs
- [ ] Add bulk operations support
- [ ] Implement spam/abuse reporting
- [ ] Re-verify SEO optimization
- [ ] Re-verify rendering strategy
- [ ] Re-verify accessibility and responsive behavior
- [ ] Re-run all tests after implementation
- [ ] Save a verified checkpoint
- [ ] Deliver final verified status

## End of Historical TODO Items
- [ ] Reconcile duplicate historical items with implementation evidence before marking complete.
- [ ] Preserve this history; do not delete TODO entries.
- [ ] Only mark an item complete after implementation and verification.

## Current Work Tracking
- [ ] Phase 1: Visual pipeline diagnosis and repair
- [ ] Phase 2: Discovery workflows
- [x] Phase 3: Community and moderation workflows
- [ ] Phase 4: SEO, rendering, accessibility, and data integrity
- [ ] Phase 5: Testing, QA, final review, and checkpoint
- [ ] Phase 6: Delivery report

## Scope Guardrails
- [ ] Do not claim production readiness before all required flows are tested.
- [ ] Do not claim server-side rendering unless the implementation actually provides it.
- [ ] Do not claim an external search engine integration unless configured and tested.
- [ ] Do not use mock community content as if it were real user-generated content.
- [ ] Keep public UX simple, mobile-first, accessible, and relationship-centric.

## Checkpoint History
- [x] Historical checkpoint 136c4363 recorded before the verified completion sequence.
- [ ] Save a new verified checkpoint after all current work passes tests.

## End-to-End Acceptance Criteria
- [ ] A user can browse, filter, paginate, and open a real resource.
- [ ] A resource Node View shows all five exact relationship tabs.
- [ ] Relationship labels match the seven exact graph types.
- [ ] A query such as "Jira alternatives" returns relationship-aware results.
- [ ] A signed-in user can submit a resource with real-time duplicate feedback.
- [x] A signed-in user can manage profile, bookmarks, votes, and collections.
- [x] A moderator/admin can review and act on pending submissions and relationships.
- [x] Public pages expose verified SEO metadata and structured data.
- [x] The visual system renders correctly without browser-default styling regressions.
- [ ] TypeScript, unit, integration, responsive, and accessibility checks pass.
- [ ] A final checkpoint is saved and referenced in the delivery report.

## Completion Summary
- [ ] Platform completion sequence 1–5 verified.
- [ ] NorthStar final delivery completed.

## Newly Identified Node View Gaps
- [x] Add toast or inline error handling and recovery UX for failed resource vote mutations.
- [x] Add toast or inline error handling and rollback UX for failed bookmark mutations.
- [x] Expand Node View sharing to multiple share actions, or explicitly narrow the requirement to copy-link sharing.
- [x] Add a real submission preview section/step to Submit.tsx showing the final title, description, URL, category, pricing, tags, and suggested relationships exactly as they will be submitted for moderation.
- [x] Add a real UI flow to add a resource into one or more collections from the Resource Detail page or another resource surface, with loading/error/success states.
- [x] Implement a fuller reputation/karma system with explicit scoring rules tied to community actions/contributions and expose the resulting score consistently in the UI.
- [x] Re-verify Phase 3 and the composite completion items only after collection membership management and reputation are fully implemented.

## Lobe UI-Inspired UX Enhancement
- [x] Research transferable Lobe UI interaction, navigation, feedback, and responsive-layout patterns without copying its brand identity.
- [x] Introduce a denser, more purposeful application shell with richer contextual navigation and mobile ergonomics.
- [x] Upgrade resource discovery, Node View, and collection surfaces with refined information hierarchy, command-oriented actions, and polished state feedback.
- [x] Verify the enhanced interface for responsiveness, keyboard accessibility, and visual consistency.

## Public-Page SEO and Quality Verification
- [x] Audit actual HTML responses, route metadata, Open Graph data, structured data, and public rendering behavior for Home, Browse, Search, and Resource Detail.
- [x] Implement route-specific SEO metadata and JSON-LD only where it is rendered in the document response and accurately reflects live data.
- [x] Add accessible document landmarks, page titles, and route-change metadata behavior that works for client-side navigation.
- [x] Add focused automated tests for metadata and structured-data helpers, then verify public-page output in the running application.
- [x] Render meaningful, route-specific public fallback content in the initial HTML response so crawlers receive more than metadata from the SPA shell.
- [x] Run and record desktop/mobile visual QA across Home, Browse, Search, Resource Detail, Submit, Profile, Collections, and Admin before marking the global visual-system acceptance criterion complete.
- [x] Refine the Search workspace discovered during visual QA: improve result density, action affordances, and styling consistency with the enhanced NorthStar navigator.
- [x] Replace the unauthenticated Submit and Profile guard panels’ misleading home action with a direct sign-in action and a clear optional browse return path.

## Core Search Verification Gap
- [x] Wire category, pricing, and tag filters through the active relationship-aware Search procedure and expose them in the Search workspace without losing parsed relationship intent.
- [x] Apply category, pricing, and tag filters only to final relationship-search results so the named base resource remains eligible for relationship traversal.
- [x] Add focused coverage proving filtered relationship queries preserve relationship parsing and only narrow the related resources returned.
- [x] Add an actual relationship-search query-flow test with structured filters that verifies the base lookup excludes filters while the final related-resource lookup includes them.
- [x] Assert the mocked base and final Drizzle query conditions directly, proving structured filters are omitted from base traversal and included for final related resources.

## Submission Data-Integrity Hardening
- [x] Extend URL metadata-fetch safeguards to reject private IPv6, link-local, and unspecified network destinations, with focused security tests.

## Core Integration-Test Verification
- [x] Add and run explicit integration tests for core tRPC workflows: relationship-aware search, browse/resource retrieval, submission duplicate detection, and moderation/profile access.
- [x] Document unit versus integration-test coverage in the final verification notes before re-marking the composite completion item.

## Moderation Audit Trail
- [x] Add an admin audit-log query with actor, action, entity, date, and pagination data; render a searchable, accessible moderation-history table with empty and loading states.
- [x] Surface failed moderation-history loads with an accessible error state rather than an empty table.
