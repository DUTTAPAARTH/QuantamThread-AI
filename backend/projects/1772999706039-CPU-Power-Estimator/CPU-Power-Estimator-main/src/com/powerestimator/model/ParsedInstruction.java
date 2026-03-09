package com.powerestimator.model;

/**
 * Represents a single parsed instruction with its category and power consumption
 */
public class ParsedInstruction {
    private final String rawLine;
    private final InstructionCategory category;
    private double power;
    private double executionTime;
    
    public ParsedInstruction(String rawLine, InstructionCategory category) {
        this.rawLine = rawLine;
        this.category = category;
        this.power = 0.0;
        this.executionTime = 0.0;
    }
    
    // Getters
    public String getRawLine() { return rawLine; }
    public InstructionCategory getCategory() { return category; }
    public double getPower() { return power; }
    public double getExecutionTime() { return executionTime; }
    
    // Setters
    public void setPower(double power) { this.power = power; }
    public void setExecutionTime(double executionTime) { this.executionTime = executionTime; }
    
    @Override
    public String toString() {
        return String.format("[%s] %.2f mW - %s", 
            category, power, 
            rawLine.length() > 50 ? rawLine.substring(0, 47) + "..." : rawLine);
    }
}