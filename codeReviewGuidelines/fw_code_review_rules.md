# Firmware Code Review Guidelines (Copilot Assisted)

## Objective
This document provides a set of rules and checks for reviewing firmware source code using GitHub Copilot.  
The goal is to identify potential **bugs, unsafe implementations, maintainability issues, and code quality problems**.

Copilot should analyze the codebase and highlight issues based on the rules defined below.

---

## Copilot Review Instructions

When reviewing firmware code:

1. **Scan the entire file/module first** - Get complete context before analyzing
2. **Identify issues according to the sections in this document** - Use systematic approach
3. **Prioritize issues by severity** - Critical > High > Medium > Low
4. **Provide comprehensive details for each issue:**
   - File name and path
   - Function name
   - Problematic code snippet
   - Clear explanation of risk/impact
   - Recommended fix with code example

**Important:** Do not only explain code behavior — focus on identifying **defects, risks, and improvement opportunities**.

**Review Focus:**
- Memory safety violations
- Concurrency issues and race conditions
- Hardware-specific risks
- Input validation gaps
- Error handling deficiencies
- Timing and real-time constraint violations

---

# 1. General Code Quality

## 1.1 Code Readability

Check for:

- Meaningful variable and function names
- Avoidance of magic numbers
- Clear function purpose
- Proper indentation and formatting
- Consistent coding style

Flag when:

- Functions exceed **100–150 lines**
- Nested logic exceeds **3–4 levels**
- Variables have ambiguous names (`temp`, `data1`, `value`)

---

## 1.2 Modularity

Verify:

- Functions perform **one logical task**
- Reusable logic is **not duplicated**
- Large functions are split into smaller functions

Flag when:

- Duplicate logic appears across multiple files
- Function responsibilities are unclear

---

# 2. Memory Safety Checks

## 2.1 Buffer Overflow Risks

Check usage of:

- `memcpy`
- `strcpy`
- `sprintf`
- manual array access

Flag if:

- Destination buffer size is not validated
- Index may exceed array boundary

Example risk:

```c
char buffer[10];
strcpy(buffer, input);  // potential overflow
```

Prefer:

```c
char buffer[10];
strncpy(buffer, input, sizeof(buffer) - 1);
buffer[sizeof(buffer) - 1] = '\0';
```

---

## 2.2 NULL Pointer Dereference

Check for:

- Pointer parameters accessed without NULL validation
- Return values from functions (malloc, getter functions) used without checking
- Callback function pointers invoked without validation

Flag if:

- Pointers dereferenced before NULL check
- Function return pointers used directly without validation

Example risk:

```c
void processData(uint8_t *data) {
    data[0] = 0;  // No NULL check - will crash if data is NULL
}

sConfigData_t *config = getConfig();
config->value = 10;  // Crash if getConfig() returns NULL
```

Prefer:

```c
void processData(uint8_t *data) {
    if (data == NULL) {
        return;
    }
    data[0] = 0;
}

sConfigData_t *config = getConfig();
if (config != NULL) {
    config->value = 10;
}
```

---

## 2.3 Array Bounds Checking

Check for:

- Off-by-one errors using `<=` instead of `<`
- Array index calculations without overflow checks
- Loop boundaries that allow out-of-bounds access

Flag when:

- Condition uses `<=` with array size: `if (index <= ARRAY_SIZE)`
- Multi-byte writes don't check `index + size < ARRAY_SIZE`
- Array access uses signed integers without negative checks

Example risk:

```c
#define MAX_SIZE 10
uint8_t buffer[MAX_SIZE];

if (index <= MAX_SIZE) {  // Wrong: allows index = 10
    buffer[index] = value;  // buffer[10] is out of bounds
}

// Multi-byte access risk
if (offset < sizeof(buffer)) {  // Wrong: doesn't check offset+1
    buffer[offset] = high_byte;
    buffer[offset + 1] = low_byte;  // May overflow
}
```

Prefer:

```c
if (index < MAX_SIZE) {  // Correct
    buffer[index] = value;
}

if (offset < sizeof(buffer) - 1) {  // Check space for both bytes
    buffer[offset] = high_byte;
    buffer[offset + 1] = low_byte;
}
```

---

## 2.4 Integer Overflow and Underflow

Check for:

- Arithmetic operations without overflow detection
- Type conversions that may truncate values
- Multiplication before bounds checking

Flag when:

- Large values multiplied without overflow check
- Unsigned values decremented in loops
- Narrowing casts (e.g., uint16_t to uint8_t) without validation

Example risk:

```c
uint16_t len = input_len;
len = len * 2;  // May overflow if input_len > 32767

uint8_t index = (uint8_t)regIndex * 2;  // Truncation if regIndex > 127
```

Prefer:

```c
if (input_len > UINT16_MAX / 2) {
    return ERROR_OVERFLOW;
}
len = input_len * 2;

if (regIndex > 127) {
    return ERROR_OUT_OF_RANGE;
}
uint8_t index = (uint8_t)regIndex * 2;
```

---

# 3. Input Validation

## 3.1 External Input Validation

Check that all external inputs are validated:

- Modbus register values
- UART/BLE received data
- Configuration parameters
- User commands

Flag when:

- Input values used directly without range checks
- Enum values not validated against known range
- Float/double values not checked for NaN or infinity

Example risk:

```c
void setTemperature(float temp) {
    systemConfig.temperature = temp;  // No validation
}

void setMode(uint8_t mode) {
    currentMode = (eMode_t)mode;  // Unchecked enum cast
}
```

Prefer:

```c
void setTemperature(float temp) {
    if (temp < TEMP_MIN || temp > TEMP_MAX || isnan(temp)) {
        return ERROR_INVALID_VALUE;
    }
    systemConfig.temperature = temp;
}

void setMode(uint8_t mode) {
    if (mode >= E_MODE_MAX) {
        return ERROR_INVALID_MODE;
    }
    currentMode = (eMode_t)mode;
}
```

---

## 3.2 String Handling

Check for:

- String operations without length validation
- Unterminated strings
- Use of unsafe string functions

Flag when:

- `strlen()` used without ensuring null termination
- `strtok()` used on unvalidated buffers
- String buffers read from external sources without null termination

Example risk:

```c
char command[100];
readUartData(command, 100);  // May not be null-terminated
length = strlen(command);  // Crash if no null byte
```

Prefer:

```c
char command[100];
size_t bytesRead = readUartData(command, 99);  // Leave room for null
command[bytesRead] = '\0';  // Ensure termination
length = strnlen(command, sizeof(command));
```

---

# 4. Error Handling

## 4.1 Return Value Checking

Check that:

- All function return codes are checked
- Critical failures are propagated
- Initialization functions report success/failure

Flag when:

- Function return values ignored
- Error paths missing cleanup
- Void functions used where errors should be reported

Example risk:

```c
void systemInit(void) {
    gpioInit();  // What if this fails?
    uartInit();  // What if this fails?
    // Continues regardless of init failures
}

memcpy(dest, src, size);  // Return value ignored
```

Prefer:

```c
eSystemError systemInit(void) {
    if (gpioInit() != SUCCESS) {
        return ERROR_GPIO_INIT;
    }
    if (uartInit() != SUCCESS) {
        gpioDeInit();  // Cleanup on failure
        return ERROR_UART_INIT;
    }
    return SUCCESS;
}
```

---

## 4.2 Consistent Error Handling

Check for:

- Uniform error code definitions
- Consistent error handling patterns
- Clear error propagation

Flag when:

- Mixed error return types (int, bool, enum)
- Functions with multiple error reporting mechanisms
- Errors silently ignored

---

# 5. Type Safety and Casting

## 5.1 Type Conversions

Check for:

- Narrowing casts without validation
- Signed to unsigned conversions
- Pointer type punning

Flag when:

- Casting to smaller type without range check
- Using `char` for byte counts (may be signed)
- Implicit type conversions that lose precision

Example risk:

```c
uint16_t value = 1000;
uint8_t byte = (uint8_t)value;  // Truncates to 232

char len = 200;  // char may be signed, becomes -56
memcpy(dest, src, len);  // Negative length!
```

Prefer:

```c
uint16_t value = 1000;
if (value > UINT8_MAX) {
    return ERROR;
}
uint8_t byte = (uint8_t)value;

uint8_t len = 200;  // Use unsigned type for counts
memcpy(dest, src, len);
```

---

## 5.2 Pointer Arithmetic

Check for:

- Pointer arithmetic without bounds checking
- Pointer type assumptions
- Alignment requirements

Flag when:

- Pointers incremented in loops without bounds
- Void pointers directly dereferenced
- Unaligned access to multi-byte types

---

# 6. Concurrency and Race Conditions

## 6.1 Shared Variable Access

Check for:

- Variables accessed from ISR and main context
- Missing `volatile` qualifiers
- Unprotected critical sections

Flag when:

- Non-atomic multi-byte variables shared between ISR and main
- No critical section wrapper for read-modify-write operations
- Missing `volatile` on ISR-modified variables

Example risk:

```c
uint32_t counter = 0;  // Missing volatile

void ISR_Handler(void) {
    counter++;  // Modified in ISR
}

void main(void) {
    if (counter > 10) {  // Read in main - race condition
        // May read partial/stale value
    }
}
```

Prefer:

```c
volatile uint32_t counter = 0;

void ISR_Handler(void) {
    counter++;
}

void main(void) {
    __disable_irq();
    uint32_t localCounter = counter;  // Atomic read
    __enable_irq();
    
    if (localCounter > 10) {
        // Safe to use local copy
    }
}
```

---

## 6.2 Resource Locking

Check for:

- Proper mutex/semaphore usage
- Critical sections correctly paired
- Deadlock prevention

Flag when:

- Lock acquired but not released on all paths
- Multiple locks without consistent ordering
- Interrupts disabled for extended periods

---

# 7. State Management

## 7.1 Static Variables

Check for:

- Function-local static variables
- Hidden state dependencies
- Reentrancy issues

Flag when:

- Static variables used for multi-step operations
- State persists between function calls unintentionally
- Non-reentrant code due to statics

Example risk:

```c
void parseFloat(uint16_t registerValue, uint8_t part) {
    static float accumulator;  // Retains state between calls
    
    if (part == 0) {
        // Store first part
    } else {
        // Use accumulated value - depends on previous call
    }
}
```

Prefer:

```c
typedef struct {
    float accumulator;
    uint8_t partsReceived;
} FloatParser_t;

void parseFloat(FloatParser_t *parser, uint16_t registerValue) {
    // Explicit state management
}
```

---

## 7.2 State Machine Implementation

Check for:

- All states handled in switch statements
- Valid state transitions only
- Default case always present

Flag when:

- Switch without default case
- State transitions without validation
- State variables not protected

---

## 7.3 Global Variable Usage

Check for:

- Excessive use of global variables
- Global variables modified by multiple modules
- No clear ownership or access control
- Missing encapsulation

Flag when:

- Global variables accessed by many unrelated modules
- Globals used without getter/setter functions
- No documentation of which module owns the data
- Global state making code hard to test
- Thread-safety issues with shared globals

Example risk:

```c
// Wrong: Global variable modified everywhere
uint32_t systemTick = 0;  // Modified by multiple modules

void moduleA(void) {
    systemTick++;  // Direct modification
}

void moduleB(void) {
    systemTick = 0;  // Reset without protection
}

// Wrong: Excessive globals
uint8_t sensor1Value;
uint8_t sensor2Value;
uint8_t sensor3Value;
bool sensor1Valid;
bool sensor2Valid;
bool sensor3Valid;
// ... repeated for each sensor
```

Prefer:

```c
// Correct: Encapsulated with clear ownership
static uint32_t systemTick = 0;  // Private to module

volatile uint32_t getSystemTick(void) {
    return systemTick;
}

void incrementSystemTick(void) {
    __disable_irq();
    systemTick++;
    __enable_irq();
}

// Correct: Structured data with access control
typedef struct {
    uint8_t value;
    bool valid;
    uint32_t timestamp;
} SensorData_t;

static SensorData_t sensors[3];  // Private to sensor module

// Public interface
eSystemError getSensorValue(uint8_t index, uint8_t *value) {
    if (index >= 3 || value == NULL) {
        return ERROR_INVALID_PARAM;
    }
    if (!sensors[index].valid) {
        return ERROR_SENSOR_INVALID;
    }
    *value = sensors[index].value;
    return SUCCESS;
}
```

**Best Practices:**
- Minimize global variables
- Use `static` to limit scope to file
- Provide accessor functions (getters/setters)
- Group related data into structures
- Document ownership and access rules
- Protect shared globals with critical sections or mutexes

---

# 8. Resource Management

## 8.1 Dynamic Memory

Check for:

- Every `malloc()` has corresponding `free()`
- Memory leak prevention
- NULL check after allocation

Flag when:

- Allocated memory not freed on error paths
- Double free potential
- Memory allocated in embedded system (generally avoid)

Note: Dynamic allocation should be avoided in most embedded firmware.

---

## 8.2 Peripheral Resources

Check for:

- Peripherals properly initialized before use
- Resources released when no longer needed
- Conflicting peripheral configurations

Flag when:

- UART/SPI/I2C used without initialization
- GPIO configured for conflicting purposes
- Clock references incorrect

---

## 8.3 Initialization Order and Dependencies

Check for:

- Correct peripheral initialization sequence
- Dependencies between modules documented
- Usage of peripherals/modules before initialization
- Initialization function return values checked

Flag when:

- Functions use peripherals before initialization complete
- Initialization order undocumented or incorrect
- Circular dependencies between modules
- Clock/PLL not configured before peripheral init
- No verification that initialization succeeded

Example risk:

```c
// Wrong: Using UART before initialization
void main(void) {
    debugPrint("Starting...");  // UART not initialized yet!
    uartInit();
}

// Wrong: Wrong initialization order
void systemInit(void) {
    adcInit();      // Needs clock configured first
    clockInit();    // Should be first!
    gpioInit();
}

// Wrong: Dependency not clear
void sensorInit(void) {
    // Uses I2C but doesn't initialize it
    readSensorID();  // Assumes I2C is ready
}
```

Prefer:

```c
// Correct: Proper initialization order documented
/**
 * @brief  System initialization sequence
 * @note   Order is critical:
 *         1. Clock configuration
 *         2. GPIO initialization
 *         3. Peripheral initialization (UART, I2C, SPI)
 *         4. Application modules (sensors, tasks)
 */
eSystemError systemInit(void) {
    // Step 1: Clock configuration first
    if (clockInit() != SUCCESS) {
        return ERROR_CLOCK_INIT;
    }
    
    // Step 2: GPIO initialization
    if (gpioInit() != SUCCESS) {
        return ERROR_GPIO_INIT;
    }
    
    // Step 3: Communication peripherals
    if (uartInit() != SUCCESS) {
        return ERROR_UART_INIT;
    }
    
    if (i2cInit() != SUCCESS) {
        return ERROR_I2C_INIT;
    }
    
    // Step 4: Application modules (depend on above)
    if (sensorInit() != SUCCESS) {
        return ERROR_SENSOR_INIT;
    }
    
    return SUCCESS;
}

// Correct: Check initialization state before use
static bool uartIsInitialized = false;

eSystemError debugPrint(const char *msg) {
    if (!uartIsInitialized) {
        return ERROR_NOT_INITIALIZED;
    }
    return uartTransmit(msg);
}

eSystemError uartInit(void) {
    // ... initialization code ...
    uartIsInitialized = true;
    return SUCCESS;
}
```

**Common Initialization Dependencies:**

1. **Clock System** → Must be first
2. **GPIO** → Needs clock
3. **UART/SPI/I2C** → Need clock and GPIO
4. **ADC/DAC** → Need clock and GPIO
5. **Timers** → Need clock
6. **DMA** → Needs peripherals configured first
7. **Application Modules** → Need all peripherals ready
8. **Interrupts/RTOS** → Enable after all init complete

**Best Practices:**
- Document initialization order requirements
- Check return values from all init functions
- Use initialization flags to prevent re-initialization
- Verify prerequisites before initializing dependent modules
- Consider using initialization state machine for complex systems

---

# 9. Firmware-Specific Concerns

## 9.1 Watchdog Timer

Check for:

- Watchdog reset in long operations
- Timeout values appropriate for worst-case
- Watchdog disabled only when necessary

Flag when:

- Long initialization without WDT reset
- Blocking operations exceed WDT timeout
- WDT reset in ISR (may hide problems)

---

## 9.2 Interrupt Handling

Check for:

- ISR functions are short and fast
- No blocking operations in ISR
- Shared data properly protected

Flag when:

- ISR performs lengthy operations
- ISR calls blocking functions (printf, malloc, etc.)
- ISR modifies data without atomic operations

---

## 9.3 Stack Usage

Check for:

- Large local variables (use static or heap)
- Deep recursion (should be avoided)
- Stack overflow risk

Flag when:

- Local arrays > 256 bytes
- Recursive functions
- Unbounded function call depth

---

## 9.4 Hardware Register Access

Check for:

- Proper read-modify-write patterns for registers
- Correct bit masking operations
- Full register overwrites where inappropriate
- Missing delay after register writes when required

Flag when:

- Direct register assignment when bits should be preserved
- Bit operations without proper masking
- Missing volatile qualifier on register pointers
- Hardware timing requirements not met

Example risk:

```c
// Wrong: Overwrites other bits
GPIOA->MODER = 0x01;  // Destroys other pin configurations

// Wrong: Not atomic
REG |= BIT_5;  // Read-modify-write without protection
```

Prefer:

```c
// Correct: Read-modify-write with proper masking
uint32_t temp = GPIOA->MODER;
temp &= ~(0x3 << 0);  // Clear bits
temp |= (0x1 << 0);   // Set bits
GPIOA->MODER = temp;

// If in ISR context, protect critical section
__disable_irq();
REG |= BIT_5;
__enable_irq();
```

---

## 9.5 Peripheral Communication Error Handling

Check for:

- UART/SPI/I2C timeout mechanisms
- Error flag checking after transactions
- Proper error recovery procedures
- Buffer overrun protection in UART RX

Flag when:

- Blocking indefinitely waiting for peripheral ready
- Ignoring error flags (framing, parity, overrun)
- No timeout in communication loops
- Missing error callbacks or handlers

Example risk:

```c
// Wrong: Blocks forever if peripheral fails
while(!(USART1->SR & USART_SR_TXE));  // No timeout
USART1->DR = data;

// Wrong: Ignores errors
HAL_UART_Transmit(&huart1, data, len, HAL_MAX_DELAY);  // Return value ignored
```

Prefer:

```c
// Correct: Timeout protection
uint32_t timeout = 1000;
while(!(USART1->SR & USART_SR_TXE) && --timeout);
if (timeout == 0) {
    return ERROR_UART_TIMEOUT;
}
USART1->DR = data;

// Correct: Check return value
if (HAL_UART_Transmit(&huart1, data, len, 100) != HAL_OK) {
    handleUartError();
    return ERROR_UART_TX;
}
```

---

## 9.6 DMA Usage Safety

Check for:

- DMA buffers declared as `volatile` when accessed by both CPU and DMA
- Buffer alignment requirements met (typically 4-byte or 8-byte)
- Cache coherence issues on MCUs with data cache
- DMA buffers not modified by CPU while transfer is active
- DMA transfer completion properly detected

Flag when:

- CPU writes to DMA source buffer during active transfer
- CPU reads from DMA destination buffer before completion
- No transfer completion checks (polling flags or interrupts)
- DMA interrupts configured but not handled
- Buffer alignment not guaranteed
- Missing cache flush/invalidate on cache-enabled systems

Example risk:

```c
// Wrong: Buffer may not be aligned
uint8_t dmaBuffer[256];  // No alignment guarantee

// Wrong: CPU modifying buffer during DMA transfer
HAL_UART_Transmit_DMA(&huart1, txBuffer, 100);
txBuffer[0] = 0xFF;  // Race condition!

// Wrong: Reading before completion
HAL_UART_Receive_DMA(&huart1, rxBuffer, 100);
processData(rxBuffer);  // DMA may not be complete!
```

Prefer:

```c
// Correct: Aligned buffer
__attribute__((aligned(4))) uint8_t dmaBuffer[256];
// Or use
uint8_t dmaBuffer[256] __attribute__((aligned(4)));

// Correct: Wait for completion
volatile bool dmaTxComplete = false;

void HAL_UART_TxCpltCallback(UART_HandleTypeDef *huart) {
    dmaTxComplete = true;
}

HAL_UART_Transmit_DMA(&huart1, txBuffer, 100);
while(!dmaTxComplete);  // Wait before modifying buffer
txBuffer[0] = 0xFF;  // Now safe

// Correct: Process only after completion
volatile bool dmaRxComplete = false;

HAL_UART_Receive_DMA(&huart1, rxBuffer, 100);
while(!dmaRxComplete);  // Wait for completion
processData(rxBuffer);  // Now safe
```

For cache-enabled systems:

```c
// Before DMA TX: Flush cache to memory
SCB_CleanDCache_by_Addr((uint32_t*)txBuffer, bufferSize);
HAL_UART_Transmit_DMA(&huart1, txBuffer, bufferSize);

// After DMA RX: Invalidate cache to read fresh data
while(!dmaRxComplete);
SCB_InvalidateDCache_by_Addr((uint32_t*)rxBuffer, bufferSize);
processData(rxBuffer);
```

---

## 9.7 Endianness Handling

Check for:

- Multi-byte data in communication protocols (Modbus, CAN, Ethernet, etc.)
- Byte order conversion functions used correctly
- Protocol specification compliance (big-endian vs. little-endian)
- Manual byte packing/unpacking correctness

Flag when:

- 16/32/64-bit values directly cast to byte buffers
- Assuming specific endianness without documentation
- Protocol specification not followed
- Byte swapping missing where required
- Inconsistent endianness handling

Example risk:

```c
// Wrong: Assumes little-endian, not portable
uint16_t value = 0x1234;
memcpy(buffer, &value, 2);  // Byte order depends on CPU

// Wrong: Incorrect manual packing
uint32_t data = 0x12345678;
buffer[0] = data >> 24;  // May not match protocol
buffer[1] = data >> 16;
buffer[2] = data >> 8;
buffer[3] = data;

// Wrong: Direct cast creates endianness issues
uint16_t *ptr = (uint16_t*)&buffer[0];
*ptr = modbusRegister;  // Byte order undefined
```

Prefer:

```c
// Correct: Explicit byte order for big-endian protocol (e.g., Modbus)
void writeUint16BE(uint8_t *buffer, uint16_t value) {
    buffer[0] = (value >> 8) & 0xFF;  // MSB first
    buffer[1] = value & 0xFF;         // LSB second
}

uint16_t readUint16BE(const uint8_t *buffer) {
    return ((uint16_t)buffer[0] << 8) | buffer[1];
}

// Correct: For little-endian protocol
void writeUint16LE(uint8_t *buffer, uint16_t value) {
    buffer[0] = value & 0xFF;         // LSB first
    buffer[1] = (value >> 8) & 0xFF;  // MSB second
}

// Correct: Using standard functions (if available)
#include <arpa/inet.h>
uint16_t networkValue = htons(hostValue);  // Host to network (big-endian)
uint16_t hostValue = ntohs(networkValue);  // Network to host
```

For 32-bit values:

```c
void writeUint32BE(uint8_t *buffer, uint32_t value) {
    buffer[0] = (value >> 24) & 0xFF;
    buffer[1] = (value >> 16) & 0xFF;
    buffer[2] = (value >> 8) & 0xFF;
    buffer[3] = value & 0xFF;
}

uint32_t readUint32BE(const uint8_t *buffer) {
    return ((uint32_t)buffer[0] << 24) |
           ((uint32_t)buffer[1] << 16) |
           ((uint32_t)buffer[2] << 8) |
           buffer[3];
}
```

---

## 9.8 Structure Alignment and Packing

Check for:

- Structures used in communication protocols or hardware registers
- Compiler padding affecting memory layout
- Structures transmitted over UART/SPI/I2C/Ethernet
- Binary file I/O with structures

Flag when:

- Structures sent directly over communication interfaces without packing
- No `#pragma pack` or `__attribute__((packed))` for protocol structures
- Assumptions about structure size without verification
- Mixing different sized types without considering alignment

Example risk:

```c
// Wrong: Compiler adds padding
typedef struct {
    uint8_t id;        // 1 byte
                       // 1 byte padding added here!
    uint16_t value;    // 2 bytes
    uint32_t timestamp;// 4 bytes
} Packet_t;            // Total: 8 bytes (not 7!)

// Wrong: Sending with padding bytes
Packet_t packet;
UART_Send(&packet, sizeof(Packet_t));  // Sends garbage in padding
```

Prefer:

```c
// Correct: Packed structure for communication
#pragma pack(push, 1)  // Set 1-byte alignment
typedef struct {
    uint8_t id;        // 1 byte
    uint16_t value;    // 2 bytes (no padding)
    uint32_t timestamp;// 4 bytes
} Packet_t;            // Total: 7 bytes
#pragma pack(pop)      // Restore default alignment

// Or using GCC attribute
typedef struct __attribute__((packed)) {
    uint8_t id;
    uint16_t value;
    uint32_t timestamp;
} Packet_t;

// Verify size at compile time
_Static_assert(sizeof(Packet_t) == 7, "Packet size mismatch");

// Safe transmission
Packet_t packet = {.id = 1, .value = 100, .timestamp = 12345};
UART_Send((uint8_t*)&packet, sizeof(Packet_t));
```

**Important Notes:**
- Packed structures may cause unaligned access on some architectures (ARM Cortex-M0/M0+)
- Consider manual serialization for critical performance
- Document endianness assumptions
- Test structure size with `sizeof()` assertions

---

# 10. Timing and Real-Time Constraints

## 10.1 Blocking Operations

Check for:

- Long blocking delays in main loop
- Blocking I/O operations
- Busy-wait loops without timeout
- Delays that affect system responsiveness

Flag when:

- `delay_ms()` called with values > 100ms in main loop
- Infinite loops waiting for conditions
- Polling without timeout
- Blocking operations in time-critical paths

Example risk:

```c
void mainTask(void) {
    delay_ms(1000);  // Blocks entire system for 1 second
    readSensor();    // Other tasks starved
}

// Blocking wait without timeout
while(!dataReady);  // Could hang forever
```

Prefer:

```c
void mainTask(void) {
    static uint32_t lastTime = 0;
    uint32_t currentTime = getTick();
    
    if (currentTime - lastTime >= 1000) {
        readSensor();
        lastTime = currentTime;
    }
    // Non-blocking, allows other tasks to run
}

// Timeout protection
uint32_t timeout = 1000;
while(!dataReady && --timeout) {
    delay_ms(1);
}
if (timeout == 0) {
    return ERROR_TIMEOUT;
}
```

---

## 10.2 ISR Execution Time

Check for:

- ISR execution time kept minimal (<10 microseconds ideal)
- No heavy computation in ISR
- Flag setting instead of processing
- Deferred work to main context

Flag when:

- ISR contains loops or complex calculations
- ISR calls printf, sprintf, or I/O functions
- ISR performs floating-point operations
- ISR execution time exceeds timer period

Example risk:

```c
void UART_IRQHandler(void) {
    uint8_t data = UART_DR;
    
    // Wrong: Processing in ISR
    float result = calculateComplexValue(data);  // Too slow
    sprintf(buffer, "Value: %f", result);        // Blocking
    updateDisplay(buffer);                       // Too much work
}
```

Prefer:

```c
void UART_IRQHandler(void) {
    uint8_t data = UART_DR;
    
    // Correct: Just store data and set flag
    if (rxBufferIndex < RX_BUFFER_SIZE) {
        rxBuffer[rxBufferIndex++] = data;
        dataReadyFlag = true;  // Process in main loop
    }
}

void mainLoop(void) {
    if (dataReadyFlag) {
        dataReadyFlag = false;
        processReceivedData();  // Heavy work done here
    }
}
```

---

## 10.3 Timing-Critical Operations

Check for:

- Critical timing requirements documented
- Delays calibrated and verified
- Jitter impact analyzed
- Real-time constraints met

Flag when:

- Hardware timing requirements not documented
- No consideration for interrupt latency
- Timing loops without calibration
- Assuming fixed CPU frequency without clock checks

---

# 11. Code Quality Issues

## 11.1 Dead Code

Check for:

- Unused variables
- Unused functions
- Commented-out code blocks
- Inactive preprocessor branches
- Unreachable code

Flag when:

- Variables declared but never used
- Functions defined but never called
- Large blocks of commented legacy code
- `#if 0` or `#ifdef NEVER_DEFINED` blocks
- Code after return/break statements

Example issues:

```c
void processData(void) {
    int unusedVar = 0;  // Dead code: never used
    
    if (condition) {
        return;
        processMore();  // Dead code: unreachable
    }
}

#if 0
// Dead code: Should be removed, not commented
void oldImplementation(void) {
    // ...
}
#endif

void neverCalled(void) {  // Dead code: function never invoked
    // ...
}
```

Recommendation: Remove dead code to improve maintainability. Use version control for history.

---

## 11.2 Magic Numbers

Check for:

- Hardcoded numeric literals
- Unnamed bit masks
- Unexplained thresholds
- Configuration values in code

Flag when:

- Numbers used without explanation
- Same value repeated in multiple places
- Register addresses as literals
- Timing values without units

Example risk:

```c
if (temperature > 78) {  // Magic number
    alarm = 1;
}

REG = 0x40;  // What does 0x40 mean?

delay_ms(50);  // Why 50ms?
```

Prefer:

```c
#define TEMP_OVERHEAT_THRESHOLD_C    78  // Celsius
#define TEMP_FAULT_ALARM_BIT         0x40
#define SENSOR_STABILIZATION_TIME_MS 50  // Datasheet section 7.3

if (temperature > TEMP_OVERHEAT_THRESHOLD_C) {
    alarm = 1;
}

REG = TEMP_FAULT_ALARM_BIT;

delay_ms(SENSOR_STABILIZATION_TIME_MS);
```

---

## 11.3 Infinite Loop Verification

For every `while(1)` or `for(;;)` loop, verify:

- Loop has a clear purpose (main loop, task loop, etc.)
- Watchdog is serviced if enabled
- No possibility of deadlock
- Exit conditions exist where appropriate
- Loop body has reasonable execution time

Flag when:

- Infinite loop without watchdog reset
- Loop can block indefinitely waiting for condition
- Loop body execution time exceeds WDT timeout
- Nested infinite loops
- Infinite loop where bounded loop more appropriate

Example risk:

```c
// Main loop - should service watchdog
while(1) {
    processAllTasks();  // No WDT reset - system may reset
}

// Wrong: Infinite wait
while(1) {
    if (dataReady) break;  // Could wait forever
}

// Event loop without exits
while(1) {
    // No way to enter low-power mode or handle shutdown
}
```

Prefer:

```c
// Correct: Main loop with watchdog
while(1) {
    #if ENABLE_WDT
        resetWatchdog();
    #endif
    
    processAllTasks();
}

// Correct: Timeout on wait
uint32_t timeout = 1000;
while(!dataReady && --timeout) {
    delay_ms(1);
}
if (timeout == 0) {
    handleTimeout();
}

// State machine with proper exits
while(systemState != STATE_SHUTDOWN) {
    procesCurrentState();
    checkForLowPowerEntry();
}
```

---

# 12. Firmware Reliability

## 12.1 Fault Recovery

Check for:

- System recovery from communication failures
- Handling of sensor disconnection/failure
- Recovery from invalid states
- Graceful degradation when possible

Flag when:

- No recovery mechanism after errors
- System hangs on peripheral failure
- No fallback values for failed sensors
- Critical operations have no retry mechanism

Example improvements:

```c
// Add retry mechanism
#define MAX_RETRIES 3

eResult readSensorWithRetry(void) {
    uint8_t retries = 0;
    
    while (retries < MAX_RETRIES) {
        if (readSensor() == SUCCESS) {
            return SUCCESS;
        }
        retries++;
        delay_ms(10);
    }
    
    // Fallback: Use last known good value
    useFallbackSensorValue();
    return ERROR_SENSOR_FAILED;
}
```

---

## 12.2 State Machine Robustness

Check for:

- All states handled in switch statements
- Invalid states detected and handled
- State transition validation
- Default case always present

Flag when:

- Missing default case in state machine
- No validation of state transitions
- State variable can be set to invalid value
- No state timeout mechanism

Example risk:

```c
// Wrong: No default case, no invalid state handling
switch(currentState) {
    case STATE_INIT:
        handleInit();
        break;
    case STATE_RUN:
        handleRun();
        break;
    // Missing default - what if currentState is corrupted?
}
```

Prefer:

```c
switch(currentState) {
    case STATE_INIT:
        handleInit();
        break;
    case STATE_RUN:
        handleRun();
        break;
    case STATE_ERROR:
        handleError();
        break;
    default:
        // Handle invalid state
        logError("Invalid state: %d", currentState);
        currentState = STATE_ERROR;
        break;
}
```

---

## 12.3 System Monitoring

Check for:

- Watchdog timer properly configured
- Critical operations have timeout
- System health monitoring
- Diagnostic information available

Flag when:

- Watchdog not enabled in production code
- No monitoring of critical parameters
- No way to detect system degradation
- Missing diagnostic/debug interface

---

# 13. Documentation Requirements

## 13.1 Function Documentation

Required for all functions:

```c
/**
 * @brief  Brief description of function purpose
 * @param  paramName: Description of parameter and valid range
 * @retval ReturnType: Description of return value and error codes
 * @note   Any side effects, limitations, or special considerations
 */
```

---

## 13.2 Complex Logic Comments

Check that:

- Non-obvious algorithms are explained
- Magic numbers have comments explaining value
- Assumptions are documented

Flag when:

- Complex bit manipulations without explanation
- Timing-critical code without timing documentation
- Hardware register access without reference to datasheet

---

# 14. Testing Considerations

## 14.1 Testability

Check for:

- Functions with single responsibility (easier to test)
- Dependency injection for hardware abstraction
- Deterministic behavior

Flag when:

- Functions tightly coupled to hardware
- Functions with hidden dependencies
- Random behavior without seed control

---

## 14.2 Assertions and Checks

Check for:

- Assertions for impossible conditions
- Runtime checks for critical invariants
- Debug-only validation code

Example:

```c
#ifdef DEBUG
    assert(buffer != NULL);
    assert(index < BUFFER_SIZE);
#endif
```

---

# 15. Code Review Output Format

When conducting a code review using these guidelines, structure the findings as follows:

## 15.1 Severity Classifications

**Critical Issues** - Must fix immediately
- Buffer overflows
- NULL pointer dereferences
- Race conditions causing data corruption
- Watchdog failures
- Hard faults or system crashes

**High Risk Issues** - Fix before release
- Missing input validation
- Incorrect error handling
- Memory leaks
- Timing violations
- ISR problems

**Medium Risk Issues** - Should fix
- Poor error recovery
- Missing bounds checks
- Inefficient algorithms
- Inconsistent error handling
- Insufficient documentation

**Low Risk Issues** - Nice to fix
- Code style inconsistencies
- Minor naming issues
- Non-critical magic numbers
- Redundant code

**Code Quality Improvements** - Refactoring suggestions
- Modularity improvements
- Readability enhancements
- Design pattern applications

---

## 15.2 Report Template

For each issue, provide:

```markdown
### Issue Title

**Severity:** Critical | High | Medium | Low

**Location:** 
- File: `path/to/file.c`
- Function: `functionName()`
- Line(s): 123-145

**Issue Description:**
Clear description of what the problem is and why it's problematic.

**Current Code:**
\`\`\`c
// Show the problematic code
\`\`\`

**Risk/Impact:**
Explain the potential consequences (crash, data corruption, etc.)

**Recommended Fix:**
\`\`\`c
// Show corrected code
\`\`\`

**References:**
- Related guidelines: Section X.Y
- Similar issues: File ABC, line 456
```

---

## 15.3 Summary Section

Include at the end of review:

```markdown
## Review Summary

**Statistics:**
- Critical Issues: X
- High Risk Issues: Y
- Medium Risk Issues: Z
- Low Risk Issues: W
- Code Quality Suggestions: V

**Priority Actions:**
1. [Most critical issue to fix first]
2. [Second priority]
3. [Third priority]

**Overall Assessment:**
[Brief summary of codebase quality and main concerns]

**Recommendations:**
- Immediate: [List critical fixes needed before deployment]
- Short-term: [Improvements for next iteration]
- Long-term: [Architectural or design improvements]
```

---

# Summary Checklist

When reviewing code, verify:

**Memory Safety:**
- [ ] All buffer operations are bounds-checked
- [ ] All pointers are NULL-checked before use
- [ ] No off-by-one errors in array bounds
- [ ] No integer overflow/underflow risks
- [ ] Array multi-byte writes check `index + size < buffer_size`

**Input Validation:**
- [ ] All external inputs are validated (Modbus, UART, BLE)
- [ ] Enum values validated before casting
- [ ] Float/double values checked for NaN/infinity
- [ ] String operations have length validation and null termination

**Error Handling:**
- [ ] All function return values are checked
- [ ] Error handling is consistent and complete
- [ ] Initialization functions propagate errors
- [ ] Error paths include proper cleanup

**Concurrency & ISR:**
- [ ] Shared variables properly protected (volatile, critical sections)
- [ ] ISRs are short and don't block
- [ ] No race conditions between ISR and main context
- [ ] Hardware registers accessed with proper read-modify-write

**Hardware & Peripherals:**
- [ ] Hardware register operations use proper bit masking
- [ ] Peripheral communication has timeout protection
- [ ] UART/SPI/I2C error flags are checked
- [ ] Hardware timing requirements are met

**Timing & Real-Time:**
- [ ] No long blocking delays in main loop
- [ ] Watchdog timer properly serviced
- [ ] ISR execution time kept minimal
- [ ] Timeout mechanisms on all wait loops

**Code Quality:**
- [ ] No magic numbers (use named constants)
- [ ] Functions are documented with parameters and return values
- [ ] No dead code (unused variables/functions/commented blocks)
- [ ] Static variables avoided or properly justified
- [ ] Infinite loops properly justified and have watchdog reset

**Resource Management:**
- [ ] Resources properly initialized and cleaned up
- [ ] Peripheral initialization checked for success
- [ ] Dynamic memory avoided (or properly managed if used)
- [ ] No memory leaks on error paths

**Reliability:**
- [ ] State machines have default case and invalid state handling
- [ ] Communication failures have retry/recovery mechanisms
- [ ] System can recover from sensor/peripheral failures
- [ ] Graceful degradation implemented where appropriate

**Testing & Maintenance:**
- [ ] Code is testable and maintainable
- [ ] Functions have single responsibility
- [ ] Complex logic is documented
- [ ] Hardware behavior and timing documented

---

**End of Guidelines**