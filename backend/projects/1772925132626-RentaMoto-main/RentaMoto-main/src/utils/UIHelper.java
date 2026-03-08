package utils;
import javax.swing.*;
import java.awt.*;
public class UIHelper {
    public static void styleButton(JButton button, Color backgroundColor, Color foregroundColor) {
        button.setBackground(backgroundColor);
        button.setForeground(foregroundColor);
        button.setFocusPainted(false);
        button.setOpaque(true);
        button.setBorderPainted(false);
        button.setCursor(new Cursor(Cursor.HAND_CURSOR));
    }
    public static void styleButton(JButton button, Color backgroundColor, Color foregroundColor, int padding) {
        styleButton(button, backgroundColor, foregroundColor);
        button.setBorder(BorderFactory.createEmptyBorder(padding, padding * 2, padding, padding * 2));
    }
    public static JButton createStyledButton(String text, Color backgroundColor, int fontSize) {
        JButton button = new JButton(text);
        button.setFont(new Font("Arial", Font.BOLD, fontSize));
        styleButton(button, backgroundColor, Color.WHITE, 10);
        return button;
    }
}