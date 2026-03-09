package com.powerestimator.ui;

import com.powerestimator.model.CPUProfile;
import com.powerestimator.model.ParsedInstruction;
import com.powerestimator.service.CodeAnalysisService;
import com.powerestimator.service.PowerCalculationService;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.IOException;
import java.util.List;

/**
 * Main window of the Power Estimator application
 */
public class MainWindow extends JFrame {
    private CodeInputPanel codeInputPanel;
    private JTextArea outputArea;
    private JComboBox<CPUProfile> cpuComboBox;
    private JButton analyzeButton, animateButton, clearButton;
    private PowerChartPanel chartPanel;
    
    private CodeAnalysisService analysisService;
    private PowerCalculationService powerService;
    private List<ParsedInstruction> currentInstructions;
    private Timer animationTimer;
    private int currentAnimationStep;
    
    public MainWindow() {
        // Initialize services
        analysisService = new CodeAnalysisService();
        powerService = new PowerCalculationService();
        
        setupWindow();
        setupComponents();
        setupLayout();
        setupEventHandlers();
    }
    
    private void setupWindow() {
        setTitle("CPU Power Usage Analyzer");
        setSize(1000, 700);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
    }
    
    private void setupComponents() {
        // Code input panel
        codeInputPanel = new CodeInputPanel();
        
        // Output area
        outputArea = new JTextArea();
        outputArea.setEditable(false);
        outputArea.setFont(new Font("Monospaced", Font.PLAIN, 11));
        
        // CPU selection
        CPUProfile[] profiles = {
            CPUProfile.createBasicProfile(),
            CPUProfile.createHighPerformanceProfile(),
            CPUProfile.createLowPowerProfile()
        };
        cpuComboBox = new JComboBox<>(profiles);
        
        // Buttons
        analyzeButton = new JButton("Analyze Code");
        animateButton = new JButton("Start Animation");
        clearButton = new JButton("Clear All");
        
        animateButton.setEnabled(false);
        
        // Chart panel
        chartPanel = new PowerChartPanel();
    }
    
    private void setupLayout() {
        setLayout(new BorderLayout(10, 10));
        
        // Control panel
        JPanel controlPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 5));
        controlPanel.setBorder(BorderFactory.createTitledBorder("Control Panel"));
        
        controlPanel.add(new JLabel("CPU Model:"));
        controlPanel.add(cpuComboBox);
        controlPanel.add(analyzeButton);
        controlPanel.add(animateButton);
        controlPanel.add(clearButton);
        
        // Top panel (code input + controls)
        JPanel topPanel = new JPanel(new BorderLayout());
        topPanel.add(codeInputPanel, BorderLayout.CENTER);
        topPanel.add(controlPanel, BorderLayout.SOUTH);
        
        // Main layout
        add(topPanel, BorderLayout.NORTH);
        add(new JScrollPane(outputArea), BorderLayout.CENTER);
    }
    
    private void setupEventHandlers() {
        analyzeButton.addActionListener(e -> analyzeCode());
        animateButton.addActionListener(e -> startAnimation());
        clearButton.addActionListener(e -> clearAll());
    }
    
    private void analyzeCode() {
        String code = codeInputPanel.getCodeText();
        currentInstructions = analysisService.analyzeCode(code);
        
        outputArea.setText("=== ANALYZING YOUR CODE ===\n\n");
        
        if (currentInstructions.isEmpty()) {
            outputArea.append("No valid instructions found. Please enter some code.\n");
            animateButton.setEnabled(false);
            return;
        }
        
        // Display analysis results
        for (int i = 0; i < currentInstructions.size(); i++) {
            ParsedInstruction instr = currentInstructions.get(i);
            outputArea.append(String.format("Line %d: [%s] %s\n", 
                i + 1, instr.getCategory(),
                instr.getRawLine().length() > 60 ? 
                    instr.getRawLine().substring(0, 57) + "..." : instr.getRawLine()));
        }
        
        outputArea.append(String.format("\n✓ Found %d instructions!\n", currentInstructions.size()));
        outputArea.append("Click 'Start Animation' to see power usage.\n");
        
        animateButton.setEnabled(true);
    }
    
    private void startAnimation() {
        if (currentInstructions == null || currentInstructions.isEmpty()) {
            JOptionPane.showMessageDialog(this, "No instructions to animate!", 
                "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        
        CPUProfile selectedProfile = (CPUProfile) cpuComboBox.getSelectedItem();
        
        // Calculate power for all instructions
        powerService.calculatePowerForInstructions(currentInstructions, selectedProfile);
        
        // Setup animation
        currentAnimationStep = 0;
        chartPanel.createChart(selectedProfile.getName());
        
        outputArea.append("\n=== STARTING ANIMATED SIMULATION ===\n");
        outputArea.append(String.format("CPU Model: %s\n", selectedProfile.getName()));
        outputArea.append(String.format("Total Instructions: %d\n\n", currentInstructions.size()));
        
        // Disable controls during animation
        analyzeButton.setEnabled(false);
        animateButton.setEnabled(false);
        cpuComboBox.setEnabled(false);
        
        // Start animation timer (500ms per step)
        animationTimer = new Timer(500, new AnimationHandler());
        animationTimer.start();
    }
    
    private class AnimationHandler implements ActionListener {
        @Override
        public void actionPerformed(ActionEvent e) {
            if (currentAnimationStep >= currentInstructions.size()) {
                animationTimer.stop();
                finishAnimation();
                return;
            }
            
            ParsedInstruction instr = currentInstructions.get(currentAnimationStep);
            
            // Update output
            outputArea.append(String.format("Step %d: [%s] Power=%.2f mW\n",
                currentAnimationStep + 1, instr.getCategory(), instr.getPower()));
            
            // Update chart
            chartPanel.addDataPoint(currentAnimationStep + 1, instr.getPower());
            
            currentAnimationStep++;
        }
    }
    
    private void finishAnimation() {
        outputArea.append("\n=== ANIMATION COMPLETE ===\n");
        
        CPUProfile selectedProfile = (CPUProfile) cpuComboBox.getSelectedItem();
        
        // Calculate final statistics
        double totalPower = powerService.calculateTotalPower(currentInstructions);
        double avgPower = powerService.calculateAveragePower(currentInstructions);
        double totalTime = powerService.calculateTotalTime(currentInstructions);
        double totalEnergy = powerService.calculateTotalEnergy(currentInstructions);
        
        outputArea.append(String.format("Total Instructions: %d\n", currentInstructions.size()));
        outputArea.append(String.format("Total Power: %.2f mW\n", totalPower));
        outputArea.append(String.format("Average Power: %.2f mW\n", avgPower));
        outputArea.append(String.format("Total Time: %.2f ns\n", totalTime));
        outputArea.append(String.format("Total Energy: %.2f pJ\n\n", totalEnergy));
        
        // Save report
        try {
            powerService.saveReport(currentInstructions, selectedProfile, "PowerAnalysisReport.txt");
            outputArea.append("✓ Report saved as PowerAnalysisReport.txt\n");
            JOptionPane.showMessageDialog(this, 
                "Animation complete!\nReport saved as PowerAnalysisReport.txt",
                "Success", JOptionPane.INFORMATION_MESSAGE);
        } catch (IOException ex) {
            JOptionPane.showMessageDialog(this, 
                "Error saving report: " + ex.getMessage(),
                "Error", JOptionPane.ERROR_MESSAGE);
        }
        
        // Re-enable controls
        analyzeButton.setEnabled(true);
        animateButton.setEnabled(true);
        cpuComboBox.setEnabled(true);
    }
    
    private void clearAll() {
        codeInputPanel.clearCode();
        outputArea.setText("");
        currentInstructions = null;
        animateButton.setEnabled(false);
        
        if (animationTimer != null && animationTimer.isRunning()) {
            animationTimer.stop();
        }
        
        chartPanel.closeChart();
        
        // Re-enable controls
        analyzeButton.setEnabled(true);
        cpuComboBox.setEnabled(true);
    }
}