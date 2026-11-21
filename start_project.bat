@echo off
echo ===================================
echo   Starting AjarHub Project Servers...
echo ===================================

:: تشغيل سيرفر الـ Backend في نافذة مستقلة
start cmd /k "cd backend & venv\Scripts\activate & python manage.py runserver"

:: تشغيل سيرفر الـ Frontend (React) في نافذة مستقلة
start cmd /k "cd frontend & npm run dev"

echo All servers started successfully!
pause