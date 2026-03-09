package com.powerestimator;

import com.powerestimator.ui.MainWindow;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.JOptionPane;

/**
 * Main entry point for the CPU Power Estimator application
 */
public class PowerEstimatorApp {
    
    public static void main(String[] args) {
        // Check if JFreeChart is available
        if (!checkJFreeChartAvailability()) {
            showJFreeChartMissingDialog();
            System.exit(1);
        }
        
        // Set system look and feel
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            // Fall back to default look and feel
            System.out.println("Could not set system look and feel, using default.");
        }
        
        // Launch the application on the Event Dispatch Thread
        SwingUtilities.invokeLater(() -> {
            new MainWindow().setVisible(true);
        });
    }
    
    /**
     * Checks if JFreeChart library is available
     */
    private static boolean checkJFreeChartAvailability() {
        try {
            Class.forName("org.jfree.chart.ChartFactory");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
    
    /**
     * Shows error dialog if JFreeChart is missing
     */
    private static void showJFreeChartMissingDialog() {
        JOptionPane.showMessageDialog(null,
            "JFreeChart library not found!\n\n" +
            "Please add JFreeChart JAR files to the lib/ directory:\n" +
            "- jfreechart-1.5.x.jar\n" +
            "- jcommon-1.0.x.jar\n\n" +
            "Download from: https://www.jfree.org/jfreechart/",
            "Missing Library",
            JOptionPane.ERROR_MESSAGE);
    }
}