# Rentamoto

Rentamoto is a small Java desktop application for bike rentals. It uses a simple, non-Maven Java project layout located in the `src/` directory and includes UI panels, services, and models.

## Project structure

- `src/` - Java source code
  - `Main.java` - Application entry point
  - `models/` - `Bike`, `Rental`, `User` data classes
  - `services/` - `BikeService`, `RentalService`, `UserService`
  - `ui/` - Swing UI panels and frames (`LoginFrame`, `Dashboard`, etc.)
  - `utils/` - `DatabaseConnection`, `UIHelper`
- `bin/` - compiled classes (if using run.bat)
- `run.bat` - convenience batch script to compile/run on Windows
- `lib/` - external jars (if any)

## Prerequisites

- Windows (PowerShell recommended)
- Java 21 (LTS) or compatible JDK installed. Older JDKs may still work but Java 21 is recommended.

## Quick start (compile & run)

Open PowerShell in the project root (`D:\Downloads\Rentamoto2\Rentamoto2`) and run:

```powershell
# compile all .java files into bin/ (create bin if missing)
mkdir bin; javac -d bin (Get-ChildItem -Path src -Recurse -Filter '*.java' | ForEach-Object { $_.FullName })

# run the application
java -cp bin Main
```

Or use the provided `run.bat` (double-click or run in PowerShell):

```powershell
.\run.bat
```

## Setting Java 21 on Windows (Recommended)

1. Download and install a Java 21 JDK (e.g., Temurin/Eclipse Adoptium or Oracle).
2. Set `JAVA_HOME` and update `PATH` temporarily in PowerShell (session only):

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
java -version
```

For a permanent change, update System Environment Variables via Windows Settings > Advanced system settings > Environment Variables.

## Project notes and Java 21 upgrade guidance

- This project is a plain Java project (no Maven/Gradle). Upgrading to Java 21 typically requires:
  - Installing a Java 21 JDK and pointing `JAVA_HOME` to it.
  - Recompiling sources with `javac` from the Java 21 JDK.
  - Resolving any deprecated/removed APIs (rare for small Swing apps). Common places to check:
    - `src/utils/DatabaseConnection.java` — database driver compatibility and JDBC URL

## Troubleshooting

- "Could not find or load main class Main" — ensure `javac` compiled classes into `bin` and the `java -cp bin Main` command is run from project root.
- Database connection issues — check `src/utils/DatabaseConnection.java` for JDBC URL and credentials.
- Missing external JARs — place them in `lib/` and add them to the classpath when compiling/running:

```powershell
# include jars from lib
$libJars = -join ';', (Get-ChildItem lib -Filter '*.jar' | ForEach-Object { $_.FullName })
javac -cp $libJars -d bin (Get-ChildItem -Path src -Recurse -Filter '*.java' | ForEach-Object { $_.FullName })
java -cp "bin;$libJars" Main
```

## Where to look next

- Update `run.bat` to set `JAVA_HOME` and classpath automatically for users if desired.
- Add a `build` script (Ant/Maven/Gradle) to simplify building and dependency management.

## Contact

If you want, I can also:

- Create a `build.gradle` or `pom.xml` to manage the project and specify Java 21 compatibility.
- Add CI workflow to compile/test the project with JDK 21.

