package com.powerestimator.ui;

import javax.swing.*;
import java.awt.*;

/**
 * Panel for code input with proper styling
 */
public class CodeInputPanel extends JPanel {
    private final JTextArea codeArea;
    
    public CodeInputPanel() {
        setLayout(new BorderLayout());
        setBorder(BorderFactory.createTitledBorder("Code Input (Paste Your Code Here)"));
        
        // Create text area with sample code
        codeArea = new JTextArea(10, 50);
        codeArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        codeArea.setText("// Paste your code here, example:\n" +
                        "int x = 5 + 3;\n" +
                        "if (x > 0) {\n" +
                        "    int[] arr = new int[10];\n" +
                        "    for (int i = 0; i < 10; i++) {\n" +
                        "        arr[i] = i * 2;\n" +
                        "    }\n" +
                        "}");
        
        // Add scroll pane
        JScrollPane scrollPane = new JScrollPane(codeArea);
        scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
        scrollPane.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED);
        
        add(scrollPane, BorderLayout.CENTER);
    }
    
    public String getCodeText() {
        return codeArea.getText();
    }
    
    public void setCodeText(String text) {
        codeArea.setText(text);
    }
    
    public void clearCode() {
        codeArea.setText("");
    }
}