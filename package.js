Package.describe({
  version: '0.0.0',
  summary: "Ground Meteor.Collections offline"
});

Package.on_use(function (api) {
  "use strict";
  api.export && api.export('GroundDB');
  api.export && api.export('_gDB', ['client', 'server'], {testOnly: true});
  api.use(['meteor', 'underscore', 'random', 'minimongo', 'ejson', 'ejson-minimax'],
          ['client', 'server']);

  api.use('standard-app-packages', ['client', 'server']);

  api.use(['deps'], 'client');

  // Rig the event api
  api.use('eventemitter');

  // Add the core api
  api.add_files('groundDB.server.js', 'server');
  api.add_files('groundDB.client.js', 'client');


  // Add an overwriteable conflict handler
  api.add_files('conflict.handling.strategy.js', 'client');

  // Add a general hook api
  api.add_files('general.helpers.js', 'client');

  // Add a reactive variable for all subscriptions ready
  api.add_files('reactive.all.subs.ready.js', 'client');

  // Handle method calls
  api.add_files('load.save.methods.js', 'client');
  api.add_files('resume.methods.js', 'client');

  // Add the abillity to sync tabs
  api.add_files('sync.tabs.js', 'client');

  // Add servertime on the client and a general api "GroundDB.now();"
  api.add_files('servertime.client.js', 'client');
  api.add_files('servertime.server.js', 'client');
});


Package.on_test(function (api) {
  api.use('grounddb', ['client']);
  api.use('test-helpers', 'client');
  api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
           'random', 'deps']);

  api.add_files('groundDB.client.tests.js', 'client');
  api.add_files('groundDB.server.tests.js', 'server');
});
