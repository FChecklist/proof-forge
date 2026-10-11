@echo off
cd /d "%~dp0"
echo Proof Forge on http://127.0.0.1:8210/index.html  (close this window to stop)
start "" http://127.0.0.1:8210/index.html
python -m http.server 8210 --bind 127.0.0.1
