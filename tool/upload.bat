@echo off
chcp 65001
set PORT=COM4

echo 重置ESP32...
mpremote connect %PORT% reset
timeout /t 2

echo 請切換至 Boot Mode
pause

echo 上傳清除腳本...
mpremote connect %PORT% fs cp clear.py :

echo 執行清空ESP32檔案系統...
mpremote connect %PORT% run clear.py

@REM echo 擦除腳本...
@REM mpremote connect %PORT% fs rm -rv :clear.py

echo 系統清空完成！
pause

cd ..

echo [main.py]
mpremote connect %PORT% fs cp main.py :

echo [env.py]
mpremote connect %PORT% fs cp env.py :

echo [game/]
mpremote connect %PORT% fs cp -r game/ :

pause
