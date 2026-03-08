package ui;
import models.Bike;
import models.User;
import services.BikeService;
import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.JTableHeader;
import javax.swing.table.TableCellRenderer;
import java.awt.*;
import java.util.List;
public class BikeListPanel extends JPanel {
    private JTable bikesTable;
    private DefaultTableModel tableModel;
    private BikeService bikeService;
    public BikeListPanel(User user) {
        this.bikeService = new BikeService();
        initComponents();
        loadBikes();
    }
    private void initComponents() {
        setLayout(new BorderLayout(10, 10));
        setBackground(Color.WHITE);
        setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
        JLabel titleLabel = new JLabel("🚲 Available Bikes");
        titleLabel.setFont(new Font("Arial", Font.BOLD, 24));
        titleLabel.setForeground(new Color(41, 128, 185));
        add(titleLabel, BorderLayout.NORTH);
        String[] columns = { "ID", "Model", "Rate/Hour", "Availability", "Maintenance" };
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
        bikesTable.setSelectionForeground(Color.BLUE);
        bikesTable.setGridColor(new Color(189, 195, 199));
        JTableHeader header = bikesTable.getTableHeader();
        header.setFont(new Font("Arial", Font.BOLD, 14));
        header.setBackground(new Color(46, 204, 113));
        header.setForeground(Color.WHITE);
        header.setPreferredSize(new Dimension(0, 40));
        
        // Custom header renderer for ID and Maintenance columns
        header.setDefaultRenderer(new DefaultTableCellRenderer() {
            @Override
            public Component getTableCellRendererComponent(JTable table, Object value, 
                    boolean isSelected, boolean hasFocus, int row, int column) {
                Component comp = super.getTableCellRendererComponent(table, value, isSelected, hasFocus, row, column);
                setFont(new Font("Arial", Font.BOLD, 14));
                setForeground(Color.WHITE);
                setHorizontalAlignment(SwingConstants.CENTER);
                
                // Set different colors for ID and Maintenance columns
                if (column == 0) { // ID column
                    setBackground(new Color(231, 76, 60)); // Red color for ID
                } else if (column == 4) { // Maintenance column
                    setBackground(new Color(155, 89, 182)); // Purple color for Maintenance
                } else {
                    setBackground(new Color(46, 204, 113)); // Green for other columns
                }
                
                setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
                return comp;
            }
        });
        JScrollPane scrollPane = new JScrollPane(bikesTable);
        scrollPane.setBorder(BorderFactory.createLineBorder(new Color(189, 195, 199), 1));
        add(scrollPane, BorderLayout.CENTER);
        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        bottomPanel.setBackground(Color.WHITE);
        JButton refreshButton = new JButton("🔄 Refresh");
        refreshButton.setFont(new Font("Arial", Font.BOLD, 13));
        refreshButton.setBackground(new Color(14, 97, 243)); 
        refreshButton.setForeground(Color.WHITE);
        refreshButton.setFocusPainted(false);
        refreshButton.setOpaque(true);
        refreshButton.setBorderPainted(false);
        refreshButton.setBorder(BorderFactory.createEmptyBorder(10, 20, 10, 20));
        refreshButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        refreshButton.addActionListener(_ -> refreshTable());
        bottomPanel.add(refreshButton);
        add(bottomPanel, BorderLayout.SOUTH);
    }
    private void loadBikes() {
        tableModel.setRowCount(0);
        List<Bike> bikes = bikeService.getAllBikes();
        for (Bike bike : bikes) {
            Object[] row = {
                    bike.getId(),
                    bike.getModel(),
                    "$" + bike.getRatePerHour(),
                    bike.getAvailabilityStatus(),
                    bike.getMaintenanceStatus()
            };
            tableModel.addRow(row);
        }
    }
    public void refreshTable() {
        loadBikes();
        JOptionPane.showMessageDialog(this,
                "Table refreshed successfully!",
                "Refresh",
                JOptionPane.INFORMATION_MESSAGE);
    }
}