@echo off
setlocal
cd /d "%~dp0"

where php >nul 2>&1
if errorlevel 1 (
    echo.
    echo PHP nebylo nalezeno v systemu.
    echo Nainstalujte PHP 8.2 nebo novejsi a pridejte php.exe do PATH.
    echo.
    pause
    exit /b 1
)

echo Spoustim IV Production na http://127.0.0.1:8000
start "IV Production PHP Server" cmd /k "cd /d "%~dp0" && php -S 127.0.0.1:8000 router.php"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8000
endlocal
