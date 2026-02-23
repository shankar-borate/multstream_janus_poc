# VideoCX Janus UI (TypeScript, OOP) - Virtual Background + Screen Share

## URL params
- roomId
- name
- server (optional)

Example:
http://localhost/janus-videocx-ui-ts-vb-ss/index.html?roomId=1234&name=Shankar&server=wss://janus.conf.meetecho.com/ws

## Build
npm install
npm run build

## Deploy
Copy the folder into nginx web root.

## Features
- Janus VideoRoom multistream
- Remote center video + local PiP
- Screen share (track replacement)
- Virtual background via MediaPipe Selfie Segmentation
"# multstream_janus_poc" 
