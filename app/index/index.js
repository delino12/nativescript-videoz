var backgroundHttp      = require("nativescript-background-http");
var mPicker             = require("nativescript-mediafilepicker");
var page;

function onNavigatingTo(args) {
    page = args.object;
}

function uploadVideo(args) {
    var videoPreview = page.getViewById("nativeVideoPlayer");
    // body...
    let allowedVideoQualities = [];

    // if (app.ios) {
    //     allowedVideoQualities = [AVCaptureSessionPreset1920x1080, AVCaptureSessionPresetHigh];  // get more from here: https://developer.apple.com/documentation/avfoundation/avcapturesessionpreset?language=objc
    // }

    let VideoPickerOptions = {
        android: {
            isCaptureMood: false, // if true then camera will open directly.
            isNeedCamera: true,
            maxNumberFiles: 2,
            isNeedFolderList: true,
            maxDuration: 20,

        },
        ios: {
            isCaptureMood: false, // if true then camera will open directly.
            videoMaximumDuration: 10,
            allowedVideoQualities: allowedVideoQualities
        }
    }

    let mediafilepicker = new mPicker.Mediafilepicker(); 
    mediafilepicker.openVideoPicker(VideoPickerOptions);

    mediafilepicker.on("getFiles", function (res) {
        let results = res.object.get('results');
        // console.dir(results);
        // results are always in array
        var file_path = results[0].file
        videoPreview.src = file_path;

        processVideoUpload(file_path).then(response => {
            console.log('BGHttp proccess initiated...')
            console.log(response);
        }).catch(err => {
            console.log('Error uploading via BGHttp');
            console.log(err);
        }) 
    });

    mediafilepicker.on("error", function (res) {
        let msg = res.object.get('msg');
        console.log(msg);
    });

    mediafilepicker.on("cancel", function (res) {
        let msg = res.object.get('msg');
        console.log(msg);
    });
}

function processVideoUpload(file_path) {
    // body...
    return new Promise((resolve, reject) => {
        var request = {
            url: 'http://209.97.181.50:8077/media/video',
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream"
            },
            description: "Processing video upload",
            androidNotificationTitle: "Uploading timeline story"
            // androidAutoClearNotification: true
        }

        var backgroundSession = backgroundHttp.session('file-upload');
        var task = backgroundSession.uploadFile(file_path, request);

        task.on("progress", (e) => {
            // console log data
            // console.log(e, 'processing');
            console.log(`uploading... ${e.currentBytes} / ${e.totalBytes}`);
        });

        task.on("error", (e) => {
            // console log data
            console.log(e);
            console.log('error uploading file to server')
            reject(e.response)
        });

        task.on("complete", (e) => {
            // console log data
            console.log(`received ${e.responseCode} code`);
        });

        task.on("responded", (e) => {
            // console log data
            console.log(`received ${e.responseCode} code. Server sent: ${e.data}`);
            var timeline_media = JSON.parse(e.data);
            resolve(timeline_media)
        });
    })
}

exports.uploadVideo = uploadVideo;
exports.onNavigatingTo = onNavigatingTo;
