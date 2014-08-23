Package.describe({
  summary: "Ground Meteor.Collections offline",
  version: "0.0.23",
  name: "raix:grounddb",
  githubUrl: "https://github.com/GroundMeteor/Meteor-GroundDB/"
});

Package.on_use(function (api) {
  "use strict";
  if(api.export !== undefined) {
    api.export('GroundDB');
    api.export('_gDB', ['client', 'server'], {testOnly: true});
  }

  if(api.versionsFrom !== undefined) { // 0.9+
    api.use(['raix:ejson-minimax'], ['client', 'server']);
  } else {
    api.use(['ejson-minimax'], ['client', 'server']);
  }

  api.use(['meteor', 'underscore', 'random', 'minimongo', 'ejson'],
          ['client', 'server']);

  api.use('standard-app-packages', ['client', 'server']);

  api.use(['deps'], 'client');
  //api.use([], 'server');
  //api.use(['localstorage', 'ejson'], 'client');
  api.add_files('groundDB.client.js', 'client');
  api.add_files('groundDB.server.js', 'server');
});

Package.on_test(function (api) {
  api.use('grounddb', ['client']);
  api.use('test-helpers', 'client');
  api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
           'random', 'deps']);

  api.add_files('groundDB.client.tests.js', 'client');
  api.add_files('groundDB.server.tests.js', 'server');
});
