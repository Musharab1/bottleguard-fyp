#include <Servo.h>

#define PIN_SORT 6  // Servo signal pin
#define POS_IDLE 0  // normal position — no defect
#define POS_SORT 90 // sorting position — defect detected

Servo sortServo;
String command = "";

void setup()
{
    Serial.begin(9600);
    sortServo.attach(PIN_SORT);
    sortServo.write(POS_IDLE); // force idle at startup — fixes motor moving on its own
    delay(1000);               // wait for servo to settle before accepting commands
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
            sortServo.write(POS_SORT);
            Serial.println("ACK_SORT");
        }
        else if (command == "RESET")
        {
            sortServo.write(POS_IDLE);
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