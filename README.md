# eedomus-lock Plugin

Example config.json:

    {
      "accessories": [
        {
        "accessory": "eedomusLock",
        "name": "Door lock",
        "get_url": "http://eedomus_IP/api/get?api_user=XXXXXXX&api_secret=YYYYYYY&action=periph.caract&periph_id=1234567",
        "set_url": "http://eedomus_IP/api/set?api_user=XXXXXXX&api_secret=YYYYYYY&action=periph.value&periph_id=1234567&value="
		}
      ]
    }

Be careful, to finish set_url without a value like the example.