class DBManager {

  displayOfflineAlert() {
    var message = "There was an issue loading your offline database. This could happen for two reasons:";
    message += "\n\n1. You're in a private window in your browser. We can't save your data without access to the local database. Please use a non-private window.";
    message += "\n\n2. You have two windows of the app open at the same time. Please close any other app instances and reload the page.";
    alert(message);
  }

  openDatabase(callback, onUgradeNeeded) {
    var request = window.indexedDB.open("standardnotes", 1);

    request.onerror = function(event) {
      if(event.target.errorCode) {
        alert("Offline database issue: " + event.target.errorCode);
      } else {
        this.displayOfflineAlert();
      }
      console.error("Offline database issue:", event);
      if(callback) {
        callback(null);
      }
    }.bind(this);

    request.onsuccess = (event) => {
      var db = event.target.result;
      db.onerror = function(errorEvent) {
        console.log("Database error: " + errorEvent.target.errorCode);
      }
      if(callback) {
        callback(db);
      }
    };

    request.onupgradeneeded = (event) => {
      console.log("Upgrade needed", event);
      var db = event.target.result;
      if(db.version === 1) {
        if(onUgradeNeeded) {
          onUgradeNeeded();
        }
      }

      // Create an objectStore for this database
      var objectStore = db.createObjectStore("items", { keyPath: "uuid" });
      objectStore.createIndex("title", "title", { unique: false });
      objectStore.createIndex("uuid", "uuid", { unique: true });
      objectStore.transaction.oncomplete = function(event) {
        // Ready to store values in the newly created objectStore.
      };
    };
  }

  getAllItems(callback) {
    this.openDatabase((db) => {
      var objectStore = db.transaction("items").objectStore("items");
      var items = [];
      objectStore.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        }
        else {
          callback(items);
        }
      };
    }, null)
  }

  saveItem(item) {
    this.saveItems([item]);
  }

  saveItems(items, callback) {

    if(items.length == 0) {
      if(callback) {
        callback();
      }
      return;
    }

    this.openDatabase((db) => {
      var transaction = db.transaction("items", "readwrite");
      transaction.oncomplete = function(event) {

      };

      transaction.onerror = function(event) {
        console.log("Transaction error:", event.target.errorCode);
      };

      var itemObjectStore = transaction.objectStore("items");
      var i = 0;
      putNext();

      function putNext() {
        if (i < items.length) {
          var item = items[i];
          itemObjectStore.put(item).onsuccess = putNext;
          ++i;
        } else {
          if(callback){
            callback();
          }
        }
      }
    }, null)
  }

  deleteItem(item, callback) {
    this.openDatabase((db) => {
      var request = db.transaction("items", "readwrite").objectStore("items").delete(item.uuid);
      request.onsuccess = function(event) {
        if(callback) {
          callback(true);
        }
      };
    }, null)
  }

  getItemByUUID(uuid, callback) {
    this.openDatabase((db) => {
      var request = db.transaction("items", "readonly").objectStore("items").get(uuid);
      request.onsuccess = function(event) {
        callback(event.result);
      };
    }, null);
  }

  clearAllItems(callback) {
    this.openDatabase((db) => {
      var request = db.transaction("items", "readwrite").objectStore("items").clear();
      request.onsuccess = function(event) {
        console.log("Successfully cleared items");
        callback();
      };
    }, null)
  }
}

angular.module('app.frontend').service('dbManager', DBManager);
