---
name: embedded-systems
description: Embedded systems design and programming
license: MIT
compatibility: opencode
metadata:
  audience: firmware engineers, embedded developers
  category: engineering
---

## What I do

- Design firmware for microcontrollers and microprocessors
- Implement real-time operating systems (RTOS)
- Interface with sensors, actuators, and peripherals
- Optimize code for resource-constrained systems
- Debug hardware/software issues

## When to use me

- When developing firmware for microcontrollers
- When interfacing with hardware peripherals
- When implementing communication protocols
- When optimizing for low power or memory constraints
- When debugging embedded systems issues

## Key Concepts

### Microcontroller Basics

```c
// Example: STM32 GPIO configuration
void GPIO_Init(GPIO_TypeDef *port, uint8_t pin, uint8_t mode) {
    // Enable clock
    if (port == GPIOA) RCC->APB2ENR |= RCC_APB2ENR_IOPAEN;
    
    // Configure pin mode
    port->CRL &= ~(0xF << (pin * 4));  // Clear
    port->CRL |= (mode << (pin * 4));   // Set
}

// Interrupt handler
void EXTI0_IRQHandler(void) {
    if (EXTI->PR & EXTI_PR_PR0) {
        // Handle interrupt
        EXTI->PR = EXTI_PR_PR0;  // Clear pending
    }
}
```

### RTOS Concepts

```c
// FreeRTOS task creation
void vTaskCode(void *pvParameters) {
    while (1) {
        // Task functionality
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void create_tasks() {
    xTaskCreate(vTaskCode, "Task1", configMINIMAL_STACK_SIZE, 
                NULL, 1, NULL);
    xTaskCreate(vTaskCode, "Task2", configMINIMAL_STACK_SIZE, 
                NULL, 2, NULL);
}

// Queue communication
QueueHandle_t xQueue;
xQueue = xQueueCreate(10, sizeof(int32_t));
xQueueSend(xQueue, &value, 0);
xQueueReceive(xQueue, &received, portMAX_DELAY);
```

### Communication Protocols

```python
# I2C communication
class I2CDevice:
    def __init__(self, address):
        self.address = address
    
    def read_register(self, reg):
        """Read from register"""
        # I2C read sequence: START → ADDR+W → REG → START → ADDR+R → DATA → STOP
        pass
    
    def write_register(self, reg, value):
        """Write to register"""
        # I2C write sequence: START → ADDR+W → REG → DATA → STOP
        pass

# SPI communication
class SPIDevice:
    def __init__(self, clk, mosi, miso, cs):
        self.clk = clk
        self.mosi = mosi
        self.miso = miso
        self.cs = cs
    
    def transfer(self, data):
        """Full duplex SPI transfer"""
        # Shift out data while shifting in response
        pass
```

### Common Embedded Peripherals

| Peripheral | Protocol | Use Case |
|------------|----------|----------|
| UART/USART | Async serial | Debug, GPS, Bluetooth |
| SPI | Serial synchronous | Sensors, SD cards, displays |
| I2C | Two-wire serial | Sensors, EEPROMs, RTCs |
| ADC | N/A | Analog sensors |
| PWM | N/A | Motor control, LEDs |
| Timer | N/A | Timing, interrupts |

### Power Optimization

```c
// Low power mode transitions
void enter_sleep_mode(uint8_t mode) {
    // Save state
    SCB->SCR |= SCB_SCR_SLEEPDEEP_Msk;
    
    switch(mode) {
        case SLEEP:
            PWR->CR |= PWR_CR_LPDS;
            break;
        case STOP:
            PWR->CR |= PWR_CR_LPDS;
            PWR->CR |= PWR_CR_CSBF;
            break;
        case STANDBY:
            PWR->CR |= PWR_CR_PDDS;
            break;
    }
    
    __WFI();  // Wait for interrupt
}

// Clock gating for unused peripherals
void disable_unused_clocks() {
    RCC->APB1ENR = 0;  // Disable all APB1
    RCC->APB2ENR = 0;  // Disable all APB2
}
```

### Common Microcontrollers

| Family | Architecture | Use Cases |
|--------|-------------|-----------|
| STM32 | ARM Cortex-M | General purpose |
| ESP32 | Xtensa dual-core | WiFi, BLE, IoT |
| ATmega | AVR | Arduino, simple apps |
| PIC | PIC | Industrial, automotive |
| nRF52 | ARM Cortex-M | BLE, wearables |

### Debugging

```c
// Assert macro for development
#ifdef DEBUG
#define ASSERT(condition) \
    if (!(condition)) { \
        while(1);  // Break here \
    }
#else
#define ASSERT(condition)
#endif

// Ring buffer implementation
typedef struct {
    uint8_t *buffer;
    uint16_t head;
    uint16_t tail;
    uint16_t size;
} RingBuffer;

uint8_t rb_put(RingBuffer *rb, uint8_t data) {
    uint16_t next = (rb->head + 1) % rb->size;
    if (next == rb->tail) return 0;  // Full
    rb->buffer[rb->head] = data;
    rb->head = next;
    return 1;
}
```
