package ui;
import models.User;
import services.UserService;
import javax.swing.*;
import java.awt.*;
public class RegisterFrame extends JFrame {
    private JTextField usernameField;
    private JPasswordField passwordField;
    private JPasswordField confirmPasswordField;
    private JTextField nameField;
    private JButton registerButton;
    private JButton backButton;
    private UserService userService;
    private LoginFrame loginFrame;
    public RegisterFrame(LoginFrame loginFrame) {
        this.loginFrame = loginFrame;
        userService = new UserService();
        initComponents();
    }
    private void initComponents() {
        setTitle("RENTAMOTO - Register");
        setSize(450, 450);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setResizable(false);
        JPanel mainPanel = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2d = (Graphics2D) g;
                g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                int w = getWidth(), h = getHeight();
                Color color1 = new Color(142, 68, 173);
                Color color2 = new Color(189, 126, 236);
                GradientPaint gp = new GradientPaint(0, 0, color1, 0, h, color2);
                g2d.setPaint(gp);
                g2d.fillRect(0, 0, w, h);
            }
        };
        mainPanel.setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        JPanel registerPanel = new JPanel();
        registerPanel.setLayout(new GridBagLayout());
        registerPanel.setBackground(Color.WHITE);
        registerPanel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(155, 89, 182), 2),
                BorderFactory.createEmptyBorder(20, 30, 20, 30)));
        GridBagConstraints rgbc = new GridBagConstraints();
        rgbc.insets = new Insets(8, 8, 8, 8);
        rgbc.fill = GridBagConstraints.HORIZONTAL;
        JLabel titleLabel = new JLabel("Create Account");
        titleLabel.setFont(new Font("Arial", Font.BOLD, 24));
        titleLabel.setForeground(new Color(142, 68, 173));
        rgbc.gridx = 0;
        rgbc.gridy = 0;
        rgbc.gridwidth = 2;
        rgbc.anchor = GridBagConstraints.CENTER;
        registerPanel.add(titleLabel, rgbc);
        rgbc.gridwidth = 1;
        rgbc.gridy = 1;
        rgbc.insets = new Insets(15, 8, 8, 8);
        rgbc.anchor = GridBagConstraints.WEST;
        JLabel nameLabel = new JLabel("Full Name:");
        nameLabel.setFont(new Font("Arial", Font.BOLD, 13));
        registerPanel.add(nameLabel, rgbc);
        nameField = new JTextField(20);
        nameField.setFont(new Font("Arial", Font.PLAIN, 13));
        nameField.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(189, 195, 199)),
                BorderFactory.createEmptyBorder(5, 5, 5, 5)));
        rgbc.gridx = 1;
        registerPanel.add(nameField, rgbc);
        rgbc.gridx = 0;
        rgbc.gridy = 2;
        rgbc.insets = new Insets(8, 8, 8, 8);
        JLabel usernameLabel = new JLabel("Username:");
        usernameLabel.setFont(new Font("Arial", Font.BOLD, 13));
        registerPanel.add(usernameLabel, rgbc);
        usernameField = new JTextField(20);
        usernameField.setFont(new Font("Arial", Font.PLAIN, 13));
        usernameField.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(189, 195, 199)),
                BorderFactory.createEmptyBorder(5, 5, 5, 5)));
        rgbc.gridx = 1;
        registerPanel.add(usernameField, rgbc);
        rgbc.gridx = 0;
        rgbc.gridy = 3;
        JLabel passwordLabel = new JLabel("Password:");
        passwordLabel.setFont(new Font("Arial", Font.BOLD, 13));
        registerPanel.add(passwordLabel, rgbc);
        passwordField = new JPasswordField(20);
        passwordField.setFont(new Font("Arial", Font.PLAIN, 13));
        passwordField.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(189, 195, 199)),
                BorderFactory.createEmptyBorder(5, 5, 5, 5)));
        rgbc.gridx = 1;
        registerPanel.add(passwordField, rgbc);
        rgbc.gridx = 0;
        rgbc.gridy = 4;
        JLabel confirmPasswordLabel = new JLabel("Confirm Password:");
        confirmPasswordLabel.setFont(new Font("Arial", Font.BOLD, 13));
        registerPanel.add(confirmPasswordLabel, rgbc);
        confirmPasswordField = new JPasswordField(20);
        confirmPasswordField.setFont(new Font("Arial", Font.PLAIN, 13));
        confirmPasswordField.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(189, 195, 199)),
                BorderFactory.createEmptyBorder(5, 5, 5, 5)));
        rgbc.gridx = 1;
        registerPanel.add(confirmPasswordField, rgbc);
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
        buttonPanel.setBackground(Color.WHITE);
        registerButton = new JButton("Register");
        registerButton.setFont(new Font("Arial", Font.BOLD, 13));
        registerButton.setBackground(new Color(14, 97, 243)); 
        registerButton.setForeground(Color.WHITE);
        registerButton.setFocusPainted(false);
        registerButton.setOpaque(true);
        registerButton.setBorderPainted(false);
        registerButton.setBorder(BorderFactory.createEmptyBorder(10, 20, 10, 20));
        registerButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        registerButton.addActionListener(e -> handleRegister());
        backButton = new JButton("Back to Login");
        backButton.setFont(new Font("Arial", Font.BOLD, 13));
        backButton.setBackground(new Color(94, 151, 214)); 
        backButton.setForeground(Color.WHITE);
        backButton.setFocusPainted(false);
        backButton.setOpaque(true);
        backButton.setBorderPainted(false);
        backButton.setBorder(BorderFactory.createEmptyBorder(10, 15, 10, 15));
        backButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        backButton.addActionListener(e -> backToLogin());
        buttonPanel.add(registerButton);
        buttonPanel.add(backButton);
        rgbc.gridx = 0;
        rgbc.gridy = 5;
        rgbc.gridwidth = 2;
        rgbc.insets = new Insets(15, 8, 8, 8);
        registerPanel.add(buttonPanel, rgbc);
        mainPanel.add(registerPanel, gbc);
        add(mainPanel);
    }
    private void handleRegister() {
        String name = nameField.getText().trim();
        String username = usernameField.getText().trim();
        String password = new String(passwordField.getPassword());
        String confirmPassword = new String(confirmPasswordField.getPassword());
        if (name.isEmpty() || username.isEmpty() || password.isEmpty()) {
            JOptionPane.showMessageDialog(this,
                    "Please fill in all fields.",
                    "Validation Error",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }
        if (username.length() < 3) {
            JOptionPane.showMessageDialog(this,
                    "Username must be at least 3 characters long.",
                    "Validation Error",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }
        if (password.length() < 4) {
            JOptionPane.showMessageDialog(this,
                    "Password must be at least 4 characters long.",
                    "Validation Error",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }
        if (!password.equals(confirmPassword)) {
            JOptionPane.showMessageDialog(this,
                    "Passwords do not match.",
                    "Validation Error",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }
        if (userService.usernameExists(username)) {
            JOptionPane.showMessageDialog(this,
                    "Username already exists. Please choose another.",
                    "Registration Error",
                    JOptionPane.ERROR_MESSAGE);
            return;
        }
        User newUser = new User(username, password, name, "user");
        boolean success = userService.registerUser(newUser);
        if (success) {
            JOptionPane.showMessageDialog(this,
                    "Registration successful! You can now login.",
                    "Success",
                    JOptionPane.INFORMATION_MESSAGE);
            backToLogin();
        } else {
            JOptionPane.showMessageDialog(this,
                    "Registration failed. Please try again.",
                    "Error",
                    JOptionPane.ERROR_MESSAGE);
        }
    }
    private void backToLogin() {
        loginFrame.setVisible(true);
        dispose();
    }
}