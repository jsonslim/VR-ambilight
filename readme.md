# VR_Ambilight for PCVR
Experimental project of building the side lightning for the VR headset.

# Demo video:
[![Watch the video](https://img.youtube.com/vi/XxgsGAq9SQI/0.jpg)](https://youtu.be/XxgsGAq9SQI)

# Description:
The server app takes screenshots --> calculates average color on the left and right sides --> sends the color data via UDP to the ESP32 module mounted on the VR headset.

# Installation:

The app doesn't require installation process, just unpack it to any folder and run the "node.exe". 
The app settings can be adjusted through the config.json, the most important are UDP port(the port of the ESP32 board), IP address, and which pixel to capture(X,Y cordinates for each LED). 


# Notes:

The app is in the proof-of-concept stage, which means that you can try experimenting with it by making different settings through config.json, but it's not a ready product. This app will be replaced by an Android app for the Pico4 device and/or a SteamVR addon if the concept is successful.


## Now it has couple of inconviniences: 

* If you have multiple monitors, you can't select which one is captured. Currently the app catches only the 1st display. So you will need to drag the SteamVR window to this display.

