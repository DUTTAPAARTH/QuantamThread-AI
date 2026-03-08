package ui;
import models.Bike;
import services.BikeService;
import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import java.awt.*;
import java.util.List;
public class BikeManagementPanel extends JPanel {
    private JTable bikesTable;
    private DefaultTableModel tableModel;
    private BikeService bikeService;
    public BikeManagementPanel() {
        this.bikeService = new BikeService();
        initComponents();
        loadBikes();
    }
    private void initComponents() {
        setLayout(new BorderLayout(10, 10));
        setBackground(Color.WHITE);
        setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
        JLabel titleLabel = new JLabel("⚙️ Bike Management");
        titleLabel.setFont(new Font("Arial", Font.BOLD, 24));
        titleLabel.setForeground(new Color(41, 128, 185));
        add(titleLabel, BorderLayout.NORTH);
        String[] columns = { "ID", "Model", "Rate/Hour", "Available", "Maintenance" };
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        bikesTable = new JTable(tableModel);
        bikesTable.setFont(new Font("Arial", Font.PLAIN, 13));
        bikesTable.setRowHeight(30);
        bikesTable.setSelectionBackground(new Color(52, 152, 219));
        bikesTable.setSelectionForeground(Color.WHITE);
        bikesTable.setGridColor(new Color(189, 195, 199));
        JTableHeader header = bikesTable.getTableHeader();
        header.setFont(new Font("Arial", Font.BOLD, 14));
        header.setBackground(new Color(41, 128, 185));
        header.setForeground(Color.WHITE);
        header.setPreferredSize(new Dimension(0, 40));
        JScrollPane scrollPane = new JScrollPane(bikesTable);
        scrollPane.setBorder(BorderFactory.createLineBorder(new Color(189, 195, 199), 1));
        add(scrollPane, BorderLayout.CENTER);
        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 15, 10));
        bottomPanel.setBackground(Color.WHITE);
        JButton addButton = new JButton("➕ Add Bike");
        styleButton(addButton, new Color(14, 97, 243)); 
        addButton.addActionListener(e -> addBike());
        JButton editButton = new JButton("✏️ Edit Bike");
        styleButton(editButton, new Color(94, 151, 214)); 
        editButton.addActionListener(e -> editBike());
        JButton deleteButton = new JButton("🗑️ Delete Bike");
        styleButton(deleteButton, new Color(247, 116, 93)); 
        deleteButton.addActionListener(e -> deleteBike());
        JButton refreshButton = new JButton("🔄 Refresh");
        styleButton(refreshButton, new Color(14, 97, 243)); 
        refreshButton.addActionListener(e -> refreshTable());
        bottomPanel.add(addButton);
        bottomPanel.add(editButton);
        bottomPanel.add(deleteButton);
        bottomPanel.add(refreshButton);
        add(bottomPanel, BorderLayout.SOUTH);
    }
    private void styleButton(JButton button, Color color) {
        button.setFont(new Font("Arial", Font.BOLD, 13));
        button.setBackground(color);
        button.setForeground(Color.WHITE);
        button.setFocusPainted(false);
        button.setOpaque(true);
        button.setBorderPainted(false);
        button.setBorder(BorderFactory.createEmptyBorder(10, 20, 10, 20));
        button.setCursor(new Cursor(Cursor.HAND_CURSOR));
    }
    private void loadBikes() {
        tableModel.setRowCount(0);
        List<Bike> bikes = bikeService.getAllBikes();
        for (Bike bike : bikes) {
            Object[] row = {
                    bike.getId(),
                    bike.getModel(),
                    bike.getRatePerHour(),
                    bike.isAvailable() ? "Yes" : "No",
                    bike.getMaintenanceStatus()
            };
            tableModel.addRow(row);
        }
    }
    private void addBike() {
        JTextField modelField = new JTextField(20);
        JTextField rateField = new JTextField(10);
        JComboBox<String> maintenanceCombo = new JComboBox<>(
                new String[] { "good", "needs_service", "under_maintenance" });
        JPanel panel = new JPanel(new GridLayout(3, 2, 10, 10));
        panel.add(new JLabel("Model:"));
        panel.add(modelField);
        panel.add(new JLabel("Rate/Hour:"));
        panel.add(rateField);
        panel.add(new JLabel("Maintenance:"));
        panel.add(maintenanceCombo);
        int result = JOptionPane.showConfirmDialog(this, panel, "Add New Bike",
                JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        if (result == JOptionPane.OK_OPTION) {
            try {
                String model = modelField.getText().trim();
                double rate = Double.parseDouble(rateField.getText().trim());
                String maintenance = (String) maintenanceCombo.getSelectedItem();
                if (model.isEmpty() || rate <= 0) {
                    JOptionPane.showMessageDialog(this, "Please enter valid data.", "Error", JOptionPane.ERROR_MESSAGE);
                    return;
                }
                Bike bike = new Bike(model, rate, true, maintenance);
                boolean success = bikeService.addBike(bike);
                if (success) {
                    JOptionPane.showMessageDialog(this, "Bike added successfully!", "Success",
                            JOptionPane.INFORMATION_MESSAGE);
                    refreshTable();
                } else {
                    JOptionPane.showMessageDialog(this, "Failed to add bike.", "Error", JOptionPane.ERROR_MESSAGE);
                }
            } catch (NumberFormatException e) {
                JOptionPane.showMessageDialog(this, "Invalid rate value.", "Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }
    private void editBike() {
        int selectedRow = bikesTable.getSelectedRow();
        if (selectedRow == -1) {
            JOptionPane.showMessageDialog(this, "Please select a bike to edit.", "Warning",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }
        int bikeId = (int) tableModel.getValueAt(selectedRow, 0);
        Bike bike = bikeService.getBikeById(bikeId);
        if (bike == null) {
            JOptionPane.showMessageDialog(this, "Bike not found.", "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        JTextField modelField = new JTextField(bike.getModel(), 20);
        JTextField rateField = new JTextField(String.valueOf(bike.getRatePerHour()), 10);
        JComboBox<String> availableCombo = new JComboBox<>(new String[] { "Yes", "No" });
        availableCombo.setSelectedItem(bike.isAvailable() ? "Yes" : "No");
        JComboBox<String> maintenanceCombo = new JComboBox<>(
                new String[] { "good", "needs_service", "under_maintenance" });
        maintenanceCombo.setSelectedItem(bike.getMaintenanceStatus());
        JPanel panel = new JPanel(new GridLayout(4, 2, 10, 10));
        panel.add(new JLabel("Model:"));
        panel.add(modelField);
        panel.add(new JLabel("Rate/Hour:"));
        panel.add(rateField);
        panel.add(new JLabel("Available:"));
        panel.add(availableCombo);
        panel.add(new JLabel("Maintenance:"));
        panel.add(maintenanceCombo);
        int result = JOptionPane.showConfirmDialog(this, panel, "Edit Bike",
                JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        if (result == JOptionPane.OK_OPTION) {
            try {
                bike.setModel(modelField.getText().trim());
                bike.setRatePerHour(Double.parseDouble(rateField.getText().trim()));
                bike.setAvailable(availableCombo.getSelectedItem().equals("Yes"));
                bike.setMaintenanceStatus((String) maintenanceCombo.getSelectedItem());
                boolean success = bikeService.updateBike(bike);
                if (success) {
                    JOptionPane.showMessageDialog(this, "Bike updated successfully!", "Success",
                            JOptionPane.INFORMATION_MESSAGE);
                    refreshTable();
                } else {
                    JOptionPane.showMessageDialog(this, "Failed to update bike.", "Error", JOptionPane.ERROR_MESSAGE);
                }
            } catch (NumberFormatException e) {
                JOptionPane.showMessageDialog(this, "Invalid rate value.", "Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }
    private void deleteBike() {
        int selectedRow = bikesTable.getSelectedRow();
        if (selectedRow == -1) {
            JOptionPane.showMessageDialog(this, "Please select a bike to delete.", "Warning",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }
        int bikeId = (int) tableModel.getValueAt(selectedRow, 0);
        String model = (String) tableModel.getValueAt(selectedRow, 1);
        int confirm = JOptionPane.showConfirmDialog(this,
                "Are you sure you want to delete bike: " + model + "?",
                "Confirm Delete",
                JOptionPane.YES_NO_OPTION,
                JOptionPane.WARNING_MESSAGE);
        if (confirm == JOptionPane.YES_OPTION) {
            boolean success = bikeService.deleteBike(bikeId);
            if (success) {
                JOptionPane.showMessageDialog(this, "Bike deleted successfully!", "Success",
                        JOptionPane.INFORMATION_MESSAGE);
                refreshTable();
            } else {
                JOptionPane.showMessageDialog(this, "Failed to delete bike.", "Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }
    public void refreshTable() {
        loadBikes();
    }
}