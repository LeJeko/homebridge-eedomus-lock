var request = require("request");
var express = require('express'),
    bodyParser = require('body-parser'),
    app = express();
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory("homebridge-eedomus-lock", "eedomusLock", eedomusLockAccessory);
}

function eedomusLockAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.periph_id = config["periph_id"];
  this.eedomus_ip = config["eedomus_ip"] || "cloud";
  this.api_user = config["api_user"];
  this.api_secret = config["api_secret"];
  this.refresh = config["refresh"] || 60;

  if (this.eedomus_ip == "cloud") {
    this.get_url = "https://api.eedomus.com/api/get?api_user=" + this.api_user + "&api_secret=" + this.api_secret + "&action=periph.caract&periph_id=" + this.periph_id + "";
    this.set_url = "https://api.eedomus.com/api/get?api_user=" + this.api_user + "&api_secret=" + this.api_secret + "&action=periph.value&periph_id=" + this.periph_id + "&value=";      
  } else {
    this.get_url = "http://" + this.eedomus_ip + "/api/get?api_user=" + this.api_user + "&api_secret=" + this.api_secret + "&action=periph.caract&periph_id=" + this.periph_id + "";
    this.set_url = "http://" + this.eedomus_ip + "/api/set?api_user=" + this.api_user + "&api_secret=" + this.api_secret + "&action=periph.value&periph_id=" + this.periph_id + "&value=";  
  }
  
  this.push = config["push"] || false;
  
  if (this.push) {
    this.path = config["path"] || "eedomus-lock";
    this.port = config["port"] || "3210";

    app.use(bodyParser.json());

    that = this;

    app.get('/' + this.path + '/', function (req, res) {
        var query = req.query;
        that.log('Data received: %s', JSON.stringify(query));
        var periph_id = query.periph_id;
        var last_value = query.last_value;
        res.send('Got it!');
        that.log(periph_id + " " + that.periph_id);
        if (periph_id == that.periph_id) {
          var currentState = (last_value == 100) ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
          that.service.setCharacteristic(Characteristic.LockCurrentState, currentState);
          that.log('State changed to: %s', currentState);
        }
    });
    
    app.listen(this.port, function () {
    
      that.log('Listening at http://localhost:%s/%s/', this.port, this.path);
    
    });
  }


  this.service = new Service.LockMechanism(this.name);
  
  this.service
    .getCharacteristic(Characteristic.LockCurrentState)
    .on('get', this.getState.bind(this));
  
  this.service
    .getCharacteristic(Characteristic.LockTargetState)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));
  
  if (!this.push) {
    setInterval(function() {
      this.getState(function(err, state) {
        if (err) {
          temp = err;
        }
        this.service
          .getCharacteristic(Characteristic.LockCurrentState).updateValue(state);
      }.bind(this));
    }.bind(this), this.refresh * 1000);
  }

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