package ui;
import services.RentalService;
import javax.swing.*;
import java.awt.*;
import java.util.Map;
public class ReportsPanel extends JPanel {
    private RentalService rentalService;
    private JLabel totalRentalsLabel;
    private JLabel totalRevenueLabel;
    private JTextArea popularityTextArea;
    public ReportsPanel() {
        this.rentalService = new RentalService();
        initComponents();
        loadReports();
    }
    private void initComponents() {
        setLayout(new BorderLayout(10, 10));
        setBackground(Color.WHITE);
        setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
        JLabel titleLabel = new JLabel("📊 Rental Reports & Analytics");
        titleLabel.setFont(new Font("Arial", Font.BOLD, 24));
        titleLabel.setForeground(new Color(41, 128, 185));
        add(titleLabel, BorderLayout.NORTH);
        JPanel contentPanel = new JPanel(new GridLayout(2, 1, 15, 15));
        contentPanel.setBackground(Color.WHITE);
        JPanel statsPanel = new JPanel(new GridLayout(1, 2, 20, 0));
        statsPanel.setBackground(Color.WHITE);
        JPanel totalRentalsCard = createStatCard(
                "🎫 Total Rentals",
                "0",
                new Color(52, 152, 219),
                "totalRentals");
        statsPanel.add(totalRentalsCard);
        JPanel totalRevenueCard = createStatCard(
                "💰 Total Revenue",
                "$0.00",
                new Color(46, 204, 113),
                "totalRevenue");
        statsPanel.add(totalRevenueCard);
        contentPanel.add(statsPanel);
        JPanel popularityPanel = new JPanel(new BorderLayout(10, 10));
        popularityPanel.setBackground(Color.WHITE);
        popularityPanel.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(189, 195, 199), 2),
                BorderFactory.createEmptyBorder(20, 20, 20, 20)));
        JLabel popularityTitle = new JLabel("🏆 Bike Popularity Ranking");
        popularityTitle.setFont(new Font("Arial", Font.BOLD, 18));
        popularityTitle.setForeground(new Color(142, 68, 173));
        popularityPanel.add(popularityTitle, BorderLayout.NORTH);
        popularityTextArea = new JTextArea();
        popularityTextArea.setFont(new Font("Monospaced", Font.PLAIN, 14));
        popularityTextArea.setEditable(false);
        popularityTextArea.setBackground(new Color(250, 250, 250));
        popularityTextArea.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        JScrollPane scrollPane = new JScrollPane(popularityTextArea);
        scrollPane.setBorder(BorderFactory.createLineBorder(new Color(189, 195, 199), 1));
        popularityPanel.add(scrollPane, BorderLayout.CENTER);
        contentPanel.add(popularityPanel);
        add(contentPanel, BorderLayout.CENTER);
        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        bottomPanel.setBackground(Color.WHITE);
        JButton refreshButton = new JButton("🔄 Refresh Data");
        refreshButton.setFont(new Font("Arial", Font.BOLD, 13));
        refreshButton.setBackground(new Color(14, 97, 243)); 
        refreshButton.setForeground(Color.WHITE);
        refreshButton.setFocusPainted(false);
        refreshButton.setOpaque(true);
        refreshButton.setBorderPainted(false);
        refreshButton.setBorder(BorderFactory.createEmptyBorder(10, 20, 10, 20));
        refreshButton.setCursor(new Cursor(Cursor.HAND_CURSOR));
        refreshButton.addActionListener(e -> refreshData());
        bottomPanel.add(refreshButton);
        add(bottomPanel, BorderLayout.SOUTH);
    }
    private JPanel createStatCard(String title, String value, Color color, String type) {
        JPanel card = new JPanel();
        card.setLayout(new BoxLayout(card, BoxLayout.Y_AXIS));
        card.setBackground(Color.WHITE);
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(color, 3),
                BorderFactory.createEmptyBorder(25, 25, 25, 25)));
        JLabel titleLabel = new JLabel(title);
        titleLabel.setFont(new Font("Arial", Font.BOLD, 16));
        titleLabel.setForeground(color);
        titleLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        card.add(titleLabel);
        card.add(Box.createRigidArea(new Dimension(0, 15)));
        JLabel valueLabel;
        if (type.equals("totalRentals")) {
            totalRentalsLabel = new JLabel(value);
            valueLabel = totalRentalsLabel;
        } else {
            totalRevenueLabel = new JLabel(value);
            valueLabel = totalRevenueLabel;
        }
        valueLabel.setFont(new Font("Arial", Font.BOLD, 36));
        valueLabel.setForeground(color);
        valueLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        card.add(valueLabel);
        card.add(Box.createRigidArea(new Dimension(0, 10)));
        JLabel descLabel = new JLabel(type.equals("totalRentals") ? "All time rentals" : "All time earnings");
        descLabel.setFont(new Font("Arial", Font.PLAIN, 12));
        descLabel.setForeground(Color.GRAY);
        descLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        card.add(descLabel);
        return card;
    }
    private void loadReports() {
        int totalRentals = rentalService.getTotalRentalCount();
        totalRentalsLabel.setText(String.valueOf(totalRentals));
        double totalRevenue = rentalService.getTotalRevenue();
        totalRevenueLabel.setText(String.format("$%.2f", totalRevenue));
        Map<String, Integer> popularity = rentalService.getBikePopularity();
        StringBuilder sb = new StringBuilder();
        sb.append("┌─────────────────────────────────────────────────────────┐\n");
        sb.append("│  Rank  │  Bike Model               │  Total Rentals  │\n");
        sb.append("├─────────────────────────────────────────────────────────┤\n");
        if (popularity.isEmpty()) {
            sb.append("│                    No data available                    │\n");
        } else {
            int rank = 1;
            for (Map.Entry<String, Integer> entry : popularity.entrySet()) {
                String model = entry.getKey();
                int count = entry.getValue();
                if (model.length() > 25) {
                    model = model.substring(0, 22) + "...";
                }
                String rankMedal = rank == 1 ? "🥇" : rank == 2 ? "🥈" : rank == 3 ? "🥉" : "  ";
                sb.append(String.format("│   %s%-2d  │  %-25s│       %-10d│\n",
                        rankMedal, rank, model, count));
                rank++;
            }
        }
        sb.append("└─────────────────────────────────────────────────────────┘");
        popularityTextArea.setText(sb.toString());
    }
    public void refreshData() {
        loadReports();
        JOptionPane.showMessageDialog(this,
                "Reports refreshed successfully!",
                "Refresh",
                JOptionPane.INFORMATION_MESSAGE);
    }
}