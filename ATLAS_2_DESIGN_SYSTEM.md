# NorthStar Atlas 2 Design System

## Purpose

Atlas 2 turns NorthStar’s relationship-intelligence identity into a coherent visual system. It makes graph discovery feel deliberate in both light and dark modes, while keeping the interface calm, accessible, and information-dense.

| Layer | Light mode | Dark mode | User purpose |
| --- | --- | --- | --- |
| Background | Cool porcelain with blue-violet aurora fields | Ink-black space with restrained aurora fields | Establish a graph-native environment without reducing reading comfort. |
| Primary surface | Translucent white with cool-gray edge | Deep blue-black glass with slate edge | Keep filters, navigation, and cards visually organized. |
| Text | Navy ink and muted slate | Ice-white and blue-gray | Maintain strong hierarchy and durable contrast. |
| Graph accent | Sky, cobalt, and violet | Cyan, blue, and violet | Signal connected actions, selected paths, and knowledge context. |
| Motion | Transform/opacity feedback below 300 ms | Same | Confirm interaction while honoring reduced-motion preferences. |

## Implementation Rules

All shared application surfaces use semantic `ns-*` classes or variables rather than fixed light-only colors. New route work must pair every background with an explicit compatible foreground, preserve focus-visible treatment, and use responsive spacing. The footer remains English by owner preference; locale direction and theme mode must not alter its information architecture.

## Route QA Matrix

The release verification matrix covers Home, Browse, Search, Graph, Resource Node, Collections, Capture, Profile, and Moderation in light and dark themes. Changed EN/AR routes also receive direction and narrow-screen verification. The Graph and directory fixtures are introduced separately so visual tests contain meaningful resource data.
