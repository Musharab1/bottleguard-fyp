// BottleGuard Arduino Bridge
// Receives commands from Flask via USB Serial
// Forwards signals to PLC via digital output pins

#define PIN_START 7  // PLC input: start conveyor
#define PIN_STOP 8   // PLC input: stop conveyor
#define PIN_SORT 9   // PLC input: activate sort actuator
#define PIN_RESET 10 // PLC input: reset actuator

String command = "";

void setup()
{
    Serial.begin(9600);
    pinMode(PIN_START, OUTPUT);
    pinMode(PIN_STOP, OUTPUT);
    pinMode(PIN_SORT, OUTPUT);
    pinMode(PIN_RESET, OUTPUT);
    allLow();
    Serial.println("READY");
}

void loop()
{
    if (Serial.available())
    {
        command = Serial.readStringUntil('\n');
        command.trim();
        command.toUpperCase();

        if (command == "START")
        {
            pulse(PIN_START);
            Serial.println("ACK_START");
        }
        else if (command == "STOP")
        {
            pulse(PIN_STOP);
            Serial.println("ACK_STOP");
        }
        else if (command == "SORT")
        {
            pulse(PIN_SORT);
            Serial.println("ACK_SORT");
        }
        else if (command == "RESET")
        {
            pulse(PIN_RESET);
            Serial.println("ACK_RESET");
        }
        else if (command == "STATUS")
        {
            Serial.println("STATUS_OK");
        }
        else
        {
            Serial.println("UNKNOWN_CMD");
        }
    }
}

void pulse(int pin)
{
    // Send a 500ms HIGH pulse to the PLC input
    digitalWrite(pin, HIGH);
    delay(500);
    digitalWrite(pin, LOW);
}

void allLow()
{
    digitalWrite(PIN_START, LOW);
    digitalWrite(PIN_STOP, LOW);
    digitalWrite(PIN_SORT, LOW);
    digitalWrite(PIN_RESET, LOW);
}