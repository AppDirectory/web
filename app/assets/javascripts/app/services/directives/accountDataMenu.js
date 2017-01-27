class AccountDataMenu {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/account-data-menu.html";
    this.scope = {};
  }

  controller($scope, apiController, modelManager, keyManager) {
    'ngInject';

    $scope.keys = keyManager.keys;

    $scope.destroyLocalData = function() {
      if(!confirm("Are you sure you want to end your session? This will delete all local items, sync accounts, keys, and extensions.")) {
        return;
      }

      apiController.destroyLocalData(function(){
        window.location.reload();
      })
    }

  }
}

angular.module('app.frontend').directive('accountDataMenu', () => new AccountDataMenu);