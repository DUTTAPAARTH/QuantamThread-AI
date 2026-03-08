package ui;
import models.User;
import services.UserService;
import javax.swing.*;
import java.awt.*;
public class LoginFrame extends JFrame {
    private JTextField usernameField;
    private JPasswordField passwordField;
    private JButton loginButton;
    private JButton registerButton;
    private UserService userService;
    public LoginFrame() {
        userService = new UserService();
        initComponents();
    }
    private void initComponents() {
        setTitle("RENTAMOTO - Login");
        setSize(450, 350);
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
                Color color1 = new Color(41, 128, 185);
                Color color2 = new Color(109, 213, 250);
                GradientPaint gp = new GradientPaint(0, 0, color1, 0, h, color2);
                g2d.setPaint(gp);
                g2d.fillRect(0, 0, w, h);
            }
        };
        mainPanel.setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        JPanel loginPanel = new JPanel();
        loginPanel.setLayout(new GridBagLayout());
        loginPanel.setBackground(Color.WHITE);
        loginPanel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(52, 152, 219), 2),
                BorderFactory.createEmptyBorder(20, 30, 20, 30)));
        GridBagConstraints lgbc = new GridBagConstraints();
        lgbc.insets = new Insets(8, 8, 8, 8);
        lgbc.fill = GridBagConstraints.HORIZONTAL;
        JLabel titleLabel = new JLabel("🚴 RENTAMOTO");
        titleLabel.setFont(new Font("Arial", Font.BOLD, 28));
        titleLabel.setForeground(new Color(41, 128, 185));
        lgbc.gridx = 0;
        lgbc.gridy = 0;
        lgbc.gridwidth = 2;
        lgbc.anchor = GridBagConstraints.CENTER;
        loginPanel.add(titleLabel, lgbc);
        JLabel subtitleLabel = new JLabel("Bike Rental System");
        subtitleLabel.setFont(new Font("Arial", Font.PLAIN, 14));
        subtitleLabel.setForeground(Color.GRAY);
        lgbc.gridy = 1;
        lgbc.insets = new Insets(0, 8, 15, 8);
        loginPanel.add(subtitleLabel, lgbc);
        lgbc.gridwidth = 1;
        lgbc.gridy = 2;
        lgbc.insets = new Insets(8, 8, 8, 8);
        lgbc.anchor = GridBagConstraints.WEST;
        JLabel usernameLabel = new JLabel("Username:");
        usernameLabel.setFont(new Font("Arial", Font.BOLD, 13));
        loginPanel.add(usernameLabel, lgbc);
        usernameField = new JTextField(20);
        usernameField.setFont(new Font("Arial", Font.PLAIN, 13));
        usernameField.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(189, 195, 199)),
                BorderFactory.createEmptyBorder(5, 5, 5, 5)));
        lgbc.gridx = 1;
        loginPanel.add(usernameField, lgbc);
        lgbc.gridx = 0;
        lgbc.gridy = 3;
        JLabel passwordLabel = new JLabel("Password:");
        passwordLabel.setFont(new Font("Arial", Font.BOLD, 13));
        loginPanel.add(passwordLabel, lgbc);
        passwordField = new JPasswordField(20);
        passwordField.setFont(new Font("Arial", Font.PLAIN, 13));
        passwordField.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(189, 195, 199)),
                BorderFactory.createEmptyBorder(5, 5, 5, 5)));
        lgbc.gridx = 1;
        loginPanel.add(passwordField, lgbc);
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
        buttonPanel.setBackground(Color.WHITE);
        loginButton = new JButton("Login");
        loginButton.setFont(new Font("Arial", Font.BOLD, 13));
        loginButton.setBackground(new Color(14, 97, 243)); 
        loginButton.setForeground(Color.WHITE);
        loginButton.setFocusPainted(false);
        loginButton.setOpaque(true);
        loginButton.setBorderPainted(false);
        loginButton.setBorder(BorderFactory.createEmptyBorder(10, 25, 10, 25));
        loginButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        loginButton.addActionListener(e -> handleLogin());
        registerButton = new JButton("Register");
        registerButton.setFont(new Font("Arial", Font.BOLD, 13));
        registerButton.setBackground(new Color(94, 151, 214)); 
        registerButton.setForeground(Color.WHITE);
        registerButton.setFocusPainted(false);
        registerButton.setOpaque(true);
        registerButton.setBorderPainted(false);
        registerButton.setBorder(BorderFactory.createEmptyBorder(10, 20, 10, 20));
        registerButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        registerButton.addActionListener(e -> openRegisterFrame());
        buttonPanel.add(loginButton);
        buttonPanel.add(registerButton);
        lgbc.gridx = 0;
        lgbc.gridy = 4;
        lgbc.gridwidth = 2;
        lgbc.insets = new Insets(15, 8, 8, 8);
        loginPanel.add(buttonPanel, lgbc);
        mainPanel.add(loginPanel, gbc);
        add(mainPanel);
        passwordField.addActionListener(e -> handleLogin());
    }
    private void handleLogin() {
        String username = usernameField.getText().trim();
        String password = new String(passwordField.getPassword());
        if (username.isEmpty() || password.isEmpty()) {
            JOptionPane.showMessageDialog(this,
                    "Please enter both username and password.",
                    "Validation Error",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }
        User user = userService.login(username, password);
        if (user != null) {
            JOptionPane.showMessageDialog(this,
                    "Welcome, " + user.getName() + "!",
                    "Login Successful",
                    JOptionPane.INFORMATION_MESSAGE);
            Dashboard dashboard = new Dashboard(user);
            dashboard.setVisible(true);
            dispose();
        } else {
            JOptionPane.showMessageDialog(this,
                    "Invalid username or password.",
                    "Login Failed",
                    JOptionPane.ERROR_MESSAGE);
            passwordField.setText("");
        }
    }
    private void openRegisterFrame() {
        RegisterFrame registerFrame = new RegisterFrame(this);
        registerFrame.setVisible(true);
        setVisible(false);
    }
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e) {
                e.printStackTrace();
            }
            new LoginFrame().setVisible(true);
        });
    }
}