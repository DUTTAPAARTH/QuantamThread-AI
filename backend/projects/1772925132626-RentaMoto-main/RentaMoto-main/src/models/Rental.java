package models;
import java.sql.Timestamp;
public class Rental {
    private int id;
    private int userId;
    private int bikeId;
    private int hours;
    private double totalCost;
    private String status; 
    private Timestamp rentalDate;
    private Timestamp returnDate;
    private String userName;
    private String bikeModel;
    public Rental() {}
    public Rental(int id, int userId, int bikeId, int hours, double totalCost, String status, 
                  Timestamp rentalDate, Timestamp returnDate) {
        this.id = id;
        this.userId = userId;
        this.bikeId = bikeId;
        this.hours = hours;
        this.totalCost = totalCost;
        this.status = status;
        this.rentalDate = rentalDate;
        this.returnDate = returnDate;
    }
    public Rental(int userId, int bikeId, int hours, double totalCost, String status) {
        this.userId = userId;
        this.bikeId = bikeId;
        this.hours = hours;
        this.totalCost = totalCost;
        this.status = status;
    }
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }
    public int getUserId() {
        return userId;
    }
    public void setUserId(int userId) {
        this.userId = userId;
    }
    public int getBikeId() {
        return bikeId;
    }
    public void setBikeId(int bikeId) {
        this.bikeId = bikeId;
    }
    public int getHours() {
        return hours;
    }
    public void setHours(int hours) {
        this.hours = hours;
    }
    public double getTotalCost() {
        return totalCost;
    }
    public void setTotalCost(double totalCost) {
        this.totalCost = totalCost;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public Timestamp getRentalDate() {
        return rentalDate;
    }
    public void setRentalDate(Timestamp rentalDate) {
        this.rentalDate = rentalDate;
    }
    public Timestamp getReturnDate() {
        return returnDate;
    }
    public void setReturnDate(Timestamp returnDate) {
        this.returnDate = returnDate;
    }
    public String getUserName() {
        return userName;
    }
    public void setUserName(String userName) {
        this.userName = userName;
    }
    public String getBikeModel() {
        return bikeModel;
    }
    public void setBikeModel(String bikeModel) {
        this.bikeModel = bikeModel;
    }
    @Override
    public String toString() {
        return "Rental{id=" + id + ", userId=" + userId + ", bikeId=" + bikeId + 
               ", hours=" + hours + ", totalCost=$" + totalCost + ", status='" + status + "'}";
    }
}