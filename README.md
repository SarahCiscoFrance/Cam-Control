# Cam-Control 🕹

## Overview

Control the camera of a Webex video endpoint.

<p align="center">
  <img src="https://raw.githubusercontent.com/SarahCiscoFrance/Cam-Control/main/visual.png" width="1000">
</p>

This application use the Webex API to get the list of the Cloud registered devices and also to send camera control request directly to these devices.
In order to use this app you will need an integration (we will see this point later in the installation part).

## Installation 🔨

### Clone project

```bash
git clone https://github.com/SarahCiscoFrance/Cam-Control.git
```

### Create a New Guest Issuer

Go to https://developer.webex.com/my-apps/new/guest-issuer and follow the process. This application type will provide you with a Guest Issuer ID and a Secret. These two parameters will be used to generate guest tokens. Only paid Webex subscribers may create Guest Issuer applications.

After creating a Guest Issuer application, the secret will only be shown once. Keep this shared secret safe, as you would with any other sensitive piece of information such as a password. If you need to regenerate the secret for any reason, the prior secret will be immediately invalidated.

### Set PORT number, Guest Issuer ID, Shared Secret

Go to .env file, choose a port number and enter the Guest Issuer ID and the Secret (which have just been created):

```bash
PORT=
Guest_Issuer_ID=
Shared_Secret=
```

### Create a self-signed certificate with OpenSSL

First inside the directory "Cam-Control" create a another directory called "certs".
Then open a terminal and go to the "certs" directory

```bash
cd certs/
```

And generate self-signed certificate with OpenSSL :

```bash
openssl req -x509 -newkey rsa:4096 -keyout selfsigned.key -out selfsigned.crt -days 365
```

### Start the application

Open a terminal and make sure you are in the right directory:

```bash
cd Cam-Control/
```

and start the app

```bash
npm start
```

### Create an integration

First be sure to have a Webex account with the right level of access. Go to https://admin.webex.com/users and check if your user have the roles **User and device administrator** in the "Roles of the functional administrator" section.

Registering an integration with Webex is super easy. Go to https://developer.webex.com/docs/integrations, if you're logged in, select My Webex Apps from the menu under your avatar at the top of this page, click "Create a New App" then "Create an Integration" to start the wizard. You'll need to provide some basic information like your integration's name, description, and logo.

In the Scopes section be sure to select:

```bash
spark:xapi_statuses
spark:xapi_commands
spark-admin:devices_read
```

And for Redirect URI(s) use https://HOSTNAME:PORT/ (be sure to replace HOSTNAME & PORT with the right values).

This information should be user-facing since that's what they'll see in the permission dialog. After successful registration you'll be taken to a different screen containing your integration's newly created Client ID, Client Secret and OAuth Authorization URL.
The Client Secret will only be shown once so please copy and keep it safe!

To finish open the app in a web browser and fill the form.
