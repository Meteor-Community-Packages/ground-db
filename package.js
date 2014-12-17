Package.describe({
  name: "ground:db",
  version: "0.2.2",
  summary: "Ground Meteor.Collections offline",
  git: "https://github.com/GroundMeteor/db.git"
});

Package.onUse(function (api) {
  api.versionsFrom('1.0');

  api.use('meteor-platform', ['client', 'server']);

  api.use([
    'meteor',
    'underscore',
    'minimongo',
    'ejson',
    'ground:util@0.1.5',
    'ground:servertime@0.0.2',
    //'ground:minimax@1.0.1', // Its implied by ground:util
    'ground:localstorage@0.1.6',
    'raix:eventemitter@0.1.0',
    'raix:stubfence@1.0.0',
    'raix:onetimeout@1.0.2'
  ], ['client', 'server']);

  // Make sure any storage adapters are loaded first
  // api.use([
  //   'ground:localstorage'
  // ], 'client', { weak: true });

  api.export('Ground');
  api.export('GroundDB');

  api.use(['tracker'], 'client');


  //api.use([], 'server');
  //api.use(['localstorage', 'ejson'], 'client');
  api.addFiles([
    'groundDB.client.js',
    'wrap.collection.js',
    'wrap.eventemitter.js',
    'wrap.proto.eventemitter.js',
    ], 'client');
  api.addFiles('groundDB.server.js', 'server');
});

Package.onTest(function (api) {
  api.use('ground:db', ['client']);
  api.use('test-helpers', 'client');
  api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
           'random', 'tracker']);

  api.addFiles('groundDB.client.tests.js', 'client');
  api.addFiles('groundDB.server.tests.js', 'server');
});
