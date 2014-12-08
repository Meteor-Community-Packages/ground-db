Package.describe({
  name: "ground:db",
  version: "0.1.3",
  summary: "Ground Meteor.Collections offline",
  git: "https://github.com/GroundMeteor/db.git"
});

Package.on_use(function (api) {
  api.versionsFrom('1.0');

  api.use('meteor-platform', ['client', 'server']);

  api.use([
    'meteor',
    'underscore',
    'minimongo',
    'ejson',
    'ground:util@0.1.1',
    'ground:servertime@0.0.0',
    'ground:minimax@0.0.2',
    'ground:localstorage@0.0.2',
    'raix:eventemitter@0.0.2',
    'raix:stubfence@1.0.0-rc2',
    'raix:onetimeout@1.0.1'
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
  api.add_files([
    'groundDB.client.js',
    'wrap.collection.js',
    'wrap.eventemitter.js',
    'wrap.proto.eventemitter.js',
    ], 'client');
  api.add_files('groundDB.server.js', 'server');
});

Package.on_test(function (api) {
  api.use('ground:db', ['client']);
  api.use('test-helpers', 'client');
  api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
           'random', 'tracker']);

  api.add_files('groundDB.client.tests.js', 'client');
  api.add_files('groundDB.server.tests.js', 'server');
});
