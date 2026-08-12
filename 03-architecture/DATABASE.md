# NorthStar Database Architecture

## Primary Database

PostgreSQL.

## Core Domain Entities

Proposed entities:
- User
- Organization
- Resource
- ResourceType
- Category
- Tag
- ResourceTag
- Relationship
- RelationshipType
- Collection
- CollectionItem
- Bookmark
- Vote
- Submission
- ModerationAction
- Report
- ExternalSource
- ExternalRecord
- ResourceSource
- AuditEvent

These are proposed domain entities, not yet an implemented schema.

## Data Principles

- Stable identifiers
- Provenance tracking
- Auditability
- Soft deletion where appropriate
- Explicit relationship types
- Version-aware important content
- Unique constraints for canonical URLs
