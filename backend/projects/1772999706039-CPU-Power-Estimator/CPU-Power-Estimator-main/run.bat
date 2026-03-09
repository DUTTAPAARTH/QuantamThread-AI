@echo off
echo Compiling CPU Power Estimator...
javac -cp "lib/*" -d bin src/com/powerestimator/*.java src/com/powerestimator/model/*.java src/com/powerestimator/service/*.java src/com/powerestimator/ui/*.java
if %ERRORLEVEL% EQU 0 (
    echo Compilation successful! Starting application...
    java -cp "lib/*;bin" com.powerestimator.PowerEstimatorApp
) else (
    echo Compilation failed!
)
pause
