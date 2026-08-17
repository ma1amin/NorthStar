# Forced-Layout Warning Investigation

The August 17, 2026 preview audit found that the generated static HTML currently discovers the JavaScript module before the emitted stylesheet. The document still renders correctly, but this order leaves a narrow window in which early runtime work can observe layout before the stylesheet is ready.

The preview diagnostics collector also registers a scroll handler that reads `document.documentElement.scrollHeight`. Such a read can force layout if an initial scroll event occurs before stylesheet completion. The fresh automated preview navigation rendered the fully styled application and did not reproduce a console entry, so the repair hardens the generated asset order rather than suppressing the browser warning.

The production build now rewrites only real emitted stylesheet links ahead of executable module scripts while leaving commented template examples unchanged. A fresh cache-busting preview navigation rendered the fully styled interactive page and produced no console output.
