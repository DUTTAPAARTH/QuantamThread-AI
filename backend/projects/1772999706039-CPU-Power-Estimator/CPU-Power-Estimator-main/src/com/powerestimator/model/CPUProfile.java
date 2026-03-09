package com.powerestimator.model;

import java.util.HashMap;
import java.util.Map;

/**
 * CPU power profiles for different CPU types
 */
public class CPUProfile {
    private final String name;
    private final Map<InstructionCategory, Double> powerMap;
    private final Map<InstructionCategory, Double> timeMap;
    
    public CPUProfile(String name) {
        this.name = name;
        this.powerMap = new HashMap<>();
        this.timeMap = new HashMap<>();
        initializeDefaultTimes();
    }
    
    private void initializeDefaultTimes() {
        timeMap.put(InstructionCategory.ARITHMETIC, 2.0);
        timeMap.put(InstructionCategory.LOGICAL, 1.5);
        timeMap.put(InstructionCategory.MEMORY, 3.5);
        timeMap.put(InstructionCategory.CONTROL, 1.0);
        timeMap.put(InstructionCategory.BRANCH, 2.5);
        timeMap.put(InstructionCategory.UNKNOWN, 1.8);
    }
    
    public void setPowerForCategory(InstructionCategory category, double power) {
        powerMap.put(category, power);
    }
    
    public double getPowerForCategory(InstructionCategory category) {
        return powerMap.getOrDefault(category, 2.0);
    }
    
    public double getTimeForCategory(InstructionCategory category) {
        return timeMap.getOrDefault(category, 2.0);
    }
    
    public String getName() {
        return name;
    }
    
    @Override
    public String toString() {
        return name;
    }
    
    // Factory methods for creating standard CPU profiles
    public static CPUProfile createBasicProfile() {
        CPUProfile profile = new CPUProfile("Basic");
        profile.setPowerForCategory(InstructionCategory.ARITHMETIC, 3.5);
        profile.setPowerForCategory(InstructionCategory.LOGICAL, 2.5);
        profile.setPowerForCategory(InstructionCategory.MEMORY, 5.0);
        profile.setPowerForCategory(InstructionCategory.CONTROL, 1.8);
        profile.setPowerForCategory(InstructionCategory.BRANCH, 2.8);
        profile.setPowerForCategory(InstructionCategory.UNKNOWN, 2.0);
        return profile;
    }
    
    public static CPUProfile createHighPerformanceProfile() {
        CPUProfile profile = new CPUProfile("High Performance");
        profile.setPowerForCategory(InstructionCategory.ARITHMETIC, 5.0);
        profile.setPowerForCategory(InstructionCategory.LOGICAL, 4.0);
        profile.setPowerForCategory(InstructionCategory.MEMORY, 6.5);
        profile.setPowerForCategory(InstructionCategory.CONTROL, 2.5);
        profile.setPowerForCategory(InstructionCategory.BRANCH, 4.2);
        profile.setPowerForCategory(InstructionCategory.UNKNOWN, 3.5);
        return profile;
    }
    
    public static CPUProfile createLowPowerProfile() {
        CPUProfile profile = new CPUProfile("Low Power");
        profile.setPowerForCategory(InstructionCategory.ARITHMETIC, 2.2);
        profile.setPowerForCategory(InstructionCategory.LOGICAL, 1.6);
        profile.setPowerForCategory(InstructionCategory.MEMORY, 3.8);
        profile.setPowerForCategory(InstructionCategory.CONTROL, 1.0);
        profile.setPowerForCategory(InstructionCategory.BRANCH, 1.8);
        profile.setPowerForCategory(InstructionCategory.UNKNOWN, 1.5);
        return profile;
    }
}