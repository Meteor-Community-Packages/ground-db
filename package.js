Package.describe({
  summary: "\u001b[32mv0.0.2\n"+
  "\u001b[33m-----------------------------------------\n"+
  "\u001b[0m GroundDB is a thin layer providing       \n"+
  "\u001b[0m Meteor offline database and methods      \n"+
  "\u001b[33m-------------------------------------RaiX\n"
});

Package.on_use(function (api, where) {
  "use strict";
  api.use(['random', 'ejson']);
  api.add_files('groundDB.client.js', 'client');
  api.add_files('groundDB.server.js', 'server');
});
