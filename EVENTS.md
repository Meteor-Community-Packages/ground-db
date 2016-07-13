Events in Ground DB II
======================

Events in Ground DB is emitted via a regular event emitter and the Meteor Tracker.

### Event / State

Ground DB emits events and states, the event state `loaded` happens only
once - but since it's a state `db.once('loaded');` will call back immediately if the
event has already been emitted.

* "loaded" -> `{ count }`

### Reactive variables

To get info about the read / write state Ground DB currently uses Tracker to emit
reactive events for progress.

* `db.pendingWrites`
* `db.pendingReads`

Api for the read/write states
* `progress()` -> `{ index, total, percent }`
* `isDone()` -> `Boolean`
