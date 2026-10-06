@echo off
title BOT LAPORAN KASIR - HOST LAN (PORT 6767)
color 0b
echo ===================================================
echo       MEMULAI BOT LAPORAN KASIR OTOMATIS
echo ===================================================
echo.
echo Akses Web:
echo   - PC Host : http://localhost:8080/lap-kasir
echo   - PC Lain : http://172.26.22.6:8080/lap-kasir
echo.
echo ===================================================
cd /d "%~dp0"
node server.js
pause
