

import ui.LoginFrame;
import javax.swing.*;
public class Main {
    public static void main(String[] args) {
        System.out.println("===========================================");
        System.out.println("  RENTAMOTO - Bike Rental Management");
        System.out.println("===========================================");
        System.out.println("Starting application...\n");
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            System.err.println("Could not set Look and Feel: " + e.getMessage());
        }
        SwingUtilities.invokeLater(() -> {
            LoginFrame loginFrame = new LoginFrame();
            loginFrame.setVisible(true);
            System.out.println("✅ Application launched successfully!");
            System.out.println("\nDefault Login Credentials:");
            System.out.println("  Admin      - Username: admin, Password: admin123");
            System.out.println("  Customer 1 - Username: user1, Password: pass123");
            System.out.println("  Customer 2 - Username: user2, Password: pass123");
            System.out.println("===========================================\n");
        });
    }
}