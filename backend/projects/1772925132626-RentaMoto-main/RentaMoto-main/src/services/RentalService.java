package services;

import models.Rental;
import utils.DatabaseConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RentalService {
    private BikeService bikeService = new BikeService();

    public boolean createRental(Rental rental) {
        String sql = "INSERT INTO rentals (user_id, bike_id, hours, total_cost, status, rental_date) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            pstmt.setInt(1, rental.getUserId());
            pstmt.setInt(2, rental.getBikeId());
            pstmt.setInt(3, rental.getHours());
            pstmt.setDouble(4, rental.getTotalCost());
            pstmt.setString(5, "active");
            
            int affectedRows = pstmt.executeUpdate();
            
            if (affectedRows > 0) {
                try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        rental.setId(generatedKeys.getInt(1));
                    }
                }
                bikeService.updateBikeAvailability(rental.getBikeId(), false);
                System.out.println("Rental created successfully with ID: " + rental.getId());
                return true;
            }
            
        } catch (SQLException e) {
            System.err.println("Error creating rental: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    public boolean completeRental(int rentalId) {
        String sql = "UPDATE rentals SET status = 'completed', return_date = CURRENT_TIMESTAMP WHERE id = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            Rental rental = getRentalById(rentalId);
            if (rental != null) {
                pstmt.setInt(1, rentalId);
                int affectedRows = pstmt.executeUpdate();
                
                if (affectedRows > 0) {
                    bikeService.updateBikeAvailability(rental.getBikeId(), true);
                    System.out.println("Rental completed successfully: " + rentalId);
                    return true;
                }
            }
            
        } catch (SQLException e) {
            System.err.println("Error completing rental: " + e.getMessage());
            e.printStackTrace();
        }
        return false;
    }

    public Rental getRentalById(int rentalId) {
        String sql = "SELECT r.*, u.name as user_name, b.model as bike_model " +
                     "FROM rentals r " +
                     "JOIN users u ON r.user_id = u.id " +
                     "JOIN bikes b ON r.bike_id = b.id " +
                     "WHERE r.id = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, rentalId);
            ResultSet rs = pstmt.executeQuery();
            
            if (rs.next()) {
                Rental rental = new Rental();
                rental.setId(rs.getInt("id"));
                rental.setUserId(rs.getInt("user_id"));
                rental.setBikeId(rs.getInt("bike_id"));
                rental.setHours(rs.getInt("hours"));
                rental.setTotalCost(rs.getDouble("total_cost"));
                rental.setStatus(rs.getString("status"));
                rental.setRentalDate(rs.getTimestamp("rental_date"));
                rental.setReturnDate(rs.getTimestamp("return_date"));
                rental.setUserName(rs.getString("user_name"));
                rental.setBikeModel(rs.getString("bike_model"));
                return rental;
            }
            
        } catch (SQLException e) {
            System.err.println("Error getting rental: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    public List<Rental> getAllRentals() {
        List<Rental> rentals = new ArrayList<>();
        String sql = "SELECT r.*, u.name as user_name, b.model as bike_model " +
                     "FROM rentals r " +
                     "JOIN users u ON r.user_id = u.id " +
                     "JOIN bikes b ON r.bike_id = b.id " +
                     "ORDER BY r.rental_date DESC";
        
        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                Rental rental = new Rental();
                rental.setId(rs.getInt("id"));
                rental.setUserId(rs.getInt("user_id"));
                rental.setBikeId(rs.getInt("bike_id"));
                rental.setHours(rs.getInt("hours"));
                rental.setTotalCost(rs.getDouble("total_cost"));
                rental.setStatus(rs.getString("status"));
                rental.setRentalDate(rs.getTimestamp("rental_date"));
                rental.setReturnDate(rs.getTimestamp("return_date"));
                rental.setUserName(rs.getString("user_name"));
                rental.setBikeModel(rs.getString("bike_model"));
                rentals.add(rental);
            }
            
        } catch (SQLException e) {
            System.err.println("Error getting all rentals: " + e.getMessage());
            e.printStackTrace();
        }
        
        return rentals;
    }

    public List<Rental> getActiveRentalsByUser(int userId) {
        List<Rental> rentals = new ArrayList<>();
        String sql = "SELECT r.*, u.name as user_name, b.model as bike_model " +
                     "FROM rentals r " +
                     "JOIN users u ON r.user_id = u.id " +
                     "JOIN bikes b ON r.bike_id = b.id " +
                     "WHERE r.user_id = ? AND r.status = 'active' " +
                     "ORDER BY r.rental_date DESC";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, userId);
            ResultSet rs = pstmt.executeQuery();
            
            while (rs.next()) {
                Rental rental = new Rental();
                rental.setId(rs.getInt("id"));
                rental.setUserId(rs.getInt("user_id"));
                rental.setBikeId(rs.getInt("bike_id"));
                rental.setHours(rs.getInt("hours"));
                rental.setTotalCost(rs.getDouble("total_cost"));
                rental.setStatus(rs.getString("status"));
                rental.setRentalDate(rs.getTimestamp("rental_date"));
                rental.setReturnDate(rs.getTimestamp("return_date"));
                rental.setUserName(rs.getString("user_name"));
                rental.setBikeModel(rs.getString("bike_model"));
                rentals.add(rental);
            }
            
        } catch (SQLException e) {
            System.err.println("Error getting user rentals: " + e.getMessage());
            e.printStackTrace();
        }
        
        return rentals;
    }

    public double getTotalRevenue() {
        String sql = "SELECT SUM(total_cost) as total FROM rentals WHERE status = 'completed'";
        
        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            if (rs.next()) {
                return rs.getDouble("total");
            }
            
        } catch (SQLException e) {
            System.err.println("Error calculating total revenue: " + e.getMessage());
            e.printStackTrace();
        }
        return 0.0;
    }

    public int getTotalRentalCount() {
        String sql = "SELECT COUNT(*) as count FROM rentals";
        
        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            if (rs.next()) {
                return rs.getInt("count");
            }
            
        } catch (SQLException e) {
            System.err.println("Error counting rentals: " + e.getMessage());
            e.printStackTrace();
        }
        return 0;
    }

    public Map<String, Integer> getBikePopularity() {
        Map<String, Integer> popularity = new HashMap<>();
        String sql = "SELECT b.model, COUNT(r.id) as rental_count " +
                     "FROM rentals r " +
                     "JOIN bikes b ON r.bike_id = b.id " +
                     "GROUP BY b.model " +
                     "ORDER BY rental_count DESC";
        
        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                popularity.put(rs.getString("model"), rs.getInt("rental_count"));
            }
            
        } catch (SQLException e) {
            System.err.println("Error getting bike popularity: " + e.getMessage());
            e.printStackTrace();
        }
        
        return popularity;
    }
}