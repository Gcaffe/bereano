@echo off
title Bereano - API Backend
echo.
echo  ==========================================
echo   BEREANO - API Backend
echo  ==========================================
echo.
cd /d C:\Proyectos\EBC\backend
uvicorn main:app --reload --port 8300
pause