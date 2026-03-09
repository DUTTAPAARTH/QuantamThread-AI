# Animated CPU Power Estimator with Code Analysis

## Overview
This enhanced power estimator application accepts code snippets from **any programming language**, parses them into instruction categories, and provides animated visualization of power consumption during simulated execution. It works with Java, C/C++, Python, JavaScript, and more!

## Features

### 1. **Code Snippet Input**
- Large text area to paste your code
- Supports multi-line code snippets
- Automatically filters comments and empty lines

### 2. **Intelligent Instruction Parsing**
**Language-Agnostic Analysis** - Works with any programming language by detecting patterns:

- **ARITHMETIC**: Math operations (+, -, *, /, %, ++, --, math.*, Math.*)
- **LOGICAL**: Boolean operations (&&, ||, !, &, |, ^, and, or, not)
- **BRANCH**: Conditional statements (if, else, elif, switch, case, default)
- **CONTROL**: Loop and flow control (for, while, do, break, continue, return, def, function)
- **MEMORY**: Array access, memory allocation ([], new, malloc, free, append, push)
- **UNKNOWN**: Unclassified instructions

**Supported Languages:** Java, C/C++, Python, JavaScript, C#, PHP, Ruby, Go, Rust, and more!

### 3. **CPU Model Selection**
Choose from three CPU profiles:
- **Basic**: Balanced power consumption
- **High Performance**: Higher power, faster execution
- **Low Power**: Energy-efficient operation

### 4. **Animated Simulation**
- Step-by-step execution with Swing Timer
- 500ms delay per instruction (configurable)
- Real-time console output showing progress

### 5. **Dual Chart Visualization**

#### Bar Chart
- One bar per instruction
- Color-coded by power level:
  - 🟢 **Green**: Low power (≤ 3.0 mW)
  - 🟡 **Yellow**: Medium power (3.0-5.0 mW)
  - 🔴 **Red**: High power (> 5.0 mW)
- Updates dynamically as simulation progresses

#### Line Chart
- Power vs Time graph
- Points added as each instruction executes
- Line color updates to reflect current power level

### 6. **Report Generation**
- Automatically saves `AnimatedCodePowerReport.txt`
- Includes:
  - CPU model and timestamp
  - Power metrics (total, average, energy)
  - Instruction breakdown by category
  - Detailed instruction list with power/time values

### 7. **JFreeChart Library Check**
- Friendly error message if JFreeChart is missing
- Provides download link and setup instructions

## Requirements

### Java
- Java 8 or higher

### Libraries
- **JFreeChart** (version 1.5.x recommended)
- **JCommon** (version 1.0.x)

Place JAR files in the `lib/` directory:
```
lib/
  ├── jfreechart-1.5.3.jar
  └── jcommon-1.0.24.jar
```

## Usage

### 1. Launch the Application
```bash
java -cp "lib/*;bin" com.powerestimator.PowerEstimatorApp
```

Or use the provided `run.bat` file.

### 📁 Example Files
Check the `examples/` folder for ready-to-test code snippets:
- **fibonacci.py** - Python recursive algorithm
- **bubblesort.js** - JavaScript sorting algorithm  
- **matrix.cpp** - C++ matrix operations
- **algorithms.java** - Java search and sort algorithms

Simply copy and paste any of these into the application!

### 2. Enter Code
Paste your code snippet in the top text area. Works with any programming language!

**Java Example:**
```java
int x = 5 + 3;
if (x > 0) {
    int[] arr = new int[10];
    for (int i = 0; i < 10; i++) {
        arr[i] = i * 2;
    }
}
```

**Python Example:**
```python
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)
        
result = fibonacci(10)
print(result)
```

**C++ Example:**
```cpp
#include <iostream>
int main() {
    int sum = 0;
    for (int i = 1; i <= 100; i++) {
        sum += i;
    }
    std::cout << sum << std::endl;
    return 0;
}
```

**JavaScript Example:**
```javascript
function bubbleSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}
```

### 3. Select CPU Model
Choose your target CPU profile from the dropdown.

### 4. Parse Code
Click **"Parse Code"** to analyze the instructions. The output area will show each instruction's category.

### 5. Simulate Execution
Click **"Simulate Execution"** to start the animation:
- Two chart windows will appear
- Instructions execute one at a time
- Charts update in real-time
- Report is generated automatically

### 6. Clear All
Click **"Clear All"** to reset and start over.

## Power Profiles

| Category   | Basic (mW) | High Perf (mW) | Low Power (mW) |
|-----------|-----------|----------------|----------------|
| ARITHMETIC | 3.5       | 5.0            | 2.2            |
| LOGICAL    | 2.5       | 4.0            | 1.6            |
| MEMORY     | 5.0       | 6.5            | 3.8            |
| CONTROL    | 1.8       | 2.5            | 1.0            |
| BRANCH     | 2.8       | 4.2            | 1.8            |
| UNKNOWN    | 2.0       | 3.5            | 1.5            |

## Execution Time (nanoseconds)

| Category   | Time (ns) |
|-----------|-----------|
| ARITHMETIC | 2.0       |
| LOGICAL    | 1.5       |
| MEMORY     | 3.5       |
| CONTROL    | 1.0       |
| BRANCH     | 2.5       |
| UNKNOWN    | 1.8       |

## Output Files

- **AnimatedCodePowerReport.txt**: Complete simulation report with all metrics and instruction details

## Example Output

```
=== PARSING CODE ===

Line 1: [ARITHMETIC] int x = 5 + 3;
Line 2: [BRANCH] if (x > 0) {
Line 3: [MEMORY] int[] arr = new int[10];
Line 4: [CONTROL] for (int i = 0; i < 10; i++) {
Line 5: [MEMORY] arr[i] = i * 2;

✓ Parsed 5 instructions successfully!

=== STARTING ANIMATED SIMULATION ===
CPU Model: High Performance
Total Instructions: 5

Step 1: [ARITHMETIC] Power=5.00 mW, Time=2.00 ns
Step 2: [BRANCH] Power=4.20 mW, Time=2.50 ns
Step 3: [MEMORY] Power=6.50 mW, Time=3.50 ns
Step 4: [CONTROL] Power=2.50 mW, Time=1.00 ns
Step 5: [MEMORY] Power=6.50 mW, Time=3.50 ns

=== SIMULATION COMPLETE ===
Total Power: 24.70 mW
Average Power: 4.94 mW
Total Time: 12.50 ns
Total Energy: 308.75 pJ
```

## Troubleshooting

### "JFreeChart library not found"
Ensure JAR files are in the `lib/` directory and included in classpath.

### Charts not appearing
Check that both chart windows aren't hidden behind the main window. They appear at different screen positions.

### Parsing returns all UNKNOWN
The parser uses pattern matching on common keywords. Complex or obfuscated code may not categorize correctly.

## Future Enhancements
- Adjustable animation speed
- Export charts as images
- Support for more programming languages
- Configurable power profiles
- Parallel instruction analysis

## License
Educational/Open Source Project

## Author
Enhanced Power Estimator - 2025
