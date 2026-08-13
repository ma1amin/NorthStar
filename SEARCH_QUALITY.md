# NorthStar Search Quality

NorthStar measures **aggregate discovery quality** without creating an identity, session, or IP-level behavioural profile. The production baseline remains the relational lexical provider; external lexical and semantic providers are not configured.

## Measurement boundary

| Signal | Capture point | Retained data | Purpose |
|---|---|---|---|
| Search volume | Completed server-side search | Normalized, privacy-filtered query; result count; relationship intent; timing | Track demand and latency. |
| Zero-result rate | Completed server-side search | Result count only | Identify discovery gaps. |
| Click-through rate | Result-card navigation | Privacy-filtered query, result count, clicked resource ID | Measure whether a result led to Node View exploration. |
| Reformulation rate | Consecutive local search interaction | A transient client boolean, not a user/session identifier | Identify search journeys that required a new wording. |
| Relevance evaluation | Moderator-authored case | Query, expected resource IDs, review state, audit event | Evaluate rankings against explicitly human-reviewed judgements. |

The telemetry recorder rejects empty queries and avoids recording email-, URL-, and long-number-like query values. It retains no account ID, session ID, IP address, request body, or user-agent. Result-click collection is separately rate-limited and all dashboard figures are aggregates.

## Human relevance cases

Moderators and administrators may draft a query with one or more expected resource IDs. A relevance case is not an automatic claim that a resource is relevant: it is a reviewable human judgement with an audit record. Approved cases can be evaluated against any provider adapter using Recall@k, Precision@k, and reciprocal rank. NorthStar ships no seeded evaluation cases and makes no relevance-performance claim before a maintainer has approved cases and recorded an evaluation artifact.

## Provider and benchmark boundary

The active relational provider implements NorthStar’s typed `SearchProvider` contract. Future lexical or semantic providers must preserve the normalized input and result shapes, apply approved/canonical-resource filtering, and be evaluated against the same reviewed cases before activation.

BEIR is a possible external retrieval benchmark framework because its official repository provides reproducible retrieval evaluation across heterogeneous tasks. Its project documentation also makes clear that individual prepared datasets may have separate permissions and that the user is responsible for license verification. NorthStar therefore records a **benchmark option**, not imported BEIR data or benchmark scores. Any run must document the selected dataset, original license, version/checksum, provider configuration, metrics, and artifact location before results are reported. [1] [2]

## Interpretation rule

> Search metrics are product-quality signals, not a basis for automatic ranking changes, content publication, relationship validation, or semantic claims. Human review remains required for changes that alter public knowledge-graph data.

## References

[1]: <https://github.com/beir-cellar/beir> "BEIR official repository"

[2]: <https://github.com/beir-cellar/beir/wiki/Datasets-available> "BEIR datasets and licensing notice"
