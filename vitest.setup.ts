// Polyfüllt `indexedDB`/`IDBKeyRange` etc. global für Node, damit
// `src/persistence/` in Tests gegen eine echte (In-Memory-)IndexedDB statt
// gegen einen selbstgebauten Mock läuft.
import 'fake-indexeddb/auto'
