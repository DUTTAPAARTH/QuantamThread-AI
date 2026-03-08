@echo off
cd /d "%~dp0\bin"
echo Starting Rentamoto Bike Rental System...
echo.
REM Include all jars in ../lib using wildcard so JDBC drivers and other libs are loaded
java -cp ".;..\lib\*" Main
pause
