package services;

import models.Bike;
import utils.DatabaseConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class BikeService {

    public boolean addBike(Bike bike) {
        String sql = "INSERT INTO bikes (model, rate_per_hour, available, maintenance_status) VALUES (?, ?, ?, ?)";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            pstmt.setString(1, bike.getModel());
            pstmt.setDouble(2, bike.getRatePerHour());
            pstmt.setBoolean(3, bike.isAvailable());
            pstmt.setString(4, bike.getMaintenanceStatus());
            
            int affectedRows = pstmt.executeUpdate();
            
            if (affectedRows > 0) {
                try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        bike.setId(generatedKeys.getInt(1));
                    }
                }
                System.out.println("Bike added successfully: " + bike.getModel());
                return true;
            }
            
        } catch (SQLException e) {
            System.err.println("Error adding bike: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateBike(Bike bike) {
        String sql = "UPDATE bikes SET model = ?, rate_per_hour = ?, available = ?, maintenance_status = ? WHERE id = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, bike.getModel());
            pstmt.setDouble(2, bike.getRatePerHour());
            pstmt.setBoolean(3, bike.isAvailable());
            pstmt.setString(4, bike.getMaintenanceStatus());
            pstmt.setInt(5, bike.getId());
            
            int affectedRows = pstmt.executeUpdate();
            
            if (affectedRows > 0) {
                System.out.println("Bike updated successfully: " + bike.getModel());
                return true;
            }
            
        } catch (SQLException e) {
            System.err.println("Error updating bike: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    public boolean deleteBike(int bikeId) {
        String sql = "DELETE FROM bikes WHERE id = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, bikeId);
            int affectedRows = pstmt.executeUpdate();
            
            if (affectedRows > 0) {
                System.out.println("Bike deleted successfully with ID: " + bikeId);
                return true;
            }
            
        } catch (SQLException e) {
            System.err.println("Error deleting bike: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    public List<Bike> getAllBikes() {
        List<Bike> bikes = new ArrayList<>();
        String sql = "SELECT * FROM bikes ORDER BY id";
        
        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                Bike bike = new Bike();
                bike.setId(rs.getInt("id"));
                bike.setModel(rs.getString("model"));
                bike.setRatePerHour(rs.getDouble("rate_per_hour"));
                bike.setAvailable(rs.getBoolean("available"));
                bike.setMaintenanceStatus(rs.getString("maintenance_status"));
                bikes.add(bike);
            }
            
        } catch (SQLException e) {
            System.err.println("Error getting all bikes: " + e.getMessage());
            e.printStackTrace();
        }
        
        return bikes;
    }

    public List<Bike> getAvailableBikes() {
        List<Bike> bikes = new ArrayList<>();
        String sql = "SELECT * FROM bikes WHERE available = TRUE AND maintenance_status IN ('Good', 'Excellent') ORDER BY id";
        
        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                Bike bike = new Bike();
                bike.setId(rs.getInt("id"));
                bike.setModel(rs.getString("model"));
                bike.setRatePerHour(rs.getDouble("rate_per_hour"));
                bike.setAvailable(rs.getBoolean("available"));
                bike.setMaintenanceStatus(rs.getString("maintenance_status"));
                bikes.add(bike);
            }
            
        } catch (SQLException e) {
            System.err.println("Error getting available bikes: " + e.getMessage());
            e.printStackTrace();
        }
        
        return bikes;
    }

    public Bike getBikeById(int bikeId) {
        String sql = "SELECT * FROM bikes WHERE id = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, bikeId);
            ResultSet rs = pstmt.executeQuery();
            
            if (rs.next()) {
                Bike bike = new Bike();
                bike.setId(rs.getInt("id"));
                bike.setModel(rs.getString("model"));
                bike.setRatePerHour(rs.getDouble("rate_per_hour"));
                bike.setAvailable(rs.getBoolean("available"));
                bike.setMaintenanceStatus(rs.getString("maintenance_status"));
                return bike;
            }
            
        } catch (SQLException e) {
            System.err.println("Error getting bike: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    public boolean updateBikeAvailability(int bikeId, boolean available) {
        String sql = "UPDATE bikes SET available = ? WHERE id = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setBoolean(1, available);
            pstmt.setInt(2, bikeId);
            
            int affectedRows = pstmt.executeUpdate();
            
            if (affectedRows > 0) {
                System.out.println("Bike availability updated for ID: " + bikeId + " to " + available);
                return true;
            }
            
        } catch (SQLException e) {
            System.err.println("Error updating bike availability: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }
}