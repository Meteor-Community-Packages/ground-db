Package.describe({
  summary: "\u001b[32mv0.0.18\n"+
  "\u001b[33m-----------------------------------------\n"+
  "\u001b[0m GroundDB is a thin layer providing       \n"+
  "\u001b[0m Meteor offline database and methods      \n"+
  "\u001b[33m-------------------------------------RaiX\n"
});

Package.on_use(function (api) {
  "use strict";
  api.export && api.export('GroundDB');
  api.export && api.export('_gDB', ['client', 'server'], {testOnly: true});
  api.use(['meteor', 'underscore', 'random', 'minimongo', 'ejson', 'ejson-minimax'],
          ['client', 'server']);

  api.use('standard-app-packages', ['client', 'server']);

  api.use(['deps'], 'client');
  //api.use([], 'server');
  //api.use(['localstorage', 'ejson'], 'client');
  api.add_files('groundDB.client.js', 'client');
  api.add_files('groundDB.server.js', 'server');
});

Package.on_test(function (api) {
  api.use('GroundDB', ['client']);
  api.use('test-helpers', 'client');
  api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
           'random', 'deps']);

  api.add_files('groundDB.client.tests.js', 'client');
  api.add_files('groundDB.server.tests.js', 'server');
});
