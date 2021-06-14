const webex = window.Webex.init({
  credentials: {
    access_token: guestAccessToken
  },
  logger: {
    level: "info"
  }
});

listenForIncomingMeetings();

webex.meetings.register().catch(err => {
  console.error(err);
  alert(err);
  throw err;
});

function bindMeetingEvents(meeting) {
  meeting.on("error", err => {
    console.error(err);
  });

  // Handle media streams changes to ready state
  meeting.on("media:ready", media => {
    if (!media) {
      return;
    }
    if (media.type === "local") {
      document.getElementById("self-view").srcObject = media.stream;
    }
    if (media.type === "remoteVideo") {
      document.getElementById("remote-view-video").srcObject = media.stream;
    }
    if (media.type === "remoteAudio") {
      document.getElementById("remote-view-audio").srcObject = media.stream;
    }
    meeting.muteAudio();
  });

  // Handle media streams stopping
  meeting.on("media:stopped", media => {
    // Remove media streams
    if (media.type === "local") {
      document.getElementById("self-view").srcObject = null;
    }
    if (media.type === "remoteVideo") {
      document.getElementById("remote-view-video").srcObject = null;
    }
    if (media.type === "remoteAudio") {
      document.getElementById("remote-view-audio").srcObject = null;
    }
  });

  document.getElementById("stopVideoFeedback").addEventListener("click", () => {
    console.log("LEAVE");
    meeting.leave();
  });

  /*document.getElementById("mute-video").addEventListener("click", () => {
    console.log("muteVideo");

    if (meeting.isVideoMuted()) {
      meeting.unmuteVideo();
    } else {
      meeting.muteVideo();
    }
  });

  document.getElementById("mute-audio").addEventListener("click", e => {
    console.log("muteAudio");
    if (meeting.isAudioMuted()) {
      meeting.unmuteAudio();
    } else {
      meeting.muteAudio();
    }
  });

  // Of course, we'd also like to be able to leave the meeting:
  document.getElementById("hangup").addEventListener("click", () => {
    meeting.leave();
  });*/
}

// Join the meeting and add media
function joinMeeting(meeting) {
  return meeting.join().then(() => {
    const mediaSettings = {
      receiveVideo: true,
      receiveAudio: true,
      receiveShare: false,
      sendVideo: true,
      sendAudio: true,
      sendShare: false
    };

    // Get our local media stream and add it to the meeting
    return meeting.getMediaStreams(mediaSettings).then(mediaStreams => {
      const [localStream, localShare] = mediaStreams;

      meeting.addMedia({
        localShare,
        localStream,
        mediaSettings
      });
    });
  });
}

/*document.getElementById("destination").addEventListener("submit", event => {
  // again, we don't want to reload when we try to join
  event.preventDefault();
  if (document.getElementById("invitee").value.length == 0) {
    document.getElementById("start-container").style.display = "none";
    document.getElementById("main-container").style.display = "block";
    window.alert(
      "Destination not set. Set the destination in the custom panel and click on the Publish Demo button"
    );
  } else {
    document.getElementById("start-container").style.display = "none";
    document.getElementById("main-container").style.display = "block";
    const destination = document.getElementById("invitee").value;

    return webex.meetings
      .create(destination)
      .then(meeting => {
        // Call our helper function for binding events to meetings
        bindMeetingEvents(meeting);

        return joinMeeting(meeting);
      })
      .catch(error => {
        // Report the error
        console.error(error);
      });
  }
});*/

function listenForIncomingMeetings() {
  return new Promise(resolve => {
    // Listen for added meetings
    webex.meetings.on("meeting:added", addedMeetingEvent => {
      if (
        addedMeetingEvent.type === "INCOMING" ||
        addedMeetingEvent.type === "JOIN"
      ) {
        const addedMeeting = addedMeetingEvent.meeting;

        // Acknowledge to the server that we received the call on our device
        addedMeeting.acknowledge(addedMeetingEvent.type).then(() => {
          if (confirm("Answer incoming call")) {
            bindMeetingEvents(addedMeeting);
            joinMeeting(addedMeeting);
          } else {
            addedMeeting.decline();
          }
        });
      }
    });
    resolve();
  });
}
