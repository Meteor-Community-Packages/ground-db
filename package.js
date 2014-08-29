Package.describe({
  name: "grounddb",
  version: "0.1.3",
  summary: "Ground Meteor.Collections offline",
  git: "https://github.com/GroundMeteor/Meteor-GroundDB.git"
});

Package.on_use(function (api) {
  "use strict";
  api.export && api.export('GroundDB');
  api.export && api.export('_gDB', ['client', 'server'], {testOnly: true});
  api.use([
    'meteor',
    'underscore',
    'random',
    'minimongo',
    'ejson',
    'ejson-minimax'
    ], ['client', 'server']);

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
