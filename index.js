var request = require("request");
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-eedomus-lock", "eedomusLock", eedomusLockAccessory);
}

function eedomusLockAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.set_url = config["set_url"];
  this.get_url = config["get_url"];
  this.refresh = config["refresh"] || "60"; // Every minute
  
  this.service = new Service.LockMechanism(this.name);
  
  this.service
    .getCharacteristic(Characteristic.LockCurrentState)
    .on('get', this.getState.bind(this));
  
  this.service
    .getCharacteristic(Characteristic.LockTargetState)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));
    
  setInterval(function() {
          this.getState(function(err, state) {
            if (err) {
              temp = err;
            }
            this.service
              .getCharacteristic(Characteristic.LockCurrentState).updateValue(state);
          }.bind(this));
        }.bind(this), this.refresh * 1000);

   this.getState(function(err, state) {
          this.service
            .setCharacteristic(Characteristic.LockCurrentState, state);
        }.bind(this));
}

eedomusLockAccessory.prototype.getState = function(callback) {
  
  request.get({url: this.get_url},
  function(err, response, body) {
    
    if (!err && response.statusCode == 200) {
      var json = JSON.parse(body);
      var theBody = json.body;
      var last_value = theBody.last_value; // 100 = "lock" or 0 = "unlock"
      this.log("Lock state is %s", last_value);
      var locked = last_value == "100"
      callback(null, locked); // success
    }
    else {
      this.log("Error getting state (status code %s): %s", response.statusCode, err);
      callback(err);
    }
  }.bind(this));
}
  
eedomusLockAccessory.prototype.setState = function(state, callback) {
  var lockState = (state == Characteristic.LockTargetState.SECURED) ? "100" : "0";

  this.log("Set state to %s", lockState);

  request.post({
    url: this.set_url+lockState
  }, function(err, response, body) {

    if (!err && response.statusCode == 200) {
      this.log("State change complete.");
      
      // we succeeded, so update the "current" state as well
      var currentState = (state == Characteristic.LockTargetState.SECURED) ?
        Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
      
      this.service
        .setCharacteristic(Characteristic.LockCurrentState, currentState);
      
      callback(null); // success
    }
    else {
      this.log("Error '%s' setting lock state. Response: %s", err, body);
      callback(err || new Error("Error setting lock state."));
    }
  }.bind(this));
}

eedomusLockAccessory.prototype.getServices = function() {
  return [this.service];
}