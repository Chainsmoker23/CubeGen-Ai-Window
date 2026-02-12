@echo off
set ELECTRON_RUN_AS_NODE=
echo Starting Electron...
"%~dp0node_modules\electron\dist\electron.exe" .
