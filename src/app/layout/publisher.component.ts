import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from "@angular/core";
import { ActivatedRoute, Router, Data } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { NgForm } from "@angular/forms";
import { NgxSpinnerService } from "ngx-spinner";
import { VideoStreamerComponent } from "../components/video-streamer/video-streamer.component";
import { AppConfigService } from "../../services/app-config.service";
import { IAppConfig } from "../../interfaces/app-config.interface";
import MultiStreamsMixer from "multistreamsmixer";
import MediaStreamRecorder from "msr";
import RecordRTC from "recordrtc";

declare function WebRTCAdaptor(initialValues: any): void;

@Component({
  selector: "app-publisher",
  templateUrl: "./publisher.component.html",
  styleUrls: ["./publisher.component.scss"]
})
export class PublisherComponent implements OnInit {
  // for screenshare start
  selectedScreenName: string = "No selected screen. (default: whole screen)";
  selectedScreenID: string = "";
  captureStream: any = null;
  // for screenshare end

  // for record start
  streamConfig: StreamConfig;
  mediaRecorder: any = null;
  mixer: any = null;
  // for record end

  currentYear: Date;
  joinMeeting: boolean = true;
  joinMeetingBtnText: string = "ready to record";
  recordingStatus: string = "init"; // init | recording | paused | stopped
  //If publishing stops for any reason, it tries to republish again.
  autoRepublishEnabled: boolean = true;
  //Timer job that checks the WebRTC connection
  autoRepublishIntervalJob: any = null;
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
  _AppConfig: IAppConfig;
  microphoneDevices: Array<OptionSet>;
  cameraDevices: Array<OptionSet>;
  screenDevices: Array<OptionSet>;

  @ViewChild("videoPreview", { static: true }) VideoPreview: ElementRef;
  @ViewChild("videoBlack", { static: true }) VideoBlack: ElementRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private appConfig: AppConfigService
  ) {
    this.currentYear = new Date();

    this.streamConfig = new StreamConfig();
    this.streamConfig.microphone = "-1";
    this.streamConfig.modulecode = "-1";
    this.streamConfig.camera = "-1";
    this.streamConfig.screen = "-1";
    this.streamConfig.mode = "dualStream";
    this.streamConfig.modeLayout = 1; // 1 | 2 | 3 | 4 | 5
    this.streamConfig.cameraOff = false;
    this.streamConfig.micOff = false;
    this.streamConfig.embedLogo = false;
  }

  async ngOnInit() {
    this.spinner.show();
    // debugger
    //read app config from asset folder
    this._AppConfig = await this.appConfig.GetAppConfig();

    // this.websocketURL = "wss://lightingpartners.co:5443/WebRTCApp/websocket?rtmpForward=" + this.rtmpForward;
    if (this._AppConfig.serverUrl) {
      this.websocketURL = this._AppConfig.serverUrl.startsWith("https")
        ? "wss://"
        : "ws://";
      this.websocketURL =
        this.websocketURL +
        this._AppConfig.serverUrl.split("://")[1] +
        ":5443" +
        "/WebRTCApp/websocket?rtmpForward=" +
        this.rtmpForward;
    }

    this.microphoneDevices = new Array<OptionSet>();
    this.cameraDevices = new Array<OptionSet>();
    this.screenDevices = new Array<OptionSet>();

    this.FillMediaDeviceOptionset();

    this.spinner.hide();
  }

  JoinMeeting() {
    this.joinMeeting = !this.joinMeeting;
    // debugger
    this.joinMeetingBtnText =
      this.joinMeetingBtnText == "leave" ? "ready to record" : "leave";

    this._AppConfig.streamId = this.streamConfig.title.replace(" ", "");

    return;

    if (this.joinMeeting) {
      this.initWebRTCAdaptor(
        true,
        this.autoRepublishEnabled,
        this.autoRepublishIntervalJob,
        this._AppConfig.streamId,
        this._AppConfig.token
      );
    } else this.stopPublishing();
  }

  // BEGIN Recording functions  record_status: init | recording | paused | stopped

  startRecord() {
    console.log("this.streamConfig", this.streamConfig);
    // return;
    let options = {
      video: {
        cursor: "always",
        width: 1280,
        height: 960
      },
      audio: true
    };
    if (navigator.getDisplayMedia) {
      navigator.getDisplayMedia(options).then(screenStream => {
        this.afterScreenCaptured(screenStream);
        this.captureStream = screenStream;
      });
    } else if (navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia(options).then(screenStream => {
        this.afterScreenCaptured(screenStream);
        this.captureStream = screenStream;
      });
    } else {
      alert("getDisplayMedia API is not supported by this browser.");
    }
    this.recordingStatus = "recording";
  }
  async stopRecord() {
    this.mixer.releaseStreams();
    this.recordingStatus = "stopped";
    this.VideoPreview.nativeElement.src = this.VideoPreview.nativeElement.srcObject = null;

    let tracks = this.captureStream.getTracks();
    tracks.forEach(track => track.stop());

    let that = this;
    that.mediaRecorder.stopRecording(function() {
      let blob = that.mediaRecorder.getBlob();
      console.log(blob);
      that.VideoPreview.nativeElement.src = URL.createObjectURL(blob);

      // that.mediaRecorder.destroy();
      // that.mediaRecorder = null;
    });
  }

  saveRecorded() {
    const blob = this.mediaRecorder.getBlob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "recorded.mp4";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  afterScreenCaptured(screenStream) {
    let that = this;

    navigator.mediaDevices
      .getUserMedia({
        video: { width: { exact: 320 }, height: { exact: 240 } },
        audio: true
      })
      .then(function(cameraStream) {
        let screenSize = {
          width: 1920,
          height: 1080,
          top: 90,
          left: 0
        };
        let cameraSize = {
          width: 320,
          height: 240,
          top: 0,
          left: 1600
        };
        switch (that.streamConfig.modeLayout) {
          case 1:
            screenSize = {
              width: 1920,
              height: 900,
              top: 90,
              left: 0
            };
            cameraSize = {
              width: 320,
              height: 240,
              top: 0,
              left: 1600
            };
            break;
          case 2:
            break;
          case 3:
            break;
          case 4:
            break;
          case 5:
            break;
          default:
            break;
        }
        console.log("screen size", screen.width, screen.height);
        console.log("screenSize, cameraSize", screenSize, cameraSize);

        let backgroundStream = that.VideoBlack.nativeElement.captureStream();
        backgroundStream.fullcanvas = true;
        backgroundStream.width = 1920;
        backgroundStream.height = 1080;
        // set screen options
        screenStream.width = screenSize.width;
        screenStream.height = screenSize.height;
        screenStream.top = screenSize.top;
        screenStream.left = screenSize.left;

        // set camera options
        cameraStream.width = cameraSize.width;
        cameraStream.height = cameraSize.height;
        cameraStream.top = cameraSize.top;
        cameraStream.left = cameraSize.left;

        // screenStream.width = screen.width; // or 3840
        // screenStream.height = screen.height; // or 2160

        // cameraStream.width = parseInt((20 / 100) * screenStream.width);
        // cameraStream.height = parseInt((20 / 100) * screenStream.height);
        // cameraStream.top = screenStream.height - cameraStream.height;
        // cameraStream.left = screenStream.width - cameraStream.width;

        // that.fullCanvasRenderHandler(screenStream, "Your Screen!");
        // that.normalVideoRenderHandler(
        //   cameraStream,
        //   "Your Camera!",
        //   function() {}
        // );

        that.mixer = new MultiStreamsMixer([
          backgroundStream,
          screenStream,
          cameraStream
        ]);

        that.mixer.frameInterval = 1;
        that.mixer.startDrawingFrames();

        let mixedStream = that.mixer.getMixedStream();
        that.VideoPreview.nativeElement.srcObject = mixedStream;

        // begin record functions
        that.mediaRecorder = new RecordRTC(mixedStream, {
          type: "video",
          mimeType: "video/mp4"
        });
        that.mediaRecorder.startRecording();
        // end record functions

        that.addStreamStopListener(screenStream, function() {
          that.mixer.releaseStreams();
          that.VideoPreview.nativeElement.pause();
          that.VideoPreview.nativeElement.src = null;

          cameraStream.getTracks().forEach(function(track) {
            track.stop();
          });
        });
      });
  }

  addStreamStopListener(stream, callback) {
    stream.addEventListener(
      "ended",
      function() {
        callback();
        callback = function() {};
      },
      false
    );
    stream.addEventListener(
      "inactive",
      function() {
        callback();
        callback = function() {};
      },
      false
    );
    stream.getTracks().forEach(function(track) {
      track.addEventListener(
        "ended",
        function() {
          callback();
          callback = function() {};
        },
        false
      );
      track.addEventListener(
        "inactive",
        function() {
          callback();
          callback = function() {};
        },
        false
      );
    });
  }

  fullCanvasRenderHandler(stream, textToDisplay) {
    let that = this;

    stream.onRender = function(context, x, y, width, height, idx) {
      context.font = "50px Georgia";
      let measuredTextWidth = parseInt(
        context.measureText(textToDisplay).width
      );
      x = x + (parseInt((width - measuredTextWidth).toString()) - 40);
      y = y + 80;
      context.strokeStyle = "rgb(255, 0, 0)";
      context.fillStyle = "rgba(255, 255, 0, .5)";
      that.roundRect(
        context,
        x - 20,
        y - 55,
        measuredTextWidth + 40,
        75,
        20,
        true,
        true
      );
      let gradient = context.createLinearGradient(0, 0, width * 2, 0);
      gradient.addColorStop("0", "magenta");
      gradient.addColorStop("0.5", "blue");
      gradient.addColorStop("1.0", "red");
      context.fillStyle = gradient;
      context.fillText(textToDisplay, x, y);
    };
  }

  normalVideoRenderHandler(stream, textToDisplay, callback) {
    // on-video-render:
    // called as soon as this video stream is drawn (painted or recorded) on canvas2d surface
    stream.onRender = function(context, x, y, width, height, idx, ignoreCB) {
      if (!ignoreCB && callback) {
        callback(context, x, y, width, height, idx, textToDisplay);
        return;
      }

      context.font = "40px Georgia";
      let measuredTextWidth = parseInt(
        context.measureText(textToDisplay).width
      );
      x = x + parseInt((width - measuredTextWidth).toString()) / 2;
      y = context.canvas.height - height + 50;
      context.strokeStyle = "rgb(255, 0, 0)";
      context.fillStyle = "rgba(255, 255, 0, .5)";
      this.roundRect(
        context,
        x - 20,
        y - 35,
        measuredTextWidth + 40,
        45,
        20,
        true
      );
      let gradient = context.createLinearGradient(0, 0, width * 2, 0);
      gradient.addColorStop("0", "magenta");
      gradient.addColorStop("0.5", "blue");
      gradient.addColorStop("1.0", "red");
      context.fillStyle = gradient;
      context.fillText(textToDisplay, x, y);
    };
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == "undefined") {
      stroke = true;
    }
    if (typeof radius === "undefined") {
      radius = 5;
    }
    if (typeof radius === "number") {
      radius = {
        tl: radius,
        tr: radius,
        br: radius,
        bl: radius
      };
    } else {
      let defaultRadius = {
        tl: 0,
        tr: 0,
        br: 0,
        bl: 0
      };
      for (let side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius.br,
      y + height
    );
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }

  // END Recording functions

  // BEGIN my record configuration
  async selectScreen() {
    let displayMediaOptions = {
      // For ScreenShare
      video: {
        cursor: "always"
      },
      audio: true
    };
    let captureStream = null;

    try {
      captureStream = await navigator.mediaDevices.getDisplayMedia(
        displayMediaOptions
      );
      this.captureStream = captureStream;
    } catch (err) {
      console.error("Error: " + err);
    }
  }

  setModeLayout(type) {
    this.streamConfig.mode = "singleStream";
    this.streamConfig.modeLayout = type;
  }
  // END my record configuration

  startPublishing() {
    this.webRTCAdaptor.publish(this._AppConfig.streamId, this._AppConfig.token);
  }

  stopPublishing() {
    if (this.autoRepublishIntervalJob != null) {
      clearInterval(this.autoRepublishIntervalJob);
      this.autoRepublishIntervalJob = null;
    }
    this.webRTCAdaptor.stop(this._AppConfig.streamId);
  }

  initWebRTCAdaptor(
    publishImmediately,
    autoRepublishEnabled,
    autoRepublishIntervalJob,
    streamId,
    token
  ) {
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
            this.publish(streamId, token);
          }
        } else if (info == "publish_started") {
          // debugger
          //stream is being published
          console.log("publish started");
          //this.start_publish_button.nativeElement.disabled = true;
          //this.stop_publish_button.nativeElement.disabled = false;
          this.startAnimation();
          if (autoRepublishEnabled && autoRepublishIntervalJob == null) {
            autoRepublishIntervalJob = setInterval(() => {
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
        let errorMessage = JSON.stringify(error);
        if (typeof message != "undefined") {
          errorMessage = message;
        }
        errorMessage = JSON.stringify(error);
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

  FillMediaDeviceOptionset() {
    let This = this;
    navigator.mediaDevices
      .enumerateDevices()
      .then(function(deviceInfos) {
        // debugger
        This.microphoneDevices = new Array<OptionSet>();
        This.cameraDevices = new Array<OptionSet>();
        This.screenDevices = new Array<OptionSet>();

        for (let i = 0; i !== deviceInfos.length; ++i) {
          const deviceInfo = deviceInfos[i];

          if (deviceInfo.kind === "audioinput") {
            This.microphoneDevices.push({
              text:
                deviceInfo.label ||
                `microphone ${This.microphoneDevices.length + 1}`,
              value: deviceInfo.deviceId
            });
          } else if (deviceInfo.kind === "videoinput") {
            This.cameraDevices.push({
              text:
                deviceInfo.label ||
                `microphone ${This.cameraDevices.length + 1}`,
              value: deviceInfo.deviceId
            });
          } else if (deviceInfo.kind === "audiooutput") {
          } else {
            console.log("Some other kind of source/device: ", deviceInfo);
          }
        }
        //set default values
        if (This.microphoneDevices.length > 0) {
          This.streamConfig.microphone = This.microphoneDevices[0].value;
        }
        if (This.cameraDevices.length > 0) {
          This.streamConfig.camera = This.cameraDevices[0].value;
        }

        console.log(
          "publisher devices",
          This.microphoneDevices,
          This.cameraDevices
        );
      })
      .catch(this.handleError);
  }

  handleError(error: any) {
    console.error(error);
  }
}

export class StreamConfig {
  modulecode: string;
  screen: string;
  camera: string;
  microphone: string;
  title: string;
  mode: string;
  modeLayout: number;
  micOff: boolean;
  cameraOff: boolean;
  embedLogo: boolean;
}

export class OptionSet {
  text: string;
  value: string;
}
