var express = require('express');
var request = require('request');
var User = require('../models/user');
var router = express.Router();


// GLOBAL VARIABLE
var token = ""; // access token
var codecId = "";
var devices = [];
var deviceStatus = "OK";
var roomAnalytics = [];

// INTEGRATION GLOBAL VARIABLE
var authorizationURL = '';
var clientID = '';
var clientSecret = '';
var redirectUri = '';
var integrationIsSet = false;



/* Session login */
router.get('/login', (req, res, next) => {
  return res.render('login.ejs');
});

router.post('/login', (req, res, next) => {
  //console.log(req.body);
  User.findOne({
    email: req.body.email
  }, (err, data) => {
    if (data) {
      if (data.password == req.body.password) {
        //console.log("Done Login");
        req.session.userId = data.unique_id;
        //console.log(req.session.userId);
        res.send({
          "Success": "Success!"
        });
      } else {
        res.send({
          "Success": "Wrong password!"
        });
      }
    } else {
      res.send({
        "Success": "This Email Is not regestered!"
      });
    }
  });
});

router.get('/logout', (req, res, next) => {
  console.log("logout")
  if (req.session) {
    // delete session object
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

/* GET home page. */
router.get('/', async function (req, res, next) {
  isSessionAvailable(req).then(async (bool) => {
    if (!bool) {
      res.redirect('/login');
    } else {
      const code = req.query.code;
      if (code != undefined) {
        console.log("getting token...")
        getToken(async function (returnedToken) {
            getDevice(token).then((d) => {
              devices = d;
              codecId = d[0].id;
              integrationIsSet = true;
              getRoomAnalytics(token, codecId).then((data) => {
                roomAnalytics = data;
                res.redirect('/');
              })
            });
            setInterval(() => {
              console.log("OLD: " + token)
              refreshToken(returnedToken)
            }, 86400000); // Toutes les 24h l'access token est m-a-j
          },
          code);

      } else if (!integrationIsSet) {
        res.render('settings', {
          title: 'First Settings',
          firstSetting: true
        });
      } else {
        // Check if first item of devices contain product and if codecId is set
        // If not the user need to re-set the integration
        if (!devices[0].product | !codecId){
          res.render('settings', {
            title: 'First Settings',
            firstSetting: true
          });
        }
        else{
          roomAnalytics = await getRoomAnalytics(token, codecId);
          res.render('index', {
            title: 'Controller',
            codecId: codecId,
            devices: devices,
            metrics: roomAnalytics,
            deviceStatus: deviceStatus
          });
        }
      }
    }
  });
});


router.get('/settings', function (req, res, next) {
  res.render('settings', {
    title: 'Settings',
    firstSetting: false
  });
});

router.post('/setCodecId', function (req, res, next) {
  console.log(req.body.codecId)
  codecId = req.body.codecId;
  res.redirect('/');
});

router.post('/changeIntegration', function (req, res, next) {
  clientID = req.body.clientId;
  clientSecret = req.body.clientSecret;
  redirectUri = req.body.redirectUri;
  authorizationURL = req.body.OAuthUrl;
  res.redirect('/connect');
});

router.get('/connect', function (req, res, next) {
  res.redirect(authorizationURL);
});

router.get('/refresh_token', function (req, res, next) {

});

router.get('/setPosition', async function (req, res, next) {
  const pan = Math.round(parseInt(req.query.pan));
  const tilt = Math.round(parseInt(req.query.tilt));
  console.log(pan, tilt)
  var position = await getPosition(token, codecId);
  if (position == "error") {
    res.status(500).json({
      error: 'something is wrong try to refresh the token or check device id or check device id'
    });
  } else {
    var options = {
      'method': 'POST',
      'url': 'https://webexapis.com/v1/xapi/command/Camera.PositionSet',
      'headers': {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "deviceId": codecId,
        "arguments": {
          "CameraId": 1,
          "Pan": (position.Zoom > 3500 && (position.Pan > 100 || position.Pan < -100)) ? pan * 5 : pan,
          "Tilt": position.Zoom > 3500 ? tilt * 3 : tilt,
          "Zoom": position.Zoom
        }
      })

    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body)
      console.log(JSON.parse(response.body).deviceId);
    });
    res.send("ok")
  }
});

router.get('/up/:strength', async function (req, res, next) {
  // var position = await getPosition(token, codecId);
  var options = {
    'method': 'POST',
    'url': 'https://webexapis.com/v1/xapi/command/Camera.Ramp',
    'headers': {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "deviceId": codecId,
      "arguments": {
        "CameraId": 1,
        "Tilt": "Up"
      }
    })

  };
  request(options, async function (error, response) {
    if (error) throw new Error(error);
    console.log(JSON.parse(response.body).deviceId);
  });
  res.send("ok")
  // }
});


router.get('/stop/:type', async function (req, res, next) {
  const type = req.params.type;
  if (type == "Tilt") {
    var options = {
      'method': 'POST',
      'url': 'https://webexapis.com/v1/xapi/command/Camera.Ramp',
      'headers': {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "deviceId": codecId,
        "arguments": {
          "CameraId": 1,
          "Tilt": "Stop"
        }
      })
    };
  } else if (type == "Pan") {
    var options = {
      'method': 'POST',
      'url': 'https://webexapis.com/v1/xapi/command/Camera.Ramp',
      'headers': {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "deviceId": codecId,
        "arguments": {
          "CameraId": 1,
          "Pan": "Stop"
        }
      })
    };
  } else if (type == "Zoom") {
    var options = {
      'method': 'POST',
      'url': 'https://webexapis.com/v1/xapi/command/Camera.Ramp',
      'headers': {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "deviceId": codecId,
        "arguments": {
          "CameraId": 1,
          "Zoom": "Stop"
        }
      })
    };
  }
  request(options, async function (error, response) {
    if (error) throw new Error(error);
    console.log("sending stop request....")
    console.log(JSON.parse(response.body).deviceId);
  });
  res.send("ok")
});

router.get('/refreshRoomAnalytics', async function (req, res, next) {
  getRoomAnalytics(token, codecId).then((data) => {
    roomAnalytics = data;
    res.json(JSON.stringify(data))
  })
})

router.get('/down/:strength', function (req, res, next) {
  //const strength = req.params.strength;
  var options = {
    'method': 'POST',
    'url': 'https://webexapis.com/v1/xapi/command/Camera.Ramp',
    'headers': {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "deviceId": codecId,
      "arguments": {
        "CameraId": 1,
        "Tilt": "Down"
      }
    })

  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(JSON.parse(response.body).deviceId);
  });
  res.send("ok")

});

router.get('/right/:strength', function (req, res, next) {
  //const strength = req.params.strength;
  var options = {
    'method': 'POST',
    'url': 'https://webexapis.com/v1/xapi/command/Camera.Ramp',
    'headers': {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "deviceId": codecId,
      "arguments": {
        "CameraId": 1,
        "Pan": "Right"
      }
    })

  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(JSON.parse(response.body).deviceId);
  });
  res.send("ok")
});

router.get('/left/:strength', function (req, res, next) {
  //const strength = req.params.strength;
  var options = {
    'method': 'POST',
    'url': 'https://webexapis.com/v1/xapi/command/Camera.Ramp',
    'headers': {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "deviceId": codecId,
      "arguments": {
        "CameraId": 1,
        "Pan": "Left"
      }
    })

  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(JSON.parse(response.body).deviceId);
  });
  res.send("ok")
});

router.get('/center', async function (req, res, next) {
  var options = {
    'method': 'POST',
    'url': 'https://webexapis.com/v1/xapi/command/Camera.PositionSet',
    'headers': {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "deviceId": codecId,
      "arguments": {
        "CameraId": 1,
        "Pan": 0,
        "Tilt": 0,
        "Zoom": 11800
      }
    })
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(JSON.parse(response.body).deviceId);
    res.send("ok")
  });
});


router.get('/left/:strength', async function (req, res, next) {
  const strength = req.params.strength;
  var position = await getPosition(token, codecId);
  if (position == "error") {
    res.status(500).json({
      error: 'something is wrong try to refresh the token or check device id'
    });
  } else {
    var newPan = position.Pan + (50 * strength);
    newPan = (newPan < 17000) ? newPan : 17000;
    var options = {
      'method': 'POST',
      'url': 'https://webexapis.com/v1/xapi/command/Camera.PositionSet',
      'headers': {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "deviceId": codecId,
        "arguments": {
          "CameraId": 1,
          "Pan": newPan,
          "Tilt": position.Tilt,
          "Zoom": position.Zoom
        }
      })

    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(JSON.parse(response.body).deviceId);
    });
    res.send("ok")
  }
});

router.get('/zoomForSlider/:strength', async function (req, res, next) {
  const strength = req.params.strength;
  console.log(strength);
  var position = await getPosition(token, codecId);
  if (position == "error") {
    res.status(500).json({
      error: 'something is wrong try to refresh the token or check device id'
    });
  } else {
    var newZoom = parseInt(strength);
    var options = {
      'method': 'POST',
      'url': 'https://webexapis.com/v1/xapi/command/Camera.PositionSet',
      'headers': {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "deviceId": codecId,
        "arguments": {
          "CameraId": 1,
          "Zoom": newZoom,
          "Pan": position.Pan,
          "Tilt": position.Tilt
        }
      })
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body)
      console.log(JSON.parse(response.body).deviceId);
    });
    res.send("ok")
  }
});

router.get('/zoomExtremum/:type', async function (req, res, next) {
  const type = req.params.type;
  if (type != "In" && type != "Out") {
    res.send("Request invalid")
  } else {
    var options = {
      'method': 'POST',
      'url': 'https://webexapis.com/v1/xapi/command/Camera.Ramp',
      'headers': {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "deviceId": codecId,
        "arguments": {
          "CameraId": 1,
          "Zoom": type,
          "ZoomSpeed": 15
        }
      })

    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      console.log(response.body)
      console.log(JSON.parse(response.body).deviceId);
    });
    res.send("ok")
  }

});


router.get('/zoom/:type', function (req, res, next) {
  const type = req.params.type;
  var options = {
    'method': 'POST',
    'url': 'https://webexapis.com/v1/xapi/command/Camera.Ramp',
    'headers': {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "deviceId": codecId,
      "arguments": {
        "CameraId": 1,
        "Zoom": type
      }
    })

  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(JSON.parse(response.body).deviceId);
  });
  res.send("ok")
});

router.post('/call', async function (req, res, next) {
  const webexNumber = req.body.webexNumber;

  var options = {
    'method': 'POST',
    'url': 'https://webexapis.com/v1/xapi/command/Dial',
    'headers': {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "arguments": {
        "Number": webexNumber
      },
      "deviceId": codecId
    })

  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body)
    console.log(JSON.parse(response.body).deviceId);
  });
  res.status(204).send();

});

router.post('/endCall', async function (req, res, next) {
  var options = {
    'method': 'POST',
    'url': 'https://webexapis.com/v1/xapi/command/Call.Disconnect',
    'headers': {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "deviceId": codecId
    })

  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body)
    console.log(JSON.parse(response.body).deviceId);
  });
  res.status(204).send();

});




function getPosition(token, deviceId) {
  return new Promise(resolve => {
    var options = {
      'method': 'GET',
      'url': 'https://webexapis.com/v1/xapi/status?deviceId=' + deviceId + '&name=cameras.*',
      'headers': {
        'Authorization': 'Bearer ' + token
      }
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      try {
        resolve(JSON.parse(response.body).result.Cameras.Camera[0].Position);
      } catch (error) {
        console.error(error);
        resolve("error");
      }
    });
  })
}


function getDevice(token) {
  return new Promise(resolve => {
    var options = {
      'method': 'GET',
      'url': 'https://webexapis.com/v1/devices',
      'headers': {
        'Authorization': 'Bearer ' + token
      }
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      try {
        console.log(response.body);
        resolve(JSON.parse(response.body).items);
      } catch (error) {
        console.error(error);
        resolve("error");
      }
    });
  })
}


function getRoomAnalytics(token, deviceId) {
  deviceStatus = "OK"; //globale var 
  return new Promise(resolve => {
    var options = {
      'method': 'GET',
      'url': 'https://webexapis.com/v1/xapi/status?deviceId=' + deviceId + '&name=*',
      'headers': {
        'Authorization': 'Bearer ' + token
      }
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      try {
        // if(JSON.parse(response.body).errors != undefined){
        //   resolve(JSON.parse(response.body).message)
        // }else{
        var roomAnalyticsData = {
          roomAnalytics: JSON.parse(response.body).result.RoomAnalytics,
          peripherals: JSON.parse(response.body).result.Peripherals.ConnectedDevice.filter(word => word.Name.toLowerCase().includes("navigator"))
        }
        console.log(roomAnalyticsData)
        resolve(roomAnalyticsData);
        // }

      } catch (error) {
        console.error(error);
        deviceStatus = "KO"; //globale var
        resolve("error");
      }
    });
  })
}


function getToken(callback, code) {
  var options = {
    'method': 'POST',
    'url': 'https://webexapis.com/v1/access_token',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      'grant_type': 'authorization_code',
      'client_id': clientID,
      'client_secret': clientSecret,
      'code': code,
      'redirect_uri': redirectUri
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    token = JSON.parse(response.body).access_token;
    const refresh_token = JSON.parse(response.body).refresh_token;
    callback(refresh_token);
  });
}




function refreshToken(oldRefreshToken) {
  var options = {
    'method': 'POST',
    'url': 'https://webexapis.com/v1/access_token',
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      'grant_type': 'refresh_token',
      'client_id': clientID,
      'client_secret': clientSecret,
      'refresh_token': oldRefreshToken
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    const obj = JSON.parse(response.body)
    token = obj.access_token
    console.log("NEW: " + token)
  });

}


function isSessionAvailable(req) {
  return new Promise(resolve => {
    User.findOne({
      unique_id: req.session.userId
    }, (err, data) => {
      console.log("data");
      console.log(data);
      if (!data) {
        return resolve(false);
      } else {
        return resolve(true);
      }
    });
  });
}
module.exports = router;