# Next Release Planning Findings — 2026-08-18

## Confirmed current implementation facts

The moderation command center uses shared mutation instances per queue type. Each approval/rejection button is disabled from the same mutation's global pending flag. This explains the observed appearance that all actions in the same queue activate together; the plan will require item-scoped pending state and idempotent backend transitions.

The archive-governance pages route their back action to Archive Imports, while other moderation subpages such as AI Drafts route directly to `/admin`. A shared administrator back-navigation component is appropriate to make all moderation subpages return to the Moderation Command Center.

The graph explorer currently renders a static one-hop spatial layout with links and an accessible list fallback. The Node View offers relationship tabs, actions, voting, collections, trust context, and a link to the graph explorer; it does not currently support embedded graph interaction.

The Home hero currently hard-codes one Figma resource-node card. It has no fetched resource data, manual selection, rotation, or three-second animation.
