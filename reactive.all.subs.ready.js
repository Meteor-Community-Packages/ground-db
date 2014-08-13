//////////////////////////// ALL SUBSCRIPTIONS READY ///////////////////////////

// Could be nice to have a reactive Meteor.allSubscriptionsReady
Meteor.setInterval(function() {
    var allReady = DDP._allSubscriptionsReady();
    // Update dependencies
    if (allReady !== _gDB.subscriptionsReady) {
      // Trigger reactive update
      _gDB.subscriptionsReady = allReady;
      _gDB.subscriptionsReadyDeps.changed();
    }

  }, 2000);
