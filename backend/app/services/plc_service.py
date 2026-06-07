import serial
import time

class PLCService:
    def __init__(self):
        self.serial_conn      = None
        self.connected        = False
        self.conveyor_running = False
        self.commands_log     = []
        self.port             = 'COM8'
        self.mode             = 'simulation'

    def connect(self, port='COM8', baudrate=9600):
        try:
            self.serial_conn = serial.Serial(port, baudrate, timeout=1)
            time.sleep(2)  # wait for Arduino reset
            self.connected = True
            self.port = port
            self.mode = 'hardware'
            print(f"[PLC] Connected to Arduino on {port}")
            return True
        except Exception as e:
            print(f"[PLC] Arduino not found on {port} — simulation mode")
            self.mode = 'simulation'
            return False

    def send_command(self, command):
        """
        command: 'START' or 'STOP' or 'SORT'
        Maps to: '1' (ON) or '0' (OFF) as your Arduino expects
        """
        self._log_command(command)

        # Map dashboard commands to Arduino signals
        signal = self._map_command(command)

        if self.connected and self.serial_conn:
            try:
                self.serial_conn.write(signal.encode())
                response = self.serial_conn.readline().decode().strip()
                print(f"[PLC] Sent: {signal} ({command}) | Arduino: {response}")
                if command == 'START':
                    self.conveyor_running = True
                elif command == 'STOP':
                    self.conveyor_running = False
                return {
                    'success':  True,
                    'command':  command,
                    'signal':   signal,
                    'response': response,
                    'mode':     'hardware'
                }
            except Exception as e:
                print(f"[PLC] Serial error: {e}")
                return {'success': False, 'error': str(e)}
        else:
            # Simulation mode
            print(f"[PLC SIM] Would send: {signal} for command: {command}")
            if command == 'START':
                self.conveyor_running = True
            elif command == 'STOP':
                self.conveyor_running = False
            return {
                'success':  True,
                'command':  command,
                'signal':   signal,
                'response': f'SIM_ACK',
                'mode':     'simulation'
            }

    def sort_defect(self, class_name):
        """Auto-called by YOLO when defect detected."""
        if class_name != 'Correct-Bottle':
            print(f"[PLC] Defect: {class_name} → sending SORT signal")
            return self.send_command('SORT')

    def get_status(self):
        return {
            'connected':        self.connected,
            'conveyor_running': self.conveyor_running,
            'port':             self.port,
            'mode':             self.mode,
            'recent_commands':  self.commands_log[-10:]
        }

    def _map_command(self, command):
        """Map human commands to Arduino signals (1=ON, 0=OFF)."""
        mapping = {
            'START': '1',
            'STOP':  '0',
            'SORT':  '1',   # sort = momentary ON
            'RESET': '0',
        }
        return mapping.get(command.upper(), '0')

    def _log_command(self, command):
        from datetime import datetime
        self.commands_log.append({
            'command':   command,
            'timestamp': datetime.utcnow().isoformat()
        })
        if len(self.commands_log) > 50:
            self.commands_log = self.commands_log[-50:]

    def disconnect(self):
        if self.serial_conn:
            self.serial_conn.close()
        self.connected = False
        print("[PLC] Disconnected")


plc_service = PLCService()