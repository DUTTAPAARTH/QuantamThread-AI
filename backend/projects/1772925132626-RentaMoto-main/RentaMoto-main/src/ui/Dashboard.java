package ui;
import models.User;
import javax.swing.*;
import java.awt.*;
public class Dashboard extends JFrame {
    private User currentUser;
    private JPanel contentPanel;
    private CardLayout cardLayout;
    public Dashboard(User user) {
        this.currentUser = user;
        initComponents();
    }
    private void initComponents() {
        setTitle("RENTAMOTO - Dashboard");
        setSize(1000, 650);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        JPanel mainContainer = new JPanel(new BorderLayout());
        JPanel topBar = createTopBar();
        mainContainer.add(topBar, BorderLayout.NORTH);
        JPanel sidebar = createSidebar();
        mainContainer.add(sidebar, BorderLayout.WEST);
        cardLayout = new CardLayout();
        contentPanel = new JPanel(cardLayout);
        contentPanel.setBackground(Color.WHITE);
        contentPanel.add(createHomePanel(), "HOME");
        contentPanel.add(new BikeListPanel(currentUser), "BIKES");
        contentPanel.add(new RentBikePanel(currentUser), "RENT");
        contentPanel.add(new ReturnBikePanel(currentUser), "RETURN");
        if (currentUser.isAdmin()) {
            contentPanel.add(new BikeManagementPanel(), "MANAGE");
            contentPanel.add(new ReportsPanel(), "REPORTS");
        }
        mainContainer.add(contentPanel, BorderLayout.CENTER);
        add(mainContainer);
        cardLayout.show(contentPanel, "HOME");
    }
    private JPanel createTopBar() {
        JPanel topBar = new JPanel(new BorderLayout());
        topBar.setBackground(new Color(30, 115, 190)); // Updated blueSystem.out.println("System.out.println("");");
        topBar.setPreferredSize(new Dimension(0, 60));
        topBar.setBorder(BorderFactory.createEmptyBorder(10, 20, 10, 20));

        JLabel titleLabel = new JLabel("🚴 RENTAMOTO");
        titleLabel.setFont(new Font("Arial", Font.BOLD, 24));
        titleLabel.setForeground(Color.WHITE);
        topBar.add(titleLabel, BorderLayout.WEST);

        JPanel userPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        userPanel.setOpaque(false);

        JLabel userLabel = new JLabel("Welcome, " + currentUser.getName());
        userLabel.setFont(new Font("Arial", Font.PLAIN, 14));
        userLabel.setForeground(Color.WHITE);
        userPanel.add(userLabel);

        JLabel roleLabel = new JLabel(" [" + currentUser.getRole().toUpperCase() + "]");
        roleLabel.setFont(new Font("Arial", Font.BOLD, 12));
        roleLabel.setForeground(new Color(255, 215, 0));
        userPanel.add(roleLabel);

        JButton logoutButton = new JButton("Logout");
        logoutButton.setFont(new Font("Arial", Font.BOLD, 12));
        logoutButton.setBackground(new Color(139, 69, 19)); // Brown color
        logoutButton.setForeground(Color.WHITE);
        logoutButton.setFocusPainted(false);
        logoutButton.setOpaque(true);
        logoutButton.setBorderPainted(false);
        logoutButton.setBorder(BorderFactory.createEmptyBorder(8, 15, 8, 15));
        logoutButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        logoutButton.addActionListener(e -> logout());
        userPanel.add(logoutButton);

        topBar.add(userPanel, BorderLayout.EAST);
        return topBar;
    }
    private JPanel createSidebar() {
        JPanel sidebar = new JPanel();
        sidebar.setLayout(new BoxLayout(sidebar, BoxLayout.Y_AXIS));
        sidebar.setBackground(new Color(101, 67, 33)); // Brown color for sidebar
        sidebar.setPreferredSize(new Dimension(220, 0));
        sidebar.setBorder(BorderFactory.createEmptyBorder(20, 10, 20, 10));

        addMenuButton(sidebar, "🏠 Home", "HOME");
        addMenuButton(sidebar, "🚲 View Bikes", "BIKES");
        addMenuButton(sidebar, "🎫 Rent a Bike", "RENT");
        addMenuButton(sidebar, "↩️ Return Bike", "RETURN");

        if (currentUser.isAdmin()) {
            sidebar.add(Box.createRigidArea(new Dimension(0, 20)));
            JLabel adminLabel = new JLabel("ADMIN SECTION");
            adminLabel.setFont(new Font("Arial", Font.BOLD, 11));
            adminLabel.setForeground(new Color(255, 215, 0));
            adminLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
            sidebar.add(adminLabel);
            sidebar.add(Box.createRigidArea(new Dimension(0, 10)));
            addMenuButton(sidebar, "⚙️ Manage Bikes", "MANAGE");
            addMenuButton(sidebar, "📊 Reports", "REPORTS");
        }

        sidebar.add(Box.createVerticalGlue());
        return sidebar;
    }
    private void addMenuButton(JPanel sidebar, String text, String panelName) {
        JButton button = new JButton(text);
        button.setFont(new Font("Arial", Font.BOLD, 14));
        button.setForeground(Color.WHITE);
        button.setBackground(new Color(30, 115, 190)); // Blue color for buttons
        button.setFocusPainted(false);
        button.setOpaque(true);
        button.setBorderPainted(false);
        button.setAlignmentX(Component.CENTER_ALIGNMENT);
        button.setMaximumSize(new Dimension(200, 45));
        button.setBorder(BorderFactory.createEmptyBorder(10, 15, 10, 15));
        button.setCursor(new Cursor(Cursor.HAND_CURSOR));
        button.addActionListener(e -> {
            cardLayout.show(contentPanel, panelName);
            if (panelName.equals("BIKES") || panelName.equals("RETURN") || panelName.equals("MANAGE")
                    || panelName.equals("REPORTS")) {
                refreshPanel(panelName);
            }
        });
        button.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseEntered(java.awt.event.MouseEvent evt) {
                button.setBackground(new Color(72, 139, 205)); // Lighter blue on hover
            }
            public void mouseExited(java.awt.event.MouseEvent evt) {
                button.setBackground(new Color(30, 115, 190)); // Original blue
            }
        });
        sidebar.add(button);
        sidebar.add(Box.createRigidArea(new Dimension(0, 10)));
    }
    private JPanel createHomePanel() {
        JPanel homePanel = new JPanel();
        homePanel.setLayout(new GridBagLayout());
        homePanel.setBackground(Color.WHITE);
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(20, 20, 20, 20);
        gbc.gridx = 0;
        gbc.gridy = 0;
        JLabel welcomeLabel = new JLabel("Welcome to RENTAMOTO!");
        welcomeLabel.setFont(new Font("Arial", Font.BOLD, 32));
        welcomeLabel.setForeground(new Color(30, 115, 190)); // Blue color
        homePanel.add(welcomeLabel, gbc);

        gbc.gridy = 1;
        JLabel subtitleLabel = new JLabel("Your Complete Bike Rental Management System");
        subtitleLabel.setFont(new Font("Arial", Font.PLAIN, 18));
        subtitleLabel.setForeground(new Color(101, 67, 33)); // Brown color
        homePanel.add(subtitleLabel, gbc);
        gbc.gridy = 2;
        gbc.insets = new Insets(40, 20, 20, 20);
        JPanel infoPanel = new JPanel(new GridLayout(2, 2, 30, 30));
        infoPanel.setOpaque(false);
        infoPanel.add(createInfoCard("🚲", "View Bikes", "Browse available bikes"));
        infoPanel.add(createInfoCard("🎫", "Rent", "Rent a bike easily"));
        infoPanel.add(createInfoCard("↩️", "Return", "Return your rented bike"));
        if (currentUser.isAdmin()) {
            infoPanel.add(createInfoCard("📊", "Reports", "View analytics"));
        } else {
            infoPanel.add(createInfoCard("👤", "Profile", "Manage your account"));
        }
        homePanel.add(infoPanel, gbc);
        return homePanel;
    }
    private JPanel createInfoCard(String icon, String title, String description) {
        JPanel card = new JPanel();
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        card.setBackground(new Color(248, 243, 236)); // Light brown/cream background
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(30, 115, 190), 2), // Blue border
                BorderFactory.createEmptyBorder(20, 20, 20, 20)));
        card.setPreferredSize(new Dimension(200, 150));
        card.setCursor(new Cursor(Cursor.HAND_CURSOR));

        JLabel iconLabel = new JLabel(icon);
        iconLabel.setFont(new Font("Arial", Font.PLAIN, 48));
        iconLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        card.add(iconLabel);
        card.add(Box.createRigidArea(new Dimension(0, 10)));

        JLabel titleLabel = new JLabel(title);
        titleLabel.setFont(new Font("Arial", Font.BOLD, 18));
        titleLabel.setForeground(new Color(30, 115, 190)); // Blue color for title
        titleLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        card.add(titleLabel);
        card.add(Box.createRigidArea(new Dimension(0, 5)));

        JLabel descLabel = new JLabel(description);
        descLabel.setFont(new Font("Arial", Font.PLAIN, 12));
        descLabel.setForeground(new Color(101, 67, 33)); // Brown color for description
        descLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        card.add(descLabel);

        // Add mouse listener for hover effect and click action
        card.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent evt) {
                switch(title) {
                    case "View Bikes":
                        cardLayout.show(contentPanel, "BIKES");
                        refreshPanel("BIKES");
                        break;
                    case "Rent":
                        cardLayout.show(contentPanel, "RENT");
                        break;
                    case "Return":
                        cardLayout.show(contentPanel, "RETURN");
                        refreshPanel("RETURN");
                        break;
                    case "Reports":
                        cardLayout.show(contentPanel, "REPORTS");
                        refreshPanel("REPORTS");
                        break;
                    case "Profile":
                        showProfileDialog();
                        break;
                }
            }

            public void mouseEntered(java.awt.event.MouseEvent evt) {
                card.setBackground(new Color(230, 220, 210)); // Darker brown/cream on hover
            }

            public void mouseExited(java.awt.event.MouseEvent evt) {
                card.setBackground(new Color(248, 243, 236)); // Original light brown/cream
            }
        });
        return card;
    }
    private void refreshPanel(String panelName) {
        Component[] components = contentPanel.getComponents();
        for (Component comp : components) {
            if (comp instanceof BikeListPanel && panelName.equals("BIKES")) {
                ((BikeListPanel) comp).refreshTable();
            } else if (comp instanceof ReturnBikePanel && panelName.equals("RETURN")) {
                ((ReturnBikePanel) comp).refreshTable();
            } else if (comp instanceof BikeManagementPanel && panelName.equals("MANAGE")) {
                ((BikeManagementPanel) comp).refreshTable();
            } else if (comp instanceof ReportsPanel && panelName.equals("REPORTS")) {
                ((ReportsPanel) comp).refreshData();
            }
        }
    }
    private void logout() {
        int result = JOptionPane.showConfirmDialog(this,
                "Are you sure you want to logout?",
                "Confirm Logout",
                JOptionPane.YES_NO_OPTION);
        if (result == JOptionPane.YES_OPTION) {
            LoginFrame loginFrame = new LoginFrame();
            loginFrame.setVisible(true);
            dispose();
        }
    }

    private void showProfileDialog() {
        JPanel profilePanel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(5, 10, 5, 10);
        gbc.anchor = GridBagConstraints.WEST;

        // Add profile information
        gbc.gridx = 0;
        gbc.gridy = 0;
        profilePanel.add(new JLabel("👤 User Profile"), gbc);

        gbc.gridy++;
        profilePanel.add(new JLabel("ID: " + currentUser.getId()), gbc);

        gbc.gridy++;
        profilePanel.add(new JLabel("Name: " + currentUser.getName()), gbc);

        gbc.gridy++;
        profilePanel.add(new JLabel("Username: " + currentUser.getUsername()), gbc);

        gbc.gridy++;
        profilePanel.add(new JLabel("Role: " + currentUser.getRole().toUpperCase()), gbc);

        // Show the dialog
        JOptionPane.showMessageDialog(this,
                profilePanel,
                "Profile Information",
                JOptionPane.INFORMATION_MESSAGE);
    }
}