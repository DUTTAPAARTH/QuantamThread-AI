package com.powerestimator.service;

import com.powerestimator.model.CPUProfile;
import com.powerestimator.model.InstructionCategory;
import com.powerestimator.model.ParsedInstruction;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for calculating power consumption and generating reports
 */
public class PowerCalculationService {
    
    /**
     * Calculates power and timing for each instruction based on CPU profile
     */
    public void calculatePowerForInstructions(List<ParsedInstruction> instructions, CPUProfile cpuProfile) {
        for (ParsedInstruction instruction : instructions) {
            double power = cpuProfile.getPowerForCategory(instruction.getCategory());
            double time = cpuProfile.getTimeForCategory(instruction.getCategory());
            
            instruction.setPower(power);
            instruction.setExecutionTime(time);
        }
    }
    
    /**
     * Calculates total power consumption
     */
    public double calculateTotalPower(List<ParsedInstruction> instructions) {
        return instructions.stream()
                .mapToDouble(ParsedInstruction::getPower)
                .sum();
    }
    
    /**
     * Calculates average power consumption
     */
    public double calculateAveragePower(List<ParsedInstruction> instructions) {
        if (instructions.isEmpty()) return 0.0;
        return calculateTotalPower(instructions) / instructions.size();
    }
    
    /**
     * Calculates total execution time
     */
    public double calculateTotalTime(List<ParsedInstruction> instructions) {
        return instructions.stream()
                .mapToDouble(ParsedInstruction::getExecutionTime)
                .sum();
    }
    
    /**
     * Calculates total energy consumption (power * time)
     */
    public double calculateTotalEnergy(List<ParsedInstruction> instructions) {
        return instructions.stream()
                .mapToDouble(i -> i.getPower() * i.getExecutionTime())
                .sum();
    }
    
    /**
     * Counts instructions by category
     */
    public Map<InstructionCategory, Integer> countInstructionsByCategory(List<ParsedInstruction> instructions) {
        Map<InstructionCategory, Integer> categoryCount = new HashMap<>();
        
        for (ParsedInstruction instruction : instructions) {
            InstructionCategory category = instruction.getCategory();
            categoryCount.put(category, categoryCount.getOrDefault(category, 0) + 1);
        }
        
        return categoryCount;
    }
    
    /**
     * Saves analysis report to file
     */
    public void saveReport(List<ParsedInstruction> instructions, CPUProfile cpuProfile, String filename) throws IOException {
        double totalPower = calculateTotalPower(instructions);
        double avgPower = calculateAveragePower(instructions);
        double totalTime = calculateTotalTime(instructions);
        double totalEnergy = calculateTotalEnergy(instructions);
        Map<InstructionCategory, Integer> categoryCount = countInstructionsByCategory(instructions);
        
        try (PrintWriter pw = new PrintWriter(new FileWriter(filename))) {
            pw.println("=== CPU POWER ANALYSIS REPORT ===");
            pw.println("Generated: " + new Date());
            pw.println();
            pw.println("CPU Model: " + cpuProfile.getName());
            pw.println("Total Instructions: " + instructions.size());
            pw.println();
            pw.println("POWER METRICS:");
            pw.printf("  Total Power: %.2f mW\n", totalPower);
            pw.printf("  Average Power: %.2f mW\n", avgPower);
            pw.printf("  Total Time: %.2f ns\n", totalTime);
            pw.printf("  Total Energy: %.2f pJ\n", totalEnergy);
            pw.println();
            pw.println("INSTRUCTION BREAKDOWN:");
            for (InstructionCategory cat : InstructionCategory.values()) {
                int count = categoryCount.getOrDefault(cat, 0);
                if (count > 0) {
                    pw.printf("  %s: %d instructions\n", cat, count);
                }
            }
            pw.println();
            pw.println("DETAILED INSTRUCTION LIST:");
            for (int i = 0; i < instructions.size(); i++) {
                ParsedInstruction instr = instructions.get(i);
                pw.printf("%d. [%s] Power=%.2f mW, Time=%.2f ns - %s\n",
                    i + 1, instr.getCategory(), instr.getPower(), instr.getExecutionTime(),
                    instr.getRawLine().length() > 50 ? 
                        instr.getRawLine().substring(0, 47) + "..." : instr.getRawLine());
            }
        }
    }
}