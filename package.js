Package.describe({
  name: "ground:db",
  version: "1.0.0-alpha.1",
  summary: "Ground Meteor.Collections offline",
  git: "https://github.com/GroundMeteor/db.git"
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.2-rc.4');
  api.use(['ecmascript', 'mongo-id', 'reactive-var', 'diff-sequence', 'mongo']);

  api.use([
    'underscore',
    'ground:servertime@0.0.3',
    'raix:localforage@1.2.4-rc.1',
    'raix:eventstate@0.0.2',
  ], ['client', 'server']);

  api.export('Ground');

  api.use(['tracker', 'dispatch:kernel@0.0.6'], 'client');

  api.addFiles([
    'lib/common/mongo.collection.modification.js'
  ], ['client', 'server']);

  api.addFiles([
    'lib/client/pending.jobs.js',
    'lib/client/ground.db.js',
    'lib/client/wrap.collection.js',
    'lib/client/wrap.eventemitter.js',
    ], 'client');
  api.addFiles('lib/server/ground.db.js', 'server');
});

Package.onTest(function (api) {
  api.use('ground:db', ['client']);
  api.use('test-helpers', 'client');
  api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
           'random', 'tracker']);

  api.addFiles('groundDB.client.tests.js', 'client');
  api.addFiles('groundDB.server.tests.js', 'server');
});
