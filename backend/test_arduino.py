import serial
import time

def main():
    try:
        arduino = serial.Serial('COM7', 9600, timeout=1)
        print("Connected to Arduino on COM7")
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

            time.sleep(2)
            arduino.reset_input_buffer()  # ← clears READY and any startup messages
            print("Arduino ready.")  # should print ACK_SORT or ACK_RESET

    except KeyboardInterrupt:
        print("\nInterrupted.")
    finally:
        arduino.close()
        print("Port closed.")

if __name__ == "__main__":
    main()