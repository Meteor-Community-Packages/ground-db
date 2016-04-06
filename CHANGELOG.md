# Changelog

## vCurrent
## [v0.3.5] (https://github.com/GroundMeteor/db/tree/v0.3.5)
#### 02/02/15 by Morten Henriksen
- Add clear() @jperl

## [v0.3.4] (https://github.com/GroundMeteor/db/tree/v0.3.4)
#### 02/02/15 by Morten Henriksen
- Make removeLocalOnly accessible - thanks @jperl

## [v0.3.3] (https://github.com/GroundMeteor/db/tree/v0.3.3)
#### 01/02/15 by Morten Henriksen
## [v0.3.2] (https://github.com/GroundMeteor/db/tree/v0.3.2)
#### 31/01/15 by Morten Henriksen
- Bump to version 0.3.2

- Add option disabling auto clean up of local only data

- *Merged pull-request:* "Fix typo in README.md" [#74](https://github.com/GroundMeteor/db/issues/74) ([theneva](https://github.com/theneva))

- Fix typo in README.md

Patches by GitHub user [@theneva](https://github.com/theneva).

## [v0.3.1] (https://github.com/GroundMeteor/db/tree/v0.3.1)
#### 22/12/14 by Morten Henriksen

- bump method storage

## [v0.3.0] (https://github.com/GroundMeteor/db/tree/v0.3.0)
#### 21/12/14 by Morten Henriksen
- Add resumed database event

## [v0.2.5] (https://github.com/GroundMeteor/db/tree/v0.2.5)
#### 20/12/14 by Morten Henriksen
- add changelog

- Bump to version 0.2.5

- *Fixed bug:* "Error "First argument to new Mongo.Collection..."" [#67](https://github.com/GroundMeteor/db/issues/67)

## [v0.2.4] (https://github.com/GroundMeteor/db/tree/v0.2.4)
#### 17/12/14 by Morten Henriksen
## [v0.2.3] (https://github.com/GroundMeteor/db/tree/v0.2.3)
#### 17/12/14 by Morten Henriksen
- Bump to version 0.2.3

- mbr update, remove versions.json

## [v0.2.2] (https://github.com/GroundMeteor/db/tree/v0.2.2)
#### 17/12/14 by Morten Henriksen
## [v0.2.1] (https://github.com/GroundMeteor/db/tree/v0.2.1)
#### 17/12/14 by Morten Henriksen
- mbr update versions and fix warnings

## [v0.2.0] (https://github.com/GroundMeteor/db/tree/v0.2.0)
#### 15/12/14 by Morten Henriksen
- Use a basic dictionary to save more space in local storage

- bump localstorage + 0.1.7

- bump local storage using ejson 0.1.5

- fix documentation

- bump to 0.1.4

- Arguments the events emitted

- Add lookup for grounded collections

- fix bug after last refactor

- *Fixed bug:* "ReferenceError: GroundDB is not defined" [#64](https://github.com/GroundMeteor/db/issues/64)

## [Meteor-0-9-1] (https://github.com/GroundMeteor/db/tree/Meteor-0-9-1)
#### 07/12/14 by Morten Henriksen
- *Merged pull-request:* "Comment console.log in methodResume" [#62](https://github.com/GroundMeteor/db/issues/62) ([francocatena](https://github.com/francocatena))

- Comment console.log in methodResume

- use latest OneTimeout

- rewrite the method resume

- Make a more clean method hack

- Be more precise when dealing with methods

- Make Ground.isResumed reactive

- deprecate skipMethods in favor of a more precise Ground.methodResume

- remove mrt legacy

- update version and only support >1.0

- Change scope a bit GroundDB -> Ground.Collection

- update branch info

- Try adding check meteor deps

- add docs

- more thoughts on conflict resolution

- add comments about conflict handling

- remove donate - folks can contact me directly

- *Implemented enhancement:* "GroundDB is not an instance of Meteor/Mongo.Collection" [#47](https://github.com/GroundMeteor/db/issues/47)


- make sure serve gets id on resume

- use the _groundUtil api

- *Fixed bug:* "No id returned by insert callback" [#48](https://github.com/GroundMeteor/db/issues/48)
- *Fixed bug:* "the id is not passed to the insert callback" [#27](https://github.com/GroundMeteor/db/issues/27)

- add more qa test interface

- throw warning if used without the new keyword

- Clean up and added testbed

- major refactoring and bug hunt

Patches by GitHub user [@francocatena](https://github.com/francocatena).

## [v0.1.4] (https://github.com/GroundMeteor/db/tree/v0.1.4)
#### 29/08/14 by Morten Henriksen
## [pre-mps] (https://github.com/GroundMeteor/db/tree/pre-mps)
#### 29/08/14 by Morten Henriksen
## [v0.1.3] (https://github.com/GroundMeteor/db/tree/v0.1.3)
#### 29/08/14 by Morten Henriksen
## [v0.1.2] (https://github.com/GroundMeteor/db/tree/v0.1.2)
#### 29/08/14 by Morten Henriksen
## [v0.1.1] (https://github.com/GroundMeteor/db/tree/v0.1.1)
#### 29/08/14 by Morten Henriksen
## [v0.1.0] (https://github.com/GroundMeteor/db/tree/v0.1.0)
#### 28/08/14 by Morten Henriksen
## [v0.0.22] (https://github.com/GroundMeteor/db/tree/v0.0.22)
#### 22/08/14 by Morten Henriksen
- *Merged pull-request:* "Fix for #36: loadMethods is crashing in v0.0.21" [#38](https://github.com/GroundMeteor/db/issues/38) ([waeltken](https://github.com/waeltken))

- Apply @jakobdamjensen 's fix for save- and loadObject methods.

Patches by GitHub user [@waeltken](https://github.com/waeltken).

## [v0.0.21] (https://github.com/GroundMeteor/db/tree/v0.0.21)
#### 23/04/14 by Morten Henriksen
- *Merged pull-request:* "Fix for meteor 0.7.1.1 release and up" [#25](https://github.com/GroundMeteor/db/issues/25) ([Lauricio](https://github.com/Lauricio))

- Fix for meteor 0.7.1.1 release

- *Merged pull-request:* "Update README.md" [#21](https://github.com/GroundMeteor/db/issues/21) ([DenisGorbachev](https://github.com/DenisGorbachev))

- *Merged pull-request:* "Update README.md" [#20](https://github.com/GroundMeteor/db/issues/20) ([DenisGorbachev](https://github.com/DenisGorbachev))

- *Merged pull-request:* "Update README.md" [#19](https://github.com/GroundMeteor/db/issues/19) ([DenisGorbachev](https://github.com/DenisGorbachev))

Patches by GitHub users [@Lauricio](https://github.com/Lauricio), [@DenisGorbachev](https://github.com/DenisGorbachev).

## [v0.0.20] (https://github.com/GroundMeteor/db/tree/v0.0.20)
#### 06/12/13 by Morten Henriksen
- *Merged pull-request:* "Added dependency, removed mac trash, version bump" [#17](https://github.com/GroundMeteor/db/issues/17) ([Lepozepo](https://github.com/Lepozepo))

- General: Updated git paths

- Dependencies: Added ejson-minimax as an autoinstalled dependency

- General: Ignore mac trash

- Add MIT License

- Edit package

- Updated the flush methods to respect skip methods and made removeLocalOnly public

- added minimax deps

- add travis

Patches by GitHub user [@Lepozepo](https://github.com/Lepozepo).

## [v0.0.19] (https://github.com/GroundMeteor/db/tree/v0.0.19)
#### 06/09/13 by Morten Henriksen
- *Merged pull-request:* "Renaming package name from GroundDB to grounddb" [#13](https://github.com/GroundMeteor/db/issues/13) ([merunga](https://github.com/merunga))

- renaming package to complete lowercase

- Updating to GroundDB on_test

- Fixed an issue updating tabs

- Use each instead of Object.keys

- Fixed a tiny bug that triggered Android 2.3.5 to crash

Patches by GitHub user [@merunga](https://github.com/merunga).

## [v0.0.18] (https://github.com/GroundMeteor/db/tree/v0.0.18)
#### 02/09/13 by Morten Henriksen
- Corrected the local only tracker

## [v0.0.17] (https://github.com/GroundMeteor/db/tree/v0.0.17)
#### 19/08/13 by Morten Henriksen
## [v0.0.16] (https://github.com/GroundMeteor/db/tree/v0.0.16)
#### 29/07/13 by Morten Henriksen
- Added extra validation of the offline database and GroundDB.ready for subscriptions status

## [v0.0.15] (https://github.com/GroundMeteor/db/tree/v0.0.15)
#### 28/07/13 by Morten Henriksen
## [devel] (https://github.com/GroundMeteor/db/tree/devel)
#### 28/07/13 by Morten Henriksen
- Added `EJSON.minify` and `EJSON.maxify`

- Added tests and EJSON.minify + EJSON.maxify

- refactored preparing test writing

- optimizing and bug hunting

- Added documentation for subscriptions

- Working on getting timestamps added to methods

- Added serverTime + optimized for less access to localstorage

## [v0.0.14] (https://github.com/GroundMeteor/db/tree/v0.0.14)
#### 26/07/13 by Morten Henriksen
## [v0.0.13] (https://github.com/GroundMeteor/db/tree/v0.0.13)
#### 26/07/13 by Morten Henriksen
## [v0.0.12] (https://github.com/GroundMeteor/db/tree/v0.0.12)
#### 26/07/13 by Morten Henriksen
- Added write optimizations and updated docs

- Added tab support for pure client-side offline databases

## [v0.0.11] (https://github.com/GroundMeteor/db/tree/v0.0.11)
#### 25/07/13 by Morten Henriksen
- *Merged pull-request:* "fix for #7" [#8](https://github.com/GroundMeteor/db/issues/8) ([chandika](https://github.com/chandika))

- *Fixed bug:* "Duplicate ID on initializing Meteor.users" [#7](https://github.com/GroundMeteor/db/issues/7)

Patches by GitHub user [@chandika](https://github.com/chandika).

## [v0.0.10] (https://github.com/GroundMeteor/db/tree/v0.0.10)
#### 25/07/13 by Morten Henriksen
- *Fixed bug:* "Duplicate ID on initializing Meteor.users" [#7](https://github.com/GroundMeteor/db/issues/7)

## [v0.0.9] (https://github.com/GroundMeteor/db/tree/v0.0.9)
#### 25/07/13 by Morten Henriksen
## [v0.0.8] (https://github.com/GroundMeteor/db/tree/v0.0.8)
#### 25/07/13 by Morten Henriksen
- Added support for smartCollection

- Added resume and tab support for SmartCollections - untested

- *Merged pull-request:* "a bit of formatting for nicely showing the API" [#5](https://github.com/GroundMeteor/db/issues/5) ([arunoda](https://github.com/arunoda))

- a bit of formatting for nicely showing the API

Patches by GitHub user [@arunoda](https://github.com/arunoda).

## [v0.0.7] (https://github.com/GroundMeteor/db/tree/v0.0.7)
#### 25/07/13 by Morten Henriksen
- *Fixed bug:* "GroundDB not defined error" [#2](https://github.com/GroundMeteor/db/issues/2)

- *Fixed bug:* "GroundDB not defined error" [#2](https://github.com/GroundMeteor/db/issues/2)

- Removed unused file localstorage.adapter.js

- Tested and working on IE9 - out of the box

## [v0.0.6] (https://github.com/GroundMeteor/db/tree/v0.0.6)
#### 24/07/13 by Morten Henriksen
## [v0.0.5] (https://github.com/GroundMeteor/db/tree/v0.0.5)
#### 24/07/13 by Morten Henriksen
## [v0.0.4] (https://github.com/GroundMeteor/db/tree/v0.0.4)
#### 24/07/13 by Morten Henriksen
## [v0.0.3] (https://github.com/GroundMeteor/db/tree/v0.0.3)
#### 24/07/13 by Morten Henriksen
- Add console.log polyfill

- Added link to online test

## [v0.0.2] (https://github.com/GroundMeteor/db/tree/v0.0.2)
#### 23/07/13 by Morten Henriksen
- Testing accounts and improving code

- Clean up and use inheritance to save code

## [v0.0.1] (https://github.com/GroundMeteor/db/tree/v0.0.1)
#### 22/07/13 by Morten Henriksen
