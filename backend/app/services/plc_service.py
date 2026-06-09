import serial
import time
from datetime import datetime


class PLCService:
    def __init__(self):
        self.serial_conn      = None
        self.connected        = False
        self.conveyor_running = False
        self.commands_log     = []
        self.port             = 'COM7'
        self.mode             = 'simulation'
        self.pin9_state       = 'LOW'   # track SORT pin state
        self.last_response    = None

    def connect(self, port='COM7', baudrate=9600):
        try:
            self.serial_conn = serial.Serial(port, baudrate, timeout=1)
            time.sleep(2)                          # wait for Arduino reset
            self.serial_conn.reset_input_buffer()  # flush READY message
            self.connected = True
            self.port = port
            self.mode = 'hardware'
            print(f"[PLC] Connected to Arduino on {port}")
            return True
        except Exception as e:
            print(f"[PLC] Arduino not found on {port} — simulation mode: {e}")
            self.mode = 'simulation'
            return False

    def send_command(self, command):
        command = command.upper()
        self._log_command(command)

        if self.connected and self.serial_conn:
            try:
                # ✅ Send command with newline — Arduino uses readStringUntil('\n')
                self.serial_conn.write(f"{command}\n".encode())
                time.sleep(0.1)
                response = self.serial_conn.readline().decode().strip()
                self.last_response = response
                print(f"[PLC] Sent: {command} | Arduino: {response}")

                # update state tracking
                self._update_state(command)

                return {
                    'success':   True,
                    'command':   command,
                    'response':  response,
                    'pin9':      self.pin9_state,
                    'mode':      'hardware'
                }
            except Exception as e:
                print(f"[PLC] Serial error: {e}")
                return {'success': False, 'error': str(e)}
        else:
            # Simulation mode
            sim_responses = {
                'START': 'ACK_START',
                'STOP':  'ACK_STOP',
                'SORT':  'ACK_SORT',
                'RESET': 'ACK_RESET',
                'STATUS':'STATUS_OK'
            }
            response = sim_responses.get(command, 'UNKNOWN_CMD')
            self.last_response = response
            self._update_state(command)
            print(f"[PLC SIM] {command} → {response}")
            return {
                'success':  True,
                'command':  command,
                'response': response,
                'pin9':     self.pin9_state,
                'mode':     'simulation'
            }

    def _update_state(self, command):
        """Track conveyor and pin states based on command."""
        if command == 'START':
            self.conveyor_running = True
            self.pin9_state = 'LOW'
        elif command == 'STOP':
            self.conveyor_running = False
            self.pin9_state = 'LOW'
        elif command == 'SORT':
            self.pin9_state = 'HIGH'   # sustained HIGH until RESET
            self.conveyor_running = False
        elif command == 'RESET':
            self.pin9_state = 'LOW'
            self.conveyor_running = True  # resume conveyor after reset

    def sort_defect(self, class_name):
        """Auto-called by YOLO when defect detected."""
        if class_name != 'Correct-Bottle':
            print(f"[PLC] Defect: {class_name} → sending SORT")
            result = self.send_command('SORT')
            time.sleep(1)  # give actuator time to sort
            self.send_command('RESET')
            return result

    def get_status(self):
        return {
            'connected':        self.connected,
            'conveyor_running': self.conveyor_running,
            'port':             self.port,
            'mode':             self.mode,
            'pin9':             self.pin9_state,
            'last_response':    self.last_response,
            'recent_commands':  self.commands_log[-10:]
        }

    def _log_command(self, command):
        self.commands_log.append({
            'command':   command,
            'timestamp': datetime.utcnow().isoformat(),
            'response':  None   # will be updated after send
        })
        if len(self.commands_log) > 50:
            self.commands_log = self.commands_log[-50:]

    def disconnect(self):
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
        self.connected = False
        print("[PLC] Disconnected")


plc_service = PLCService()