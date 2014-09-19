Package.describe({
  name: "ground:db",
  version: "0.0.1",
  summary: "Ground Meteor.Collections offline",
  git: "https://github.com/GroundMeteor/Meteor-GroundDB.git"
});

Package.on_use(function (api) {
  if (api.versionsFrom) {

    api.versionsFrom('METEOR@0.9.1');

    api.use('meteor-platform', ['client', 'server']);

    api.use([
      'meteor',
      'underscore',
      'random',
      'minimongo',
      'ejson',
      'ground:util@0.0.0',
      'ground:servertime@0.0.0',
      'ground:minimax@0.0.0',
      'ground:localstorage@0.0.0',
      'raix:eventemitter@0.0.2'
    ], ['client', 'server']);

    // Make sure any storage adapters are loaded first
    // api.use([
    //   'ground:localstorage'
    // ], 'client', { weak: true });

    api.use(['deps'], 'client');

  } else {
    api.use('standard-app-packages', ['client', 'server']);

    api.use([
      'meteor',
      'underscore',
      'random',
      'minimongo',
      'ejson',
      'ground-util',
      'ground-servertime',
      'ejson-minimax',
      'ground-localstorage',
      'eventemitter'
    ], ['client', 'server']);

    // Make sure any storage adapters are loaded first
    // api.use([
    //   'ground-localstorage'
    // ], 'client', { weak: true });

    api.use(['deps'], 'client');
  }

  api.export && api.export('GroundDB');
  api.export && api.export('_gDB', ['client', 'server'], {testOnly: true});


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
  if (api.versionsFrom) {
    api.use('ground:db', ['client']);
  } else {
    api.use('grounddb', ['client']);
  }
  api.use('test-helpers', 'client');
  api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
           'random', 'deps']);

  api.add_files('groundDB.client.tests.js', 'client');
  api.add_files('groundDB.server.tests.js', 'server');
});
