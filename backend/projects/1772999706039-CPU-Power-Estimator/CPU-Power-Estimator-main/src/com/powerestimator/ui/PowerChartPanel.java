package com.powerestimator.ui;

import com.powerestimator.model.ParsedInstruction;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartPanel;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.data.category.DefaultCategoryDataset;

import javax.swing.*;
import java.awt.*;
import java.util.List;

/**
 * Component for displaying animated power consumption chart
 */
public class PowerChartPanel extends JPanel {
    private JFrame chartFrame;
    private DefaultCategoryDataset dataset;
    private String cpuModel;
    
    public PowerChartPanel() {
        // This panel can be used for chart controls if needed
        setLayout(new FlowLayout());
    }
    
    public void createChart(String cpuModel) {
        this.cpuModel = cpuModel;
        this.dataset = new DefaultCategoryDataset();
        
        JFreeChart chart = ChartFactory.createBarChart(
            "Power Usage for Each Instruction (" + cpuModel + " CPU)",
            "Instruction Number",
            "Power (mW)",
            dataset,
            PlotOrientation.VERTICAL,
            false, true, false
        );
        
        CategoryPlot plot = chart.getCategoryPlot();
        plot.setBackgroundPaint(Color.WHITE);
        
        org.jfree.chart.ChartPanel chartPanel = new org.jfree.chart.ChartPanel(chart);
        chartPanel.setPreferredSize(new Dimension(700, 500));
        
        chartFrame = new JFrame("Power Chart - " + cpuModel + " CPU");
        chartFrame.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        chartFrame.add(chartPanel);
        chartFrame.pack();
        chartFrame.setLocation(200, 50);
        chartFrame.setVisible(true);
    }
    
    public void addDataPoint(int step, double power) {
        if (dataset != null) {
            String stepName = "Step " + step;
            dataset.addValue(power, "Power", stepName);
            updateColors();
        }
    }
    
    private void updateColors() {
        if (chartFrame == null) return;
        
        org.jfree.chart.ChartPanel chartPanel = 
            (org.jfree.chart.ChartPanel) chartFrame.getContentPane().getComponent(0);
        JFreeChart chart = chartPanel.getChart();
        CategoryPlot plot = chart.getCategoryPlot();
        BarRenderer renderer = (BarRenderer) plot.getRenderer();
        
        for (int i = 0; i < dataset.getColumnCount(); i++) {
            Number value = dataset.getValue(0, i);
            if (value != null) {
                double power = value.doubleValue();
                Color color = getPowerColor(power);
                renderer.setSeriesPaint(i, color);
            }
        }
    }
    
    private Color getPowerColor(double power) {
        if (power <= 3.0) {
            return new Color(34, 139, 34); // Green - Low power
        } else if (power <= 5.0) {
            return new Color(255, 215, 0); // Yellow - Medium power
        } else {
            return new Color(220, 20, 60); // Red - High power
        }
    }
    
    public void closeChart() {
        if (chartFrame != null) {
            chartFrame.dispose();
            chartFrame = null;
        }
    }
    
    public boolean isChartVisible() {
        return chartFrame != null && chartFrame.isVisible();
    }
}