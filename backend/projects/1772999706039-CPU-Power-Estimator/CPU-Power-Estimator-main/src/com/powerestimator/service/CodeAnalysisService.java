package com.powerestimator.service;

import com.powerestimator.model.InstructionCategory;
import com.powerestimator.model.ParsedInstruction;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for analyzing code and categorizing instructions
 */
public class CodeAnalysisService {
    
    /**
     * Analyzes code text and returns list of parsed instructions
     */
    public List<ParsedInstruction> analyzeCode(String codeText) {
        List<ParsedInstruction> instructions = new ArrayList<>();
        
        if (codeText == null || codeText.trim().isEmpty()) {
            return instructions;
        }
        
        String[] lines = codeText.split("\n");
        
        for (String line : lines) {
            line = line.trim();
            
            // Skip empty lines and comments
            if (line.isEmpty() || line.startsWith("//") || 
                line.startsWith("/*") || line.startsWith("*")) {
                continue;
            }
            
            InstructionCategory category = categorizeInstruction(line);
            ParsedInstruction instruction = new ParsedInstruction(line, category);
            instructions.add(instruction);
        }
        
        return instructions;
    }
    
    /**
     * Categorizes a single line of code into an instruction category
     */
    private InstructionCategory categorizeInstruction(String line) {
        String lower = line.toLowerCase();
        
        // ARITHMETIC: +, -, *, /, %, math operations
        if (lower.matches(".*[+\\-*/%]=.*") || 
            lower.matches(".*=.*[+\\-*/%].*") ||
            lower.contains("math.") ||
            lower.matches(".*\\+\\+.*") ||
            lower.matches(".*--.*")) {
            return InstructionCategory.ARITHMETIC;
        }
        
        // LOGICAL: &&, ||, !, ^, &, |
        if (lower.contains("&&") || lower.contains("||") || 
            lower.matches(".*[&|^].*") ||
            lower.matches(".*!.*")) {
            return InstructionCategory.LOGICAL;
        }
        
        // BRANCH: if, else, switch, case
        if (lower.matches("^(if|else|switch|case|default).*")) {
            return InstructionCategory.BRANCH;
        }
        
        // CONTROL: for, while, do, break, continue, return
        if (lower.matches("^(for|while|do|break|continue|return).*")) {
            return InstructionCategory.CONTROL;
        }
        
        // MEMORY: array access [], new, memory allocation
        if (lower.contains("[") || lower.contains("new ") || 
            lower.contains("malloc") || lower.contains("free")) {
            return InstructionCategory.MEMORY;
        }
        
        // Default: UNKNOWN
        return InstructionCategory.UNKNOWN;
    }
}