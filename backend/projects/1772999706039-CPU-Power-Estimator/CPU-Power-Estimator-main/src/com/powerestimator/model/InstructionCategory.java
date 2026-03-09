package com.powerestimator.model;

/**
 * Categories for different types of CPU instructions
 */
public enum InstructionCategory {
    ARITHMETIC,  // +, -, *, /, %, math operations
    MEMORY,      // array access, new, memory allocation
    BRANCH,      // if, else, switch, case
    CONTROL,     // for, while, do, break, continue, return
    LOGICAL,     // &&, ||, !, ^, &, |
    UNKNOWN      // unrecognized instructions
}