package ui;
import models.Bike;
import models.Rental;
import models.User;
import services.BikeService;
import services.RentalService;
import javax.swing.*;
import java.awt.*;
import java.util.List;
public class RentBikePanel extends JPanel {
    private JComboBox<Bike> bikeComboBox;
    private JSpinner hoursSpinner;
    private JLabel totalCostLabel;
    private BikeService bikeService;
    private RentalService rentalService;
    private User currentUser;
    public RentBikePanel(User user) {
        this.currentUser = user;
        this.bikeService = new BikeService();
        this.rentalService = new RentalService();
        initComponents();
        loadAvailableBikes();
    }
    private void initComponents() {
        setLayout(new GridBagLayout());
        setBackground(Color.WHITE);
        setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        gbc.fill = GridBagConstraints.HORIZONTAL;
        JLabel titleLabel = new JLabel("🎫 Rent a Bike");
        titleLabel.setFont(new Font("Arial", Font.BOLD, 28));
        titleLabel.setForeground(new Color(41, 128, 185));
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.gridwidth = 2;
        gbc.anchor = GridBagConstraints.CENTER;
        add(titleLabel, gbc);
        JPanel formPanel = new JPanel(new GridBagLayout());
        formPanel.setBackground(Color.WHITE);
        formPanel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(189, 195, 199), 1),
                BorderFactory.createEmptyBorder(30, 40, 30, 40)));
        GridBagConstraints fgbc = new GridBagConstraints();
        fgbc.insets = new Insets(15, 10, 15, 10);
        fgbc.fill = GridBagConstraints.HORIZONTAL;
        fgbc.gridx = 0;
        fgbc.gridy = 0;
        fgbc.anchor = GridBagConstraints.WEST;
        JLabel bikeLabel = new JLabel("Select Bike:");
        bikeLabel.setFont(new Font("Arial", Font.BOLD, 16));
        formPanel.add(bikeLabel, fgbc);
        bikeComboBox = new JComboBox<>();
        bikeComboBox.setFont(new Font("Arial", Font.PLAIN, 14));
        bikeComboBox.setPreferredSize(new Dimension(300, 35));
        bikeComboBox.addActionListener(e -> calculateCost());
        fgbc.gridx = 1;
        formPanel.add(bikeComboBox, fgbc);
        fgbc.gridx = 0;
        fgbc.gridy = 1;
        JLabel hoursLabel = new JLabel("Number of Hours:");
        hoursLabel.setFont(new Font("Arial", Font.BOLD, 16));
        formPanel.add(hoursLabel, fgbc);
        SpinnerNumberModel spinnerModel = new SpinnerNumberModel(1, 1, 24, 1);
        hoursSpinner = new JSpinner(spinnerModel);
        hoursSpinner.setFont(new Font("Arial", Font.PLAIN, 14));
        ((JSpinner.DefaultEditor) hoursSpinner.getEditor()).getTextField().setEditable(false);
        hoursSpinner.setPreferredSize(new Dimension(300, 35));
        hoursSpinner.addChangeListener(e -> calculateCost());
        fgbc.gridx = 1;
        formPanel.add(hoursSpinner, fgbc);
        fgbc.gridx = 0;
        fgbc.gridy = 2;
        JLabel costLabel = new JLabel("Total Cost:");
        costLabel.setFont(new Font("Arial", Font.BOLD, 16));
        formPanel.add(costLabel, fgbc);
        totalCostLabel = new JLabel("₹0.00");
        totalCostLabel.setFont(new Font("Arial", Font.BOLD, 20));
        totalCostLabel.setForeground(new Color(46, 204, 113));
        fgbc.gridx = 1;
        formPanel.add(totalCostLabel, fgbc);
        JButton rentButton = new JButton("🎫 Confirm Rental");
        rentButton.setFont(new Font("Arial", Font.BOLD, 16));
        rentButton.setBackground(new Color(14, 97, 243)); 
        rentButton.setForeground(Color.WHITE);
        rentButton.setFocusPainted(false);
        rentButton.setOpaque(true);
        rentButton.setBorderPainted(false);
        rentButton.setBorder(BorderFactory.createEmptyBorder(15, 30, 15, 30));
        rentButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        rentButton.addActionListener(e -> rentBike());
        fgbc.gridx = 0;
        fgbc.gridy = 3;
        fgbc.gridwidth = 2;
        fgbc.insets = new Insets(25, 10, 10, 10);
        fgbc.anchor = GridBagConstraints.CENTER;
        formPanel.add(rentButton, fgbc);
        gbc.gridx = 0;
        gbc.gridy = 1;
        gbc.gridwidth = 2;
        gbc.insets = new Insets(30, 10, 10, 10);
        add(formPanel, gbc);
        JPanel infoPanel = new JPanel();
        infoPanel.setLayout(new BoxLayout(infoPanel, BoxLayout.Y_AXIS));
        infoPanel.setBackground(new Color(236, 240, 241));
        infoPanel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(189, 195, 199), 1),
                BorderFactory.createEmptyBorder(15, 20, 15, 20)));
        JLabel infoTitle = new JLabel("ℹ️ Rental Information");
        infoTitle.setFont(new Font("Arial", Font.BOLD, 14));
        infoTitle.setAlignmentX(Component.LEFT_ALIGNMENT);
        infoPanel.add(infoTitle);
        infoPanel.add(Box.createRigidArea(new Dimension(0, 10)));
        JLabel info1 = new JLabel("• Select an available bike from the list");
        info1.setFont(new Font("Arial", Font.PLAIN, 12));
        info1.setAlignmentX(Component.LEFT_ALIGNMENT);
        infoPanel.add(info1);
        JLabel info2 = new JLabel("• Choose rental duration (1-24 hours)");
        info2.setFont(new Font("Arial", Font.PLAIN, 12));
        info2.setAlignmentX(Component.LEFT_ALIGNMENT);
        infoPanel.add(info2);
        JLabel info3 = new JLabel("• Cost is calculated automatically");
        info3.setFont(new Font("Arial", Font.PLAIN, 12));
        info3.setAlignmentX(Component.LEFT_ALIGNMENT);
        infoPanel.add(info3);
        JLabel info4 = new JLabel("• Return bike from 'Return Bike' section");
        info4.setFont(new Font("Arial", Font.PLAIN, 12));
        info4.setAlignmentX(Component.LEFT_ALIGNMENT);
        infoPanel.add(info4);
        gbc.gridy = 2;
        gbc.insets = new Insets(20, 10, 10, 10);
        add(infoPanel, gbc);
    }
    private void loadAvailableBikes() {
        bikeComboBox.removeAllItems();
        List<Bike> bikes = bikeService.getAvailableBikes();
        for (Bike bike : bikes) {
            bikeComboBox.addItem(bike);
        }
        if (bikes.isEmpty()) {
            totalCostLabel.setText("No bikes available");
            totalCostLabel.setForeground(Color.RED);
        } else {
            calculateCost();
        }
    }
    private void calculateCost() {
        Bike selectedBike = (Bike) bikeComboBox.getSelectedItem();
        if (selectedBike != null) {
            int hours = (int) hoursSpinner.getValue();
            double cost = selectedBike.getRatePerHour() * hours;
            totalCostLabel.setText(String.format("₹%.2f", cost));
            totalCostLabel.setForeground(new Color(46, 204, 113));
        }
    }
    private void rentBike() {
        Bike selectedBike = (Bike) bikeComboBox.getSelectedItem();
        if (selectedBike == null) {
            JOptionPane.showMessageDialog(this,
                    "No bikes available for rent.",
                    "Error",
                    JOptionPane.ERROR_MESSAGE);
            return;
        }
        int hours = (int) hoursSpinner.getValue();
        double totalCost = selectedBike.getRatePerHour() * hours;
        int confirm = JOptionPane.showConfirmDialog(this,
                "Confirm rental of " + selectedBike.getModel() + " for " + hours + " hour(s)?\n" +
                        "Total cost: ₹" + String.format("%.2f", totalCost),
                "Confirm Rental",
                JOptionPane.YES_NO_OPTION);
        if (confirm == JOptionPane.YES_OPTION) {
            Rental rental = new Rental(currentUser.getId(), selectedBike.getId(), hours, totalCost, "active");
            boolean success = rentalService.createRental(rental);
            if (success) {
                JOptionPane.showMessageDialog(this,
                        "Bike rented successfully!\n" +
                                "Bike: " + selectedBike.getModel() + "\n" +
                                "Duration: " + hours + " hour(s)\n" +
                                "Total Cost: ₹" + String.format("%.2f", totalCost) + "\n\n" +
                                "Enjoy your ride! 🚴",
                        "Rental Successful",
                        JOptionPane.INFORMATION_MESSAGE);
                loadAvailableBikes();
            } else {
                JOptionPane.showMessageDialog(this,
                        "Failed to create rental. Please try again.",
                        "Error",
                        JOptionPane.ERROR_MESSAGE);
            }
        }
    }
}