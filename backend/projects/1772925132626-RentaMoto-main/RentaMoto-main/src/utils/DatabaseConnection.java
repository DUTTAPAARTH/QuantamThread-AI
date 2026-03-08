package utils;

import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.sql.Connection;
import java.sql.Driver;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseConnection {
    private static final String DB_URL = "jdbc:mysql://localhost:3306/";
    private static final String DATABASE_NAME = "rentamoto_db";
    private static final String FULL_URL = DB_URL + DATABASE_NAME;
    private static final String USERNAME = "root"; 
    private static final String PASSWORD = "yashstark15"; 
    
    private static Connection connection = null;
    
    static {
        try {
           
            String classPath = DatabaseConnection.class.getProtectionDomain().getCodeSource().getLocation().getPath();
            File currentDir = new File(classPath).getParentFile();
           
            File jarFile = null;
            String[] possiblePaths = {
                "lib/mysql-connector-j-9.4.0.jar",                        
                "../lib/mysql-connector-j-9.4.0.jar",                        
                "../../lib/mysql-connector-j-9.4.0.jar",                     
                "d:/Downloads/Rentamoto2/Rentamoto2/lib/mysql-connector-j-9.4.0.jar",  
                "D:/Downloads/Rentamoto2/Rentamoto2/lib/mysql-connector-j-9.4.0.jar"   
            };
            
            System.out.println("🔍 Searching for MySQL jar...");
            System.out.println("Current directory: " + new File(".").getAbsolutePath());
            System.out.println("Class loaded from: " + classPath);
            
            for (String path : possiblePaths) {
                File testFile = new File(path);
                System.out.println("Trying: " + testFile.getAbsolutePath() + " - " + (testFile.exists() ? "FOUND" : "not found"));
                if (testFile.exists()) {
                    jarFile = testFile;
                    break;
                }
            }
            
            if (jarFile != null && jarFile.exists()) {
                // Load the driver using URLClassLoader
                URL jarUrl = jarFile.toURI().toURL();
                URLClassLoader classLoader = new URLClassLoader(new URL[]{jarUrl}, DatabaseConnection.class.getClassLoader());
                Class<?> driverClass = Class.forName("com.mysql.cj.jdbc.Driver", true, classLoader);
                Driver driver = (Driver) driverClass.getDeclaredConstructor().newInstance();
                DriverManager.registerDriver(new DriverShim(driver));
                System.out.println("✅ MySQL JDBC Driver loaded successfully from: " + jarFile.getAbsolutePath());
            } else {
                // Fallback: try loading from classpath
                System.out.println("⚠️ Jar not found in any location, trying classpath...");
                Class.forName("com.mysql.cj.jdbc.Driver");
                System.out.println("✅ MySQL JDBC Driver loaded successfully from classpath!");
            }
        } catch (Exception e) {
            System.err.println("❌ MySQL JDBC Driver not found!");
            System.err.println("Current directory: " + new File(".").getAbsolutePath());
            e.printStackTrace();
            throw new ExceptionInInitializerError("MySQL JDBC Driver not found. See earlier stack trace.");
        }
    }
    
    // Wrapper class for the driver to work with DriverManager
    private static class DriverShim implements Driver {
        private Driver driver;
        
        DriverShim(Driver driver) {
            this.driver = driver;
        }
        
        public Connection connect(String url, java.util.Properties info) throws SQLException {
            return driver.connect(url, info);
        }
        
        public boolean acceptsURL(String url) throws SQLException {
            return driver.acceptsURL(url);
        }
        
        public java.sql.DriverPropertyInfo[] getPropertyInfo(String url, java.util.Properties info) throws SQLException {
            return driver.getPropertyInfo(url, info);
        }
        
        public int getMajorVersion() {
            return driver.getMajorVersion();
        }
        
        public int getMinorVersion() {
            return driver.getMinorVersion();
        }
        
        public boolean jdbcCompliant() {
            return driver.jdbcCompliant();
        }
        
        public java.util.logging.Logger getParentLogger() throws java.sql.SQLFeatureNotSupportedException {
            return driver.getParentLogger();
        }
    }
    
    public static Connection getConnection() {
        try {
           
            Connection conn = DriverManager.getConnection(FULL_URL, USERNAME, PASSWORD);
            
          
            if (connection == null) {
                createDatabaseIfNotExists();
                connection = DriverManager.getConnection(FULL_URL, USERNAME, PASSWORD);
                System.out.println("✅ Connected to MySQL database: " + DATABASE_NAME);
                createTablesIfNotExist();
            }
            
            return conn;
        } catch (SQLException e) {
            System.err.println("❌ Error connecting to database: " + e.getMessage());
            e.printStackTrace();
            
            throw new RuntimeException("Failed to get database connection", e);
        }
    }
    
    private static void createDatabaseIfNotExists() {
        try (Connection tempConnection = DriverManager.getConnection(DB_URL, USERNAME, PASSWORD);
             Statement statement = tempConnection.createStatement()) {
            
            String createDBQuery = "CREATE DATABASE IF NOT EXISTS " + DATABASE_NAME;
            statement.executeUpdate(createDBQuery);
            System.out.println("✅ Database '" + DATABASE_NAME + "' is ready!");
            
        } catch (SQLException e) {
            System.err.println("❌ Error creating database: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static void createTablesIfNotExist() {
        try (Statement statement = connection.createStatement()) {
            
            // Create users table
            String createUsersTable = """
                CREATE TABLE IF NOT EXISTS users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    role VARCHAR(20) NOT NULL DEFAULT 'customer',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """;
            statement.executeUpdate(createUsersTable);
            
            // Create bikes table
            String createBikesTable = """
                CREATE TABLE IF NOT EXISTS bikes (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    model VARCHAR(100) NOT NULL,
                    rate_per_hour DECIMAL(10,2) NOT NULL,
                    available BOOLEAN DEFAULT TRUE,
                    maintenance_status VARCHAR(50) DEFAULT 'Good',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """;
            statement.executeUpdate(createBikesTable);
            
            // Create rentals table
            String createRentalsTable = """
                CREATE TABLE IF NOT EXISTS rentals (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NOT NULL,
                    bike_id INT NOT NULL,
                    hours INT NOT NULL,
                    total_cost DECIMAL(10,2) NOT NULL,
                    status VARCHAR(20) DEFAULT 'active',
                    rental_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    return_date TIMESTAMP NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (bike_id) REFERENCES bikes(id) ON DELETE CASCADE
                )
            """;
            statement.executeUpdate(createRentalsTable);
            
            System.out.println("✅ Database tables created successfully!");
            
            // Insert default data if tables are empty
            insertDefaultData();
            
        } catch (SQLException e) {
            System.err.println("❌ Error creating tables: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static void insertDefaultData() {
        try (Statement statement = connection.createStatement()) {
            
            // Check if users table is empty and insert default users
            var rs = statement.executeQuery("SELECT COUNT(*) FROM users");
            if (rs.next() && rs.getInt(1) == 0) {
                String insertUsers = """
                    INSERT INTO users (username, password, name, role) VALUES
                    ('admin', 'admin123', 'Admin User', 'admin'),
                    ('user1', 'pass123', 'John Doe', 'customer'),
                    ('user2', 'pass123', 'Jane Smith', 'customer')
                """;
                statement.executeUpdate(insertUsers);
                System.out.println("✅ Default users inserted!");
            }
            
            // Check if bikes table is empty and insert default bikes
            rs = statement.executeQuery("SELECT COUNT(*) FROM bikes");
            if (rs.next() && rs.getInt(1) == 0) {
                String insertBikes = """
                    INSERT INTO bikes (model, rate_per_hour, available, maintenance_status) VALUES
                    ('Mountain Bike Pro', 15.00, TRUE, 'Excellent'),
                    ('City Cruiser', 10.00, TRUE, 'Good'),
                    ('Electric Bike', 25.00, TRUE, 'Excellent'),
                    ('Road Bike Speed', 20.00, TRUE, 'Good'),
                    ('Hybrid Comfort', 12.00, TRUE, 'Good'),
                    ('BMX Stunt', 18.00, TRUE, 'Fair'),
                    ('Touring Bike', 22.00, TRUE, 'Excellent'),
                    ('Folding Bike', 14.00, TRUE, 'Good')
                """;
                statement.executeUpdate(insertBikes);
                System.out.println("✅ Default bikes inserted!");
            }
            
        } catch (SQLException e) {
            System.err.println("❌ Error inserting default data: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public static void closeConnection() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
                System.out.println("✅ Database connection closed!");
            }
        } catch (SQLException e) {
            System.err.println("❌ Error closing connection: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public static boolean testConnection() {
        try {
            Connection testConn = getConnection();
            if (testConn != null && !testConn.isClosed()) {
                System.out.println("✅ Database connection test successful!");
                return true;
            }
        } catch (SQLException e) {
            System.err.println("❌ Database connection test failed: " + e.getMessage());
        }
        return false;
    }
}