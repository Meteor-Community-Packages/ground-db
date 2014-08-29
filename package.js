Package.describe({
  name: "raix:grounddb",
  version: "0.1.3",
  summary: "Ground Meteor.Collections offline",
  git: "https://github.com/GroundMeteor/Meteor-GroundDB.git"
});

Package.on_use(function (api) {
  "use strict";
  api.export && api.export('GroundDB');
  api.export && api.export('_gDB', ['client', 'server'], {testOnly: true});
  api.use([
    'meteor@1.0.0',
    'underscore@1.0.0',
    'random@1.0.0',
    'minimongo@1.0.0',
    'ejson@1.0.0',
    'raix:minimax@0.0.9'
    ], ['client', 'server']);

  api.use('standard-app-packages@1.0.0', ['client', 'server']);

  api.use(['deps@1.0.0'], 'client');
  //api.use([], 'server');
  //api.use(['localstorage', 'ejson'], 'client');
  api.add_files('groundDB.client.js', 'client');
  api.add_files('groundDB.server.js', 'server');
});

Package.on_test(function (api) {
  api.use('raix:grounddb', ['client']);
  api.use('test-helpers', 'client');
  api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
           'random', 'deps']);

  api.add_files('groundDB.client.tests.js', 'client');
  api.add_files('groundDB.server.tests.js', 'server');
});
