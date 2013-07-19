Package.describe({
  summary: "\u001b[32mv0.0.1\n"+
  "\u001b[33m-----------------------------------------\n"+
  "\u001b[0m Adds support for simple local database   \n"+
  "\u001b[0m that syncronizes with collection         \n"+
  "\u001b[33m-------------------------------------RaiX\n"
});

Package.on_use(function (api, where) {
  "use strict";
  api.add_files('groundDB.client.js', 'client');
  api.add_files('groundDB.server.js', 'server');
  api.add_files('groundDB.common.js', ['client', 'server']);
  api.exportSymbol('GroundDB', 'client');
});

Package.on_test(function (api, where) {
  "use strict";
  api.use('tinytest');
  api.use('deps');
  api.use('groundDB');
  api.add_files('groundDB.tests.js', 'client');
});
