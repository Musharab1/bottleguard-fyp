import serial
import time

def main():
    try:
        arduino = serial.Serial('COM5', 9600, timeout=1)  # ✅ COM5
        print("Connected to Arduino on COM5")
    except serial.SerialException as e:
        print(f"❌ Failed to connect: {e}")
        return

    time.sleep(2)
    arduino.reset_input_buffer()  # ✅ flush READY once at startup
    print("Arduino ready.")

    try:
        while True:
            cmd = input("Enter 's' for SORT, 'r' for RESET, 'q' to Quit: ").strip().lower()

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
            response = arduino.readline().decode().strip()  # ✅ read response
            print(f"Arduino: {response}")

    except KeyboardInterrupt:
        print("\nInterrupted.")
    finally:
        arduino.close()
        print("Port closed.")

if __name__ == "__main__":
    main()