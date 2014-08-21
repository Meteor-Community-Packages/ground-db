GroundDB
========

The "darkmagic" in GroundDB - So whats going on in the architecture and how does things work together.

## Overview of packages
So GroundDB now consists of multiple smaller packages. Why? may you ask, well the short answer is to make it easier to write isolated tests and track down bugs. It should also be easier to contribute for others.

* EventEmitter - This package enables the event `emit`/`on` api
* LocalForage - This packages hands us a unified local storage api *by Mozilla*
* Minimax - Compresses the object data allowing the user to store more data locally
* CollectionInterface - This is the universal interface between GroundDB and Meteor
* ServerTime - A tiny package adding client server timestamp
* CacheCollection
* CacheMethods
* SyncTabs
* ResumeMethods