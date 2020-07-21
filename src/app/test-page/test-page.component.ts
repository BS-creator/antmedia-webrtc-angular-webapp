import { Component, OnInit, ViewChild, ElementRef, Input } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute, Router } from "@angular/router";
import { NgxSpinnerService } from "ngx-spinner";
//import adapter from 'webrtc-adapter';
//import { WebRTCAdaptor } from '../../../src/assets/js/webrtc_adaptor.js';

declare function WebRTCAdaptor(initialValues: any): void;

@Component({
  selector: "app-test-page",
  templateUrl: "./test-page.component.html",
  styleUrls: ["./test-page.component.scss"]
})
export class TestPageComponent implements OnInit {
  @ViewChild("camera_checkbox") camera_checkbox;
  @ViewChild("screen_share_checkbox") screen_share_checkbox;
  @ViewChild("screen_share_with_camera_checkbox")
  screen_share_with_camera_checkbox;
  @ViewChild("start_publish_button") start_publish_button;
  @ViewChild("stop_publish_button") stop_publish_button;
  @ViewChild("streamIdTextBoxa") streamName;
  /**
   * If publishing stops for any reason, it tries to republish again.
   */
  autoRepublishEnabled: boolean = true;
  /**
   * Timer job that checks the WebRTC connection
   */
  autoRepublishIntervalJob: any = null;
  streamId: string;
  token: string = "";
  // It should be true
  rtmpForward: boolean = true;
  webRTCAdaptor: any = null;
  websocketURL: string;
  mediaConstraints = {
    video: true,
    audio: true
  };
  sdpConstraints = {
    OfferToReceiveAudio: false,
    OfferToReceiveVideo: false
  };
  pc_config: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private spinner: NgxSpinnerService
  ) {
    this.route.paramMap.subscribe(params => {
      var param_name = params.get("name");
      if (param_name !== "") {
        // this.streamName.nativeElement.value = param_name;
      }
    });
  }

  ngOnInit(): void {
    // debugger

    //  this.streamName.nativeElement.value = "";
    this.websocketURL =
      "wss://lightingpartners.co:5443/WebRTCApp/websocket?rtmpForward=" +
      this.rtmpForward;
    //this.websocketURL = "wss://lvms.eduscopecloud.com:5443/WebRTCApp/websocket?rtmpForward=" + this.rtmpForward;
    //initialize the WebRTCAdaptor
    this.initWebRTCAdaptor(false, this.autoRepublishEnabled);
  }

  getUrlParameter(sParam: string) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split("&"),
      sParameterName,
      i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split("=");

      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : sParameterName[1];
      }
    }
  }

  startPublishing() {
    this.streamId = "streamNameBox_value";
    this.webRTCAdaptor.publish(this.streamId, this.token);
  }

  stopPublishing() {
    if (this.autoRepublishIntervalJob != null) {
      clearInterval(this.autoRepublishIntervalJob);
      this.autoRepublishIntervalJob = null;
    }
    this.webRTCAdaptor.stop(this.streamId);
  }

  sendData() {}

  toggleOptions() {}

  initWebRTCAdaptor(publishImmediately, autoRepublishEnabled) {
    // debugger
    this.webRTCAdaptor = new WebRTCAdaptor({
      websocket_url: this.websocketURL,
      mediaConstraints: this.mediaConstraints,
      peerconnection_config: this.pc_config,
      sdp_constraints: this.sdpConstraints,
      localVideoId: "localVideo",
      debug: true,
      bandwidth: 900,
      callback: function(info, obj) {
        if (info == "initialized") {
          // debugger
          console.log("initialized");
          //this.start_publish_button.nativeElement.disabled = false;
          //this.stop_publish_button.nativeElement.disabled = true;
          if (publishImmediately) {
            this.webRTCAdaptor.publish(this.streamId, this.token);
          }
        } else if (info == "publish_started") {
          // debugger
          //stream is being published
          console.log("publish started");
          //this.start_publish_button.nativeElement.disabled = true;
          //this.stop_publish_button.nativeElement.disabled = false;
          this.startAnimation();
          if (autoRepublishEnabled && this.autoRepublishIntervalJob == null) {
            this.autoRepublishIntervalJob = setInterval(() => {
              this.checkAndRepublishIfRequired();
            }, 3000);
          }
        } else if (info == "publish_finished") {
          // debugger
          //stream is being finished
          console.log("publish finished");
          //this.start_publish_button.nativeElement.disabled = false;
          //this.stop_publish_button.nativeElement.disabled = true;
        } else if (info == "browser_screen_share_supported") {
          // debugger
          //this.camera_checkbox.nativeElement.disabled = false;
          //this.screen_share_checkbox.nativeElement.disabled = false;
          //this.screen_share_with_camera_checkbox.nativeElement.disabled = false;
          console.log("browser screen share supported");
          //this.browser_screen_share_doesnt_support.nativeElement.style.display = "none";
        } else if (info == "screen_share_stopped") {
          // debugger
          //this.camera_checkbox.nativeElement.checked = true;
          //this.screen_share_checkbox.nativeElement.checked = false;
          //this.screen_share_with_camera_checkbox.nativeElement.checked = false;
          console.log("screen share stopped");
        } else if (info == "closed") {
          // debugger
          //console.log("Connection closed");
          if (typeof obj != "undefined") {
            console.log("Connecton closed: " + JSON.stringify(obj));
          }
        } else if (info == "pong") {
          //ping/pong message are sent to and received from server to make the connection alive all the time
          //It's especially useful when load balancer or firewalls close the websocket connection due to inactivity
        } else if (info == "refreshConnection") {
          this.checkAndRepublishIfRequired();
        } else if (info == "ice_connection_state_changed") {
          console.log("iceConnectionState Changed: ", JSON.stringify(obj));
        } else if (info == "updated_stats") {
          //obj is the PeerStats which has fields
          //averageOutgoingBitrate - kbits/sec
          //currentOutgoingBitrate - kbits/sec
          console.log(
            "Average outgoing bitrate " +
              obj.averageOutgoingBitrate +
              " kbits/sec" +
              " Current outgoing bitrate: " +
              obj.currentOutgoingBitrate +
              " kbits/sec"
          );
        } else if (info == "data_received") {
          console.log(
            "Data received: " +
              obj.event.data +
              " type: " +
              obj.event.type +
              " for stream: " +
              obj.streamId
          );
          // $("#dataMessagesTextarea").append("Received: " + obj.event.data + "\r\n");
        } else {
          console.log(info + " notification received");
        }
      },
      callbackError: function(error, message) {
        // debugger
        //some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError

        console.log("error callback: " + JSON.stringify(error));
        var errorMessage = JSON.stringify(error);
        if (typeof message != "undefined") {
          errorMessage = message;
        }
        var errorMessage = JSON.stringify(error);
        if (error.indexOf("NotFoundError") != -1) {
          errorMessage =
            "Camera or Mic are not found or not allowed in your device";
        } else if (
          error.indexOf("NotReadableError") != -1 ||
          error.indexOf("TrackStartError") != -1
        ) {
          errorMessage =
            "Camera or Mic is being used by some other process that does not let read the devices";
        } else if (
          error.indexOf("OverconstrainedError") != -1 ||
          error.indexOf("ConstraintNotSatisfiedError") != -1
        ) {
          errorMessage =
            "There is no device found that fits your video and audio constraints. You may change video and audio constraints";
        } else if (
          error.indexOf("NotAllowedError") != -1 ||
          error.indexOf("PermissionDeniedError") != -1
        ) {
          errorMessage = "You are not allowed to access camera and mic.";
        } else if (error.indexOf("TypeError") != -1) {
          errorMessage = "Video/Audio is required";
        } else if (error.indexOf("ScreenSharePermissionDenied") != -1) {
          errorMessage = "You are not allowed to access screen share";
          //this.camera_checkbox.nativeElement.checked = true;
          //this.screen_share_checkbox.nativeElement.checked = false;
          //this.screen_share_with_camera_checkbox.nativeElement.checked = false;
        } else if (error.indexOf("WebSocketNotConnected") != -1) {
          errorMessage = "WebSocket Connection is disconnected.";
        }
        alert(errorMessage);
      }
    });
  }
}
