# Homebridge plug-in for eedomus lock

To date, eedomus does not present locking accessories to its HomeKit bridge. You can use this plugin to fix this!

**Please note, since version 0.3.0, the config.json structure has changed and must be modified before restarting homebridge.**

This version add support for push update via eedomus webhook for real time response. You can still use it with auto refresh instead if you don't want to create a webhook.

### Options

**accessory** : "eedomusLock" (Mandatory)  
**name** : Name in HomeKit  
**periph_id** : eedomus API accessory ID  
**eedomus_ip** : Local ip address or "cloud"  
**api_user** : eedomus API user  
**api_secret** : eedomus API secret  
**refresh** : refresh interval in seconds

### Push options

To use this option, you must configure an HTTP Webhook triggered by the change of state of the locking accessory.

Create an HTTP action and configure two values corresponding to the lock state. Modify the other parameters and check the URL according to your Homebridge instance:

<img width="815" alt="eedomus-webook-ulr" src="https://user-images.githubusercontent.com/13176530/79907316-b097ab00-8419-11ea-8d28-8ea52484e72c.png">

Next create a rule to trigger this webhook when accessory state change:

<img width="813" alt="eedomus-webook-rule" src="https://user-images.githubusercontent.com/13176530/79907333-b7beb900-8419-11ea-8f39-2e44b9681eea.png">

### push configuration

The activation of push option desactivate the auto refresh.  
**push** : true ou false (default false)

To avoid potential conflict with any other web service, the default path and port are voluntary specials.  
**path** : webserver path to listen (default: "eedomus-lock")  
**port** : webserver port to listen (default: 3210)

##config.json example:

```json
"accessories": [
    {
    "accessory": "eedomusLock",
    "name": "Door lock",
    "periph_id" : 1234567,
    "eedomus_ip" : "x.x.x.x",
    "api_user" : "XXXXXXX",
    "api_secret" : "YYYYYYY",
    "refresh" : 60,
    "push" : true,
    "path" : "eedomus-lock",
    "port" : 3210
    }
]
```

