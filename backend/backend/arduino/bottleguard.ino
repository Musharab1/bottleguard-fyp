// BottleGuard Arduino Bridge
// Sustained signal version — holds pins until explicitly reset

#define PIN_CONVEYOR 7 // PLC: conveyor running signal
#define PIN_SORT 9     // PLC: defect detected, activate sorter
#define PIN_RESET 10   // PLC: reset sorter actuator

String command = "";

void setup()
{
    Serial.begin(9600);
    pinMode(PIN_CONVEYOR, OUTPUT);
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
            // Conveyor running normally — keep sort LOW
            digitalWrite(PIN_CONVEYOR, HIGH);
            digitalWrite(PIN_SORT, LOW);
            Serial.println("ACK_START");
        }
        else if (command == "SORT")
        {
            // Defect detected — activate sorter, hold HIGH
            digitalWrite(PIN_SORT, HIGH);
            digitalWrite(PIN_CONVEYOR, LOW); // optional: pause conveyor
            Serial.println("ACK_SORT");
        }
        else if (command == "RESET")
        {
            // Bottle sorted — reset everything back to normal
            digitalWrite(PIN_SORT, LOW);
            digitalWrite(PIN_CONVEYOR, HIGH); // resume conveyor
            Serial.println("ACK_RESET");
        }
        else if (command == "STOP")
        {
            // Emergency stop — everything LOW
            allLow();
            Serial.println("ACK_STOP");
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

void allLow()
{
    digitalWrite(PIN_CONVEYOR, LOW);
    digitalWrite(PIN_SORT, LOW);
    digitalWrite(PIN_RESET, LOW);
}