---
name: Embedded Systems
description: Design and programming of resource-constrained computing systems including microcontrollers, bare-metal programming, peripheral interfaces, low-power optimization, and embedded Linux systems
license: MIT
compatibility: universal
audience: Embedded Engineers, IoT Developers, Firmware Engineers
category: Computer Science

---

# Embedded Systems

## What I Do

I specialize in embedded systems—computing systems designed for specific control functions within larger mechanical or electrical systems. My expertise spans microcontroller programming (ARM Cortex-M, AVR, PIC), bare-metal firmware development, real-time operating systems (FreeRTOS, Zephyr), peripheral interfaces (GPIO, UART, SPI, I2C, ADC, PWM), low-power design, hardware-software co-design, and embedded Linux systems. I work with resource constraints (memory, processing power, power consumption) while delivering reliable, deterministic, and efficient embedded solutions.

## When to Use Me

- Developing firmware for microcontrollers and SoCs
- Building IoT devices with strict power budgets
- Implementing motor control, sensor interfaces, or actuator systems
- Creating bare-metal drivers without an OS
- Building RTOS-based applications with multiple tasks
- Porting or customizing embedded Linux systems
- Implementing bootloaders and secure boot
- Optimizing code for resource-constrained environments

## Core Concepts

1. **Microcontroller Architecture**: ARM Cortex-M, Peripherals, Memory Maps, Clock Systems
2. **Peripheral Interfaces**: GPIO, UART, SPI, I2C, USB, CAN, ADC, DAC, PWM
3. **Interrupt Handling**: NVIC, vector tables, interrupt priorities, ISR design
4. **Memory Constraints**: Flash, RAM limitations, memory-mapped I/O
5. **Power Management**: Sleep modes, clock gating, dynamic voltage scaling
6. **Real-Time Constraints**: Deterministic timing, interrupt latency, task scheduling
7. **Communication Protocols**: UART, SPI, I2C, CAN, Bluetooth, WiFi stacks
8. **Bootloaders**: Firmware update mechanisms, secure boot, OTA updates
9. **Debugging**: JTAG, SWD, printf debugging, logic analyzers
10. **Safety and Reliability**: Watchdogs, CRC, error detection, fault handling

## Code Examples

```c
// GPIO and Interrupt Handling on STM32
#include "stm32f4xx.h"
#include "system_stm32f4xx.h"

#define LED_PIN GPIO_ODR_ODR_12
#define BUTTON_PIN GPIO_IDR_ID0

volatile uint32_t button_press_count = 0;
volatile uint32_t last_debounce_time = 0;
#define DEBOUNCE_DELAY_MS 50

void GPIO_Init(void) {
    // Enable GPIOD clock (LED) and GPIOA (Button)
    RCC->AHB1ENR |= RCC_AHB1ENR_GPIODEN | RCC_AHB1ENR_GPIOAEN;
    
    // Configure LED pins (PD12-PD15) as output
    GPIOD->MODER &= ~GPIO_MODER_MODER12_0 | GPIO_MODER_MODER13_0 |
                    GPIO_MODER_MODER14_0 | GPIO_MODER_MODER15_0;
    GPIOD->MODER |= GPIO_MODER_MODER12_0 | GPIO_MODER_MODER13_0 |
                   GPIO_MODER_MODER14_0 | GPIO_MODER_MODER15_0;
    
    // Configure button pin (PA0) as input
    GPIOA->MODER &= ~GPIO_MODER_MODER0;
    GPIOA->PUPDR |= GPIO_PUPDR_PUPD0_1;  // Pull-down
    
    // Configure interrupt for button (EXTI0)
    RCC->APB2ENR |= RCC_APB2ENR_SYSCFGEN;
    
    SYSCFG->EXTICR[0] &= ~SYSCFG_EXTICR1_EXTI0;
    SYSCFG->EXTICR[0] |= SYSCFG_EXTICR1_EXTI0_PA;
    
    EXTI->IMR |= EXTI_IMR_IM0;      // Unmask interrupt
    EXTI->FTSR |= EXTI_FTSR_TR0;   // Falling edge trigger
    EXTI->RTSR &= ~EXTI_RTSR_TR0;  // Disable rising edge
    
    // Configure NVIC priority for EXTI0 interrupt
    NVIC_SetPriority(EXTI0_IRQn, 5);
    NVIC_EnableIRQ(EXTI0_IRQn);
}

void EXTI0_IRQHandler(void) {
    if (EXTI->PR & EXTI_PR_PR0) {
        uint32_t current_time = HAL_GetTick();
        
        if (current_time - last_debounce_time > DEBOUNCE_DELAY_MS) {
            button_press_count++;
            last_debounce_time = current_time;
            
            // Toggle LED
            GPIOD->ODR ^= LED_PIN;
        }
        
        EXTI->PR |= EXTI_PR_PR0;  // Clear interrupt flag
    }
}

void delay_ms(uint32_t ms) {
    SysTick->LOAD = (SystemCoreClock / 1000) * ms - 1;
    SysTick->VAL = 0;
    while (!(SysTick->CTRL & SysTick_CTRL_COUNTFLAG_Msk));
}

int main(void) {
    SystemInit();
    GPIO_Init();
    
    while (1) {
        // Main loop - can be empty if using interrupts
        __WFI();  // Wait for interrupt
    }
}
```

```python
# MicroPython I2C Sensor Interface
from machine import Pin, I2C
import time

class BME280Sensor:
    """BME280 temperature, humidity, pressure sensor driver."""
    
    BME280_ADDR = 0x76
    REG_CTRL_HUM = 0xF2
    REG_CTRL_MEAS = 0xF4
    REG_CONFIG = 0xF5
    REG_TEMP = 0xFA
    REG_HUM = 0xFD
    REG_PRESS = 0xF7
    
    def __init__(self, scl_pin=22, sda_pin=21):
        self.i2c = I2C(scl=Pin(scl_pin), sda=Pin(sda_pin), freq=100000)
        self.dig = {}
        self._calibrate()
    
    def _read_u16(self, reg):
        """Read unsigned 16-bit value."""
        data = self.i2c.readfrom_mem(self.BME280_ADDR, reg, 2)
        return (data[0] << 8) | data[1]
    
    def _read_s16(self, reg):
        """Read signed 16-bit value."""
        val = self._read_u16(reg)
        if val > 32767:
            val -= 65536
        return val
    
    def _calibrate(self):
        """Read calibration data from sensor."""
        cal_data = self.i2c.readfrom_mem(self.BME280_ADDR, 0x88, 24)
        
        self.dig['T1'] = cal_data[0] | (cal_data[1] << 8)
        self.dig['T2'] = self._read_s16(0x88)
        self.dig['T3'] = self._read_s16(0x8C)
        self.dig['P1'] = self._read_u16(0x8E)
        self.dig['P2'] = self._read_s16(0x90)
        self.dig['P3'] = self._read_s16(0x92)
        self.dig['P4'] = self._read_s16(0x94)
        self.dig['P5'] = self._read_s16(0x96)
        self.dig['P6'] = self._read_s16(0x98)
        self.dig['P7'] = self._read_s16(0x9A)
        self.dig['P8'] = self._read_s16(0x9C)
        self.dig['P9'] = self._read_s16(0x9E)
        
        hum_cal = self.i2c.readfrom_mem(self.BME280_ADDR, 0xA1, 1)[0]
        self.dig['H1'] = hum_cal
        hum_cal2 = self.i2c.readfrom_mem(self.BME280_ADDR, 0xE1, 7)
        self.dig['H2'] = self._read_s16(0xE1)
        self.dig['H3'] = hum_cal2[2]
        self.dig['H4'] = (hum_cal2[4] << 4) | (hum_cal2[3] & 0x0F)
        self.dig['H5'] = (hum_cal2[5] << 4) | (hum_cal2[3] >> 4)
        self.dig['H6'] = hum_cal2[6]
    
    def _compensate_temp(self, adc_T):
        """Compensate temperature reading."""
        var1 = (adc_T / 16384.0 - self.dig['T1'] / 1024.0) * self.dig['T2']
        var2 = ((adc_T / 131072.0 - self.dig['T1'] / 8192.0) ** 2) * self.dig['T3']
        return (var1 + var2) / 5120.0
    
    def _compensate_press(self, adc_P, t_fine):
        """Compensate pressure reading."""
        var1 = (t_fine / 2.0) - 64000.0
        var2 = var1 * var1 * self.dig['P6'] / 32768.0
        var2 = var2 + var1 * self.dig['P5'] * 2.0
        var2 = (var2 / 4.0) + self.dig['P4'] * 65536.0
        var1 = (self.dig['P3'] * var1 * var1 / 524288.0 + self.dig['P2'] * var1) / 524288.0
        var1 = (1.0 + var1 / 32768.0) * self.dig['P1']
        
        if var1 == 0:
            return 0
        
        pressure = 1048576.0 - adc_P
        pressure = (pressure - var2 / 4096.0) * 6250.0 / var1
        var1 = self.dig['P9'] * pressure * pressure / 2147483648.0
        var2 = pressure * self.dig['P8'] / 32768.0
        pressure = pressure + (var1 + var2 + self.dig['P7']) / 16.0
        
        return pressure / 100.0  # hPa
    
    def read_all(self):
        """Read all sensor values."""
        # Set mode to normal, read all
        self.i2c.writeto_mem(self.BME280_ADDR, self.REG_CTRL_HUM, b'\x05')
        self.i2c.writeto_mem(self.BME280_ADDR, self.REG_CTRL_MEAS, b'\x27')
        
        time.sleep_ms(10)
        
        adc_T = (self.i2c.readfrom_mem(self.BME280_ADDR, self.REG_TEMP, 3)[0] << 12) | \
                (self.i2c.readfrom_mem(self.BME280_ADDR, self.REG_TEMP + 1, 1)[0] << 4) | \
                (self.i2c.readfrom_mem(self.BME280_ADDR, self.REG_TEMP + 2, 1)[0] >> 4)
        
        t_fine = self._compensate_temp(adc_T)
        temperature = t_fine / 5120.0
        
        adc_P = (self.i2c.readfrom_mem(self.BME280_ADDR, self.REG_PRESS, 3)[0] << 12) | \
                (self.i2c.readfrom_mem(self.BME280_ADDR, self.REG_PRESS + 1, 1)[0] << 4) | \
                (self.i2c.readfrom_mem(self.BME280_ADDR, self.REG_PRESS + 2, 1)[0] >> 4)
        
        pressure = self._compensate_press(adc_P, t_fine)
        
        return {
            'temperature': temperature,
            'pressure': pressure,
            'humidity': 0  # Simplified
        }

# Usage
sensor = BME280Sensor()
while True:
    values = sensor.read_all()
    print(f"Temp: {values['temperature']:.1f}C, Press: {values['pressure']:.1f}hPa")
    time.sleep(2)
```

```c
// FreeRTOS Task Management
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include "semphr.h"
#include <stdio.h>

#define TASK_STACK_SIZE 128

typedef struct {
    uint8_t sensor_id;
    float value;
    uint32_t timestamp;
} SensorData_t;

QueueHandle_t sensor_queue;
SemaphoreHandle_t uart_mutex;

void vSensorTask(void *pvParameters) {
    uint8_t sensor_id = *(uint8_t *)pvParameters;
    TickType_t xLastWakeTime = xTaskGetTickCount();
    
    while (1) {
        // Read sensor (simulated)
        float sensor_value = sensor_id * 0.1f + (rand() % 100) / 100.0f;
        
        // Create sensor data message
        SensorData_t data = {
            .sensor_id = sensor_id,
            .value = sensor_value,
            .timestamp = xTaskGetTickCount()
        };
        
        // Send to queue with timeout
        if (xQueueSend(sensor_queue, &data, pdMS_TO_TICKS(10)) != pdTRUE) {
            // Handle queue full
        }
        
        vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(100));
    }
}

void vProcessingTask(void *pvParameters) {
    SensorData_t data;
    
    while (1) {
        if (xQueueReceive(sensor_queue, &data, portMAX_DELAY) == pdTRUE) {
            // Process sensor data
            xSemaphoreTake(uart_mutex, portMAX_DELAY);
            printf("Sensor %d: %.2f at %lu\n", 
                   data.sensor_id, data.value, data.timestamp);
            xSemaphoreGive(uart_mutex);
        }
    }
}

void vBlinkTask(void *pvParameters) {
    uint32_t led_pin = *(uint32_t *)pvParameters;
    
    while (1) {
        // Toggle LED
        GPIO_ToggleBits(GPIO_PORT, led_pin);
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}

int main(void) {
    // Hardware init
    Hardware_Init();
    
    // Create queue
    sensor_queue = xQueueCreate(10, sizeof(SensorData_t));
    if (sensor_queue == NULL) {
        // Handle error
    }
    
    // Create mutex for UART
    uart_mutex = xSemaphoreCreateMutex();
    
    // Create tasks
    uint8_t sensor_ids[] = {1, 2, 3};
    xTaskCreate(vSensorTask, "Sensor1", TASK_STACK_SIZE, 
               &sensor_ids[0], 2, NULL);
    xTaskCreate(vSensorTask, "Sensor2", TASK_STACK_SIZE, 
               &sensor_ids[1], 2, NULL);
    xTaskCreate(vSensorTask, "Sensor3", TASK_STACK_SIZE, 
               &sensor_ids[2], 2, NULL);
    xTaskCreate(vProcessingTask, "Process", TASK_STACK_SIZE * 2, 
               NULL, 3, NULL);
    
    uint32_t led_pin = GPIO_PIN_12;
    xTaskCreate(vBlinkTask, "Blink", TASK_STACK_SIZE, 
               &led_pin, 1, NULL);
    
    // Start scheduler
    vTaskStartScheduler();
    
    // Should never reach here
    while (1);
}
```

## Best Practices

1. **Minimize Dynamic Memory**: Use static allocation and memory pools instead of heap
2. **Interrupt Safety**: Keep ISRs short, signal tasks instead of complex processing
3. **Watchdog Timer**: Always enable and kick watchdogs in main loop
4. **Defensive Initialization**: Validate peripheral initialization, handle failures
5. **Power Optimization**: Use sleep modes, reduce clock frequencies when possible
6. **Communication Reliability**: Implement CRC, retries, and timeouts for comms
7. **Modular Design**: Separate hardware abstraction from application logic
8. **Testability**: Write unit tests for business logic independent of hardware
9. **Version Management**: Implement version tracking for firmware compatibility
10. **Safe State Machine**: Design fail-safe state machines for control systems
