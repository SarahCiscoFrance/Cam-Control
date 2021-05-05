# Cam-Control

# Cam-Control 🕹

## Overview

Control the camera of a Webex video endpoint.

This application use the Webex API to get the list of the Cloud registered devices and also to send camera control request directly to these devices.
In order to use this app you will need an integration (we will see this point later in the installation part).

## Installation 🔨

### Clone project

```bash
git clone https://github.com/SarahCiscoFrance/Cam-Control.git
```

### Change PORT number

Go to .env file and choose a port number

```bash
PORT=  //HERE
```

### Start the application

```bash
npm start
```

### Create an integration

First be sure to have a Webex account with the right level of access. Go to https://admin.webex.com/users and check if your user have the roles **User and device administrator** in the "Roles of the functional administrator" section.

Registering an integration with Webex is super easy. Go to https://developer.webex.com/docs/integrations, if you're logged in, select My Webex Apps from the menu under your avatar at the top of this page, click "Create a New App" then "Create an Integration" to start the wizard. You'll need to provide some basic information like your integration's name, description, and logo.

In the Scopes section be sure to select: spark:xapi_statuses; spark:xapi_commands; spark-admin:devices_read.
And for Redirect URI(s) use http://YOUR_DOMAINE:PORT/ (be sure to replace YOUR_DOMAINE & PORT with the right values).

This information should be user-facing since that's what they'll see in the permission dialog. After successful registration you'll be taken to a different screen containing your integration's newly created Client ID, Client Secret and OAuth Authorization URL.
The Client Secret will only be shown once so please copy and keep it safe!
