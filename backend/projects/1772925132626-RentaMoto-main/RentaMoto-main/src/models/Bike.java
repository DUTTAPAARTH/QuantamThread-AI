package models;
public class Bike {
    private int id;
    private String model;
    private double ratePerHour;
    private boolean available;
    private String maintenanceStatus; 
    public Bike() {}
    public Bike(int id, String model, double ratePerHour, boolean available, String maintenanceStatus) {
        this.id = id;
        this.model = model;
        this.ratePerHour = ratePerHour;
        this.available = available;
        this.maintenanceStatus = maintenanceStatus;
    }
    public Bike(String model, double ratePerHour, boolean available, String maintenanceStatus) {
        this.model = model;
        this.ratePerHour = ratePerHour;
        this.available = available;
        this.maintenanceStatus = maintenanceStatus;
    }
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }
    public String getModel() {
        return model;
    }
    public void setModel(String model) {
        this.model = model;
    }
    public double getRatePerHour() {
        return ratePerHour;
    }
    public void setRatePerHour(double ratePerHour) {
        this.ratePerHour = ratePerHour;
    }
    public boolean isAvailable() {
        return available;
    }
    public void setAvailable(boolean available) {
        this.available = available;
    }
    public String getMaintenanceStatus() {
        return maintenanceStatus;
    }
    public void setMaintenanceStatus(String maintenanceStatus) {
        this.maintenanceStatus = maintenanceStatus;
    }
    public String getAvailabilityStatus() {
        return available ? "Available" : "Rented";
    }
    @Override
    public String toString() {
        return model + " (₹" + ratePerHour + "/hr)";
    }
}