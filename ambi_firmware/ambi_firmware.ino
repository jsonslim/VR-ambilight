#include <WiFi.h>
#include <WiFiUdp.h>


const int buttonPin = 2;
int packetSize = 12; // r+g+b * 4(leds) 

// Variable to store the button state
volatile int currentMode = 0; // 0 - standby, 1- single pixel mode, 2 - display area calculated
volatile int previousMode = 0; 

// Variables for debounce logic
const unsigned long debounceDelay = 50;
volatile unsigned long lastDebounceTime = 0;
volatile int lastButtonState = HIGH;

// Network variables
const char* ssid = "your_SSID";         // WiFi network SSID
const char* password = "your_PASSWORD"; // WiFi network password

WiFiUDP udp;
const uint16_t udpPort = 1234; // UDP port to listen on
IPAddress udpAddress(192, 168, 1, 100); // IP address to listen to
uint8_t buffer[packetSize];

void IRAM_ATTR buttonISR() {
  // Check the debounce state of the button
  if ((millis() - lastDebounceTime) >= debounceDelay) {
    // Read the current button state
    int buttonState = digitalRead(buttonPin);

    // Check if the button state has changed
    if (buttonState != lastButtonState) {
      // Update the last button state
      lastButtonState = buttonState;

      if (buttonState == LOW) {
        mode++;
        if (mode > 2) {
          mode = 0;
        }

        // Print the updated state to the serial monitor
        Serial.print("State changed to: ");
        Serial.println(mode);
      }
    }
  }

  // Update the debounce time
  lastDebounceTime = millis();
}

void updateLeds(){
  // Check if there's a UDP packet available
  packetSize = udp.parsePacket();

  if (packetSize) {
    if (udp.remoteIP() == udpAddress) {
      // Read the UDP packet into the buffer
      udp.read(buffer, packetSize);

      // Print the received uint array
      Serial.print("Received uint array: ");
      for (int i = 0; i < packetSize; i++) {
        Serial.print(buffer[i]);
        Serial.print(" ");
      }      
      Serial.println();

      // todo send to Leds
    } else {
      // Ignore packets from other IP addresses
      udp.flush();
    }
  }
}

void ledsBlink(bool color){
// 0 - green, 1 - orange or smthn
}

void sendUdpMsg(String msg){

}

void setup() {
  pinMode(buttonPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(buttonPin), buttonISR, FALLING); // maybe RISING is better

  Serial.begin(115200);

  // Connect to WiFi network
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");

  // Start UDP server
  if (udp.begin(udpPort)) {
    Serial.print("UDP server started on port ");
    Serial.println(udpPort);
  } else {
    Serial.println("Failed to start UDP server");
  }
}

void loop() {

  if(currentMode == 0){
    if(currentMode != previousMode){
      sendUdpMsg("standby");
      // todo leds off
      previousMode = currentMode;
    }
  } else if (mode == 1) {
    if(previousMode != currentMode){
      sendUdpMsg("singlePixel");
      ledsBlink();
      previousMode = currentMode;
    }
    updateLeds();

  } else if (mode == 2){
    if(previousMode != currentMode){
      sendUdpMsg("dispArea");
      ledsBlink();
      previousMode = currentMode;
    }
    updateLeds();
  }  
}
