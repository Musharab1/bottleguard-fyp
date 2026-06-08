import serial
import time

def main():
    arduino = serial.Serial('COM8', 9600, timeout=1)  # change COM8 if needed
    time.sleep(2)
    while True:
        cmd = input("Enter 1 for ON, 0 for OFF, q for Quit: ")
        if cmd == 'q':
            break
        arduino.write(cmd.encode())
        response = arduino.readline().decode().strip()
        print("Arduino:", response)
    arduino.close()

if __name__ == "__main__":
    main()