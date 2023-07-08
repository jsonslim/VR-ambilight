#include <WiFi.h>
#include <AsyncUDP.h>
#include <Adafruit_NeoPixel.h>

// Which pin on the Arduino is connected to the NeoPixels?
#define PIN 5

// How many NeoPixels are attached to the Arduino?
#define NUMPIXELS 4

// When setting up the NeoPixel library, we tell it how many pixels,
// and which pin to use to send signals. Note that for older NeoPixel
// strips you might need to change the third parameter -- see the
// strandtest example for more information on possible values.
Adafruit_NeoPixel pixels(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);

const int packetSize = 12; // r+g+b * 4(leds) 

// Variable to store the device state
volatile bool currentMode = true; // 0 - standby, 1 - active
volatile bool previousMode = true; 

// Variables for button logic
const int buttonPin = 27;
const unsigned long debounceDelay = 250;
unsigned long button_time = 0;  
unsigned long last_button_time = 0;
bool buttonPressed = false;
volatile int lastButtonState = HIGH;

// Network variables
const char* ssid = "****";     // WiFi network SSID
const char* password = "****";          // WiFi network password
const uint16_t udpServerPort = 5554;
const uint16_t udpBoardPort = 5555;
IPAddress ip = IPAddress(192, 168, 0, 23);  // IP address of the server
uint8_t buffer[packetSize];
AsyncUDP udp;

uint8_t buf[20];

void IRAM_ATTR buttonISR() {
  button_time = millis();
  if ((button_time - last_button_time ) >= debounceDelay) {
   buttonPressed = true;
   currentMode = !currentMode;
   last_button_time = button_time;
  }
}

void printPacketDetails(AsyncUDPPacket packet){
  Serial.print(", From: ");
  Serial.print(packet.remoteIP());
  Serial.print(":");
  Serial.print(packet.remotePort());
  Serial.print(", To: ");
  Serial.print(packet.localIP());
  Serial.print(":");
  Serial.print(packet.localPort());
  Serial.print(", Length: ");
  Serial.print(packet.length());
  Serial.print(", Data: ");
  Serial.write(packet.data(), packet.length());
  Serial.println();
}

void updateLeds(){
  pixels.setPixelColor(0, pixels.Color(buf[2],buf[1],buf[0])); // not RGB but BGR
  pixels.setPixelColor(1, pixels.Color(buf[5],buf[4],buf[3]));
  pixels.setPixelColor(2, pixels.Color(buf[8],buf[7],buf[6]));
  pixels.setPixelColor(3, pixels.Color(buf[11],buf[10],buf[9]));
  pixels.show();
}

void blackoutLeds(){
  for(int i = 0; i < 4; i++){
    pixels.setPixelColor(i, pixels.Color(0, 0, 0));
  }
  pixels.show();
}

void setLedStaticColor(uint8_t R, uint8_t G, uint8_t B){
  for(int i = 0; i < 4; i++){
    pixels.setPixelColor(i, pixels.Color(R, G, B));
  }
  pixels.show();
}

/* ==========================- SETUP -===============================*/
void setup() {
  delay(300);
  Serial.begin(115200);

  pinMode(buttonPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(buttonPin), buttonISR, FALLING);

  setLedStaticColor(1,0,0); // red glow on start
  // Connect to WiFi network
  WiFi.setHostname("ESP32_Ambilight_client");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");

  // Start UDP client
  if (udp.listen(udpBoardPort)) {
    Serial.print("UDP Listening on IP: ");
    Serial.println(WiFi.localIP());
    udp.onPacket([](AsyncUDPPacket packet) {
      // printPacketDetails(packet);

      // ==== set the global led buffer & update leds color ==== //
      for (int i=0;i<packet.length();i++){
        buf[i]= *(packet.data()+i);
      }

      updateLeds();
    });
  } else {
    Serial.println("Failed to start UDP client");
  }
}

/* ==========================- LOOP -===============================*/
void loop() {
  if (buttonPressed) {
    if(currentMode){
      const char* message = "dispArea";
      udp.writeTo((const uint8_t*)message, strlen(message), ip, udpServerPort);
    } else {
      const char* message = "standby";
      udp.writeTo((const uint8_t*)message, strlen(message), ip, udpServerPort);
      delay(500);
      blackoutLeds();
    }
    // Serial.printf("Device active: %u\n", currentMode);
    buttonPressed = false;
  }
}
