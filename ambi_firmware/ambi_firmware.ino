#include <WiFi.h>
#include <WiFiUdp.h>

const char* ssid = "your_SSID";         // WiFi network SSID
const char* password = "your_PASSWORD"; // WiFi network password

int packetSize = 12; // r+g+b * 4(leds) 

WiFiUDP udp;
const uint16_t udpPort = 1234; // UDP port to listen on
IPAddress udpAddress(192, 168, 1, 100); // IP address to listen to
uint8_t buffer[packetSize];

void setup() {
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

      updateLeds();
    } else {
      // Ignore packets from other IP addresses
      udp.flush();
    }
  }
}

updateLeds(){
    // todo update actual leds
    Serial.print("leds updated");
}