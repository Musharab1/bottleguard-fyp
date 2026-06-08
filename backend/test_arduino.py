import serial
import time

def main():
    try:
        arduino = serial.Serial('COM6', 9600, timeout=1)
        print("Connected to Arduino on COM6")
    except serial.SerialException as e:
        print(f"❌ Failed to connect: {e}")
        return

    time.sleep(2)

    try:
        while True:
            cmd = input("Enter 's' for SORT (defect), 'r' for RESET (no defect), 'q' to Quit: ").strip().lower()

            if cmd == 'q':
                break
            elif cmd == 's':
                arduino.write(b"SORT\n")
            elif cmd == 'r':
                arduino.write(b"RESET\n")
            else:
                print("Invalid. Use s, r, or q.")
                continue

            time.sleep(0.1)
            response = arduino.readline().decode().strip()
            print("Arduino:", response)  # should print ACK_SORT or ACK_RESET

    except KeyboardInterrupt:
        print("\nInterrupted.")
    finally:
        arduino.close()
        print("Port closed.")

if __name__ == "__main__":
    main()