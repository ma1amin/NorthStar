# Search-Quality Benchmark Research Note

The Phase 5 external lexical benchmark option is **BEIR**. Its official repository describes an Apache-2.0-licensed evaluation framework for heterogeneous information-retrieval tasks and documents lexical, dense, sparse, and reranking evaluation modes. It also states that its prepared datasets can carry distinct permissions and that users remain responsible for determining whether they have permission to use a selected dataset.

NorthStar therefore does not import, seed, or claim results from any external corpus in this release. A future benchmark run must select a relevant public dataset, review the original dataset license, record dataset/version/checksum, execute against the provider adapter, and retain the evaluation artifact separately from NorthStar production resource data.

Sources: https://github.com/beir-cellar/beir and https://github.com/beir-cellar/beir/wiki/Datasets-available
