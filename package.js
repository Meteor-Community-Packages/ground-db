Package.describe({
  name: "ground:db",
  version: "0.0.0-semantic-release",
  summary: "Ground Meteor.Collections offline",
  git: "https://github.com/GroundMeteor/db.git"
});

Npm.depends({
  localforage: '1.9.0',
});

Package.onUse(function (api) {
  api.versionsFrom(['3.0-rc.4']);
  api.use(['ecmascript', 'mongo-id', 'reactive-var', 'diff-sequence', 'minimongo']);

  api.use([
    'ejson',
  ], ['client', 'server']);

  api.export('Ground');

  api.use(['tracker'], 'client');
  api.use(['dispatch:kernel@0.0.6'], 'client', { weak: true });

  api.mainModule('lib/client/ground.db.js', 'client');
  api.mainModule('lib/server/ground.db.js', 'server');
});

Package.onTest(function (api) {
  api.use('ground:db', ['client']);
  api.use('test-helpers', 'client');
  api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
           'random', 'tracker']);

  api.addFiles('groundDB.client.tests.js', 'client');
  api.addFiles('groundDB.server.tests.js', 'server');
});
