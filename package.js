Package.describe({
  name: "ground:db",
  version: "0.3.15",
  summary: "Ground Meteor.Collections offline",
  git: "https://github.com/GroundMeteor/db.git"
});

Package.onUse(function (api) {
  api.versionsFrom('1.2');

  api.use([
    'meteor',
    'underscore',
    'minimongo',
    'ejson',
    'ground:util@0.1.17',
    'ground:servertime@0.0.3',
    //'ground:minimax@1.1.3', // Its implied by ground:util
    'ground:localstorage@0.1.9',
    'raix:eventemitter@0.1.3',
    'raix:stubfence@1.0.3',
    'raix:onetimeout@1.0.4'
  ], ['client', 'server']);

  // Make sure any storage adapters are loaded first
  // api.use([
  //   'ground:localstorage'
  // ], 'client', { weak: true });

  api.export('Ground');
  api.export('GroundDB');

  api.use(['tracker', 'dispatch:kernel@0.0.6'], 'client');


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
