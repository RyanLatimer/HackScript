// HackScript Examples
// This file contains various examples of HackScript syntax

// ===== BASIC EXAMPLES =====

// Hello World
print("Hello, HackScript!")

// Variables and Data Types
name = "Alice"
age = 30
height = 5.8
isStudent = true
favoriteColors = ["blue", "green", "red"]

print("Name:", name)
print("Age:", age)
print("Height:", height)
print("Is Student:", isStudent)
print("Favorite Colors:", favoriteColors)

// ===== MATHEMATICAL OPERATIONS =====

// Basic arithmetic
x = 10
y = 3
print("Addition:", x + y)
print("Subtraction:", x - y)
print("Multiplication:", x * y)
print("Division:", x / y)

// ===== WORKING WITH ARRAYS =====

// Array operations
numbers = [1, 2, 3, 4, 5]
print("Numbers array:", numbers)
print("Array length:", len(numbers))
print("First element:", numbers[0])
print("Last element:", numbers[4])

// Mixed data types in arrays
mixed = [42, "hello", true, 3.14]
print("Mixed array:", mixed)

// ===== STRING OPERATIONS =====

// String manipulation
greeting = "Hello"
target = "World"
message = greeting + ", " + target + "!"
print("Concatenated message:", message)

// String properties
text = "HackScript"
print("Text:", text)
print("Text length:", len(text))
print("Text type:", type(text))

// ===== TYPE CHECKING =====

// Check types of different values
print("Type of 42:", type(42))
print("Type of 3.14:", type(3.14))
print("Type of 'hello':", type("hello"))
print("Type of true:", type(true))
print("Type of [1,2,3]:", type([1, 2, 3]))
print("Type of null:", type(null))

// ===== PRACTICAL EXAMPLES =====

// Calculate area of a rectangle
length = 10
width = 5
area = length * width
print("Rectangle area:", area)

// Calculate circle circumference
radius = 7
pi = 3.14159
circumference = 2 * pi * radius
print("Circle circumference:", circumference)

// Work with a list of scores
scores = [85, 92, 78, 96, 88]
print("Test scores:", scores)
print("Number of tests:", len(scores))

// Simple data analysis
total = 85 + 92 + 78 + 96 + 88
average = total / len(scores)
print("Total points:", total)
print("Average score:", average)

// ===== BOOLEAN LOGIC =====

// Boolean values
isActive = true
isComplete = false
print("Active:", isActive)
print("Complete:", isComplete)

// Boolean expressions (simplified)
result1 = 5 > 3
result2 = 10 == 10
result3 = "hello" == "world"
print("5 > 3:", result1)
print("10 == 10:", result2)
print("hello == world:", result3)

print("Program completed successfully!")
