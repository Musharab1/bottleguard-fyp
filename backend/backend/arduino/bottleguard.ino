#include <Servo.h>

#define PIN_SORT 6 // Servo signal pin

Servo sortServo;

// Positions
#define POS_IDLE 0  // normal position — no defect
#define POS_SORT 90 // sorting position — defect detected

String command = "";

void setup()
{
    Serial.begin(9600);
    sortServo.attach(PIN_SORT);
    sortServo.write(POS_IDLE); // start at idle position
    delay(500);
    Serial.println("READY");
}

void loop()
{
    if (Serial.available())
    {
        command = Serial.readStringUntil('\n');
        command.trim();
        command.toUpperCase();

        if (command == "SORT")
        {
            sortServo.write(POS_SORT); // rotate to sort position
            Serial.println("ACK_SORT");
        }
        else if (command == "RESET")
        {
            sortServo.write(POS_IDLE); // return to idle
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