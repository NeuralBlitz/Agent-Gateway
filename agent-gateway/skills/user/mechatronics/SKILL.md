---
name: mechatronics
description: Mechatronic systems integration
license: MIT
compatibility: opencode
metadata:
  audience: engineers, designers, integrators
  category: engineering
---

## What I do

- Integrate mechanical, electrical, and control systems
- Design electromechanical systems and robots
- Implement sensor/actuator interfaces
- Create automated systems and PLC logic
- Optimize system performance across domains

## When to use me

- When designing automated machines or robots
- When integrating sensors and actuators
- When developing PLC control logic
- When creating electromechanical systems
- When troubleshooting integrated systems

## Key Concepts

### System Integration

```python
# Mechatronic system architecture
class MechatronicSystem:
    def __init__(self):
        self.sensors = {}
        self.actuators = {}
        self.controller = None
        self.actuator_commands = []
        self.sensor_data = {}
    
    def add_sensor(self, name, sensor):
        """Add sensor to system"""
        self.sensors[name] = sensor
    
    def add_actuator(self, name, actuator):
        """Add actuator to system"""
        self.actuators[name] = actuator
    
    def read_all_sensors(self):
        """Read all sensor values"""
        self.sensor_data = {
            name: sensor.read() 
            for name, sensor in self.sensors.items()
        }
        return self.sensor_data
    
    def control_loop(self):
        """Execute one control cycle"""
        self.read_all_sensors()
        commands = self.controller.compute(self.sensor_data)
        self.execute_commands(commands)
    
    def execute_commands(self, commands):
        """Send commands to actuators"""
        for name, value in commands.items():
            if name in self.actuators:
                self.actuators[name].set_value(value)
```

### PLC Programming (IEC 61131-3)

```python
# Ladder Logic equivalent in Python
class LadderLogic:
    def __init__(self):
        self.coils = {}
        self.contacts = {}
    
    # Input contact
    def contact(self, address, normally_open=True):
        return {"type": "contact", "address": address, "no": normally_open}
    
    # Output coil
    def coil(self, address):
        return {"type": "coil", "address": address}
    
    # Timer
    def timer(self, preset, timer_type="TON"):
        return {"type": "timer", "preset": preset, "ttype": timer_type}
    
    # Counter
    def counter(self, preset, count_type="CTU"):
        return {"type": "counter", "preset": preset, "ctype": count_type}

# Example: Motor start/stop circuit
ladder = LadderLogic()
# | I:0/0 (Start)  I:0/1 (Stop)   O:0/0 (Motor) |
# |----[ )[ ]----( )----|
```

### Sensor Selection

```python
# Common sensor types and interfaces
SENSOR_INTERFACES = {
    "analog_voltage": {
        "range": "0-10V, ±10V",
        "adc": "Required",
        "resolution": "10-16 bit"
    },
    "analog_current": {
        "range": "4-20mA",
        "adc": "Required (or current sense)",
        "noise": "Low"
    },
    "digital": {
        "types": ["PNP", "NPN", "Push-pull"],
        "interfaces": ["GPIO", "SPI", "I2C"]
    },
    "encoder": {
        "types": ["Incremental", "Absolute"],
        "interfaces": [" quadrature", "SSI", "BiSS"
    ]},
    "proximity": {
        "types": ["Inductive", "Capacitive", "Photoelectric"],
        "range": "1mm - 50mm"
    }
}
```

### Actuator Systems

| Actuator | Control | Power | Applications |
|----------|---------|-------|--------------|
| DC Motor | PWM, H-Bridge | Low-Med | General purpose |
| Servo Motor | PWM | Medium | Position control |
| Stepper Motor | Step/Dir | Medium | Precise positioning |
| Solenoid | On/Off | Low | Valves, clamping |
| Hydraulic | Proportional | High | Heavy loads |
| Pneumatic | On/Off, Proportional | Medium | Fast response |
| Piezoelectric | High voltage | Low | Precision |

### Motor Control

```python
# DC motor control
class DCMotorControl:
    def __init__(self, pwm_pin, dir_pin):
        self.pwm = pwm_pin
        self.dir = dir_pin
    
    def set_speed(self, speed):
        """speed: -1.0 to 1.0"""
        if speed > 0:
            self.dir.write(1)
        else:
            self.dir.write(0)
        self.pwm.write(abs(speed))
    
    # Closed loop speed control
    def pid_speed_control(self, target_rpm, measured_rpm, kp, ki, kd):
        error = target_rpm - measured_rpm
        integral += error * dt
        derivative = (error - prev_error) / dt
        output = kp * error + ki * integral + kd * derivative
        self.set_speed(output)

# Servo control
class ServoControl:
    def __init__(self, pwm_pin):
        self.pwm = pwm_pin
    
    def set_angle(self, angle):
        """angle: 0-180 degrees"""
        pulse = 1000 + (angle / 180) * 1000  # μs
        self.pwm.write_microseconds(pulse)
```

### System Communication

```python
# Industrial communication protocols
PROTOCOLS = {
    "ethernet_ip": {
        "layer": "Industrial Ethernet",
        "speed": "100 Mbps - 1 Gbps",
        "deterministic": "Yes"
    },
    "profinet": {
        "layer": "Industrial Ethernet",
        "features": "IRT, RT"
    },
    "can_bus": {
        "layer": "Fieldbus",
        "speed": "125 kbps - 1 Mbps",
        "deterministic": "Yes"
    },
    "modbus": {
        "layer": "Serial/Ethernet",
        "simple": True
    }
}
```
