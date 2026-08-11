# Lobe UI Inspiration Notes

## Sources reviewed

The public [Lobe UI GitHub repository](https://github.com/lobehub/lobe-ui) and [LobeHub UI Kit documentation](https://ui.lobehub.com/) were reviewed on 2026-08-11. Lobe UI presents a modular component library with a rich documentation shell, prominent command-search affordance, component-level feedback states, themeable foundations, and responsive navigation.

## Adaptation decisions for NorthStar

NorthStar should **not** imitate LobeHub’s AI-product brand or component styling. The transferable ideas are structural and interaction-oriented: a keyboard-accessible command palette, compact contextual navigation, a consistently treated action rail, selection-aware resource cards, and deliberate loading/empty/confirmation states.

For a resource intelligence product, the best adaptation is a **navigator shell** rather than an AI chat shell. The enhanced system should make movement between Browse, Search, Collections, Submission, and the graph feel immediate; it should make relationship signals scannable; and it should retain strong information density without sacrificing mobile readability.

## Priority patterns

| Lobe UI pattern | NorthStar adaptation |
| --- | --- |
| Command-search affordance | A `Ctrl/Cmd + K` command palette for core navigation and discovery shortcuts. |
| Layered documentation navigation | A compact desktop navigation plus a mobile sheet with active-route context. |
| Reusable state feedback | Unified empty, loading, confirmation, and error treatments across discovery and community actions. |
| Themeable visual foundations | Strengthen existing color, surface, radius, focus, and motion tokens rather than import a new design system. |
| Tile-based content presentation | Enrich resource and collection cards with clearer metadata hierarchy and quick actions. |
