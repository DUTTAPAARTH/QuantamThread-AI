package ui;
import models.Rental;
import models.User;
import services.RentalService;
import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import java.awt.*;
import java.util.List;
public class ReturnBikePanel extends JPanel {
    private JTable rentalsTable;
    private DefaultTableModel tableModel;
    private RentalService rentalService;
    private User currentUser;
    public ReturnBikePanel(User user) {
        this.currentUser = user;
        this.rentalService = new RentalService();
        initComponents();
        loadActiveRentals();
    }
    private void initComponents() {
        setLayout(new BorderLayout(10, 10));
        setBackground(Color.WHITE);
        setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
        JLabel titleLabel = new JLabel("↩️ Return Bike");
        titleLabel.setFont(new Font("Arial", Font.BOLD, 24));
        titleLabel.setForeground(new Color(41, 128, 185));
        add(titleLabel, BorderLayout.NORTH);
        String[] columns = { "Rental ID", "Bike Model", "Hours", "Total Cost", "Rental Date", "Status" };
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        rentalsTable = new JTable(tableModel);
        rentalsTable.setFont(new Font("Arial", Font.PLAIN, 13));
        rentalsTable.setRowHeight(30);
        rentalsTable.setSelectionBackground(new Color(52, 152, 219));
        rentalsTable.setSelectionForeground(Color.WHITE);
        rentalsTable.setGridColor(new Color(189, 195, 199));
        JTableHeader header = rentalsTable.getTableHeader();
        header.setFont(new Font("Arial", Font.BOLD, 14));
        header.setBackground(new Color(41, 128, 185));
        header.setForeground(Color.WHITE);
        header.setPreferredSize(new Dimension(0, 40));
        JScrollPane scrollPane = new JScrollPane(rentalsTable);
        scrollPane.setBorder(BorderFactory.createLineBorder(new Color(189, 195, 199), 1));
        add(scrollPane, BorderLayout.CENTER);
        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 15, 10));
        bottomPanel.setBackground(Color.WHITE);
        JButton returnButton = new JButton("↩️ Return Selected Bike");
        returnButton.setFont(new Font("Arial", Font.BOLD, 13));
        returnButton.setBackground(new Color(14, 97, 243)); 
        returnButton.setForeground(Color.WHITE);
        returnButton.setFocusPainted(false);
        returnButton.setOpaque(true);
        returnButton.setBorderPainted(false);
        returnButton.setBorder(BorderFactory.createEmptyBorder(10, 20, 10, 20));
        returnButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        returnButton.addActionListener(_ -> returnBike());
        JButton refreshButton = new JButton("🔄 Refresh");
        refreshButton.setFont(new Font("Arial", Font.BOLD, 13));
        refreshButton.setBackground(new Color(94, 151, 214)); 
        refreshButton.setForeground(Color.WHITE);
        refreshButton.setFocusPainted(false);
        refreshButton.setOpaque(true);
        refreshButton.setBorderPainted(false);
        refreshButton.setBorder(BorderFactory.createEmptyBorder(10, 20, 10, 20));
        refreshButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        refreshButton.addActionListener(_ -> refreshTable());
        bottomPanel.add(returnButton);
        bottomPanel.add(refreshButton);
        add(bottomPanel, BorderLayout.SOUTH);
    }
    private void loadActiveRentals() {
        tableModel.setRowCount(0);
        List<Rental> rentals = rentalService.getActiveRentalsByUser(currentUser.getId());
        if (rentals.isEmpty()) {
            Object[] emptyRow = { "No active rentals", "", "", "", "", "" };
            tableModel.addRow(emptyRow);
        } else {
            for (Rental rental : rentals) {
                Object[] row = {
                        rental.getId(),
                        rental.getBikeModel(),
                        rental.getHours(),
                        "$" + String.format("%.2f", rental.getTotalCost()),
                        rental.getRentalDate().toString(),
                        rental.getStatus()
                };
                tableModel.addRow(row);
            }
        }
    }
    private void returnBike() {
        int selectedRow = rentalsTable.getSelectedRow();
        if (selectedRow == -1) {
            JOptionPane.showMessageDialog(this,
                    "Please select a rental to return.",
                    "Warning",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }
        if (tableModel.getRowCount() == 1 && tableModel.getValueAt(0, 0).equals("No active rentals")) {
            JOptionPane.showMessageDialog(this,
                    "You have no active rentals.",
                    "Info",
                    JOptionPane.INFORMATION_MESSAGE);
            return;
        }
        int rentalId = (int) tableModel.getValueAt(selectedRow, 0);
        String bikeModel = (String) tableModel.getValueAt(selectedRow, 1);
        int confirm = JOptionPane.showConfirmDialog(this,
                "Are you sure you want to return the bike: " + bikeModel + "?",
                "Confirm Return",
                JOptionPane.YES_NO_OPTION);
        if (confirm == JOptionPane.YES_OPTION) {
            boolean success = rentalService.completeRental(rentalId);
            if (success) {
                JOptionPane.showMessageDialog(this,
                        "Bike returned successfully!\nThank you for using RENTAMOTO! 🚴",
                        "Return Successful",
                        JOptionPane.INFORMATION_MESSAGE);
                refreshTable();
            } else {
                JOptionPane.showMessageDialog(this,
                        "Failed to return bike. Please try again.",
                        "Error",
                        JOptionPane.ERROR_MESSAGE);
            }
        }
    }
    public void refreshTable() {
        loadActiveRentals();
    }
}