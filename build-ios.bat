@echo off
rem Double-click: builds Foldifyer for iPhone in the Expo cloud (no Mac needed) and sends it to App Store Connect / TestFlight.
cd /d "%~dp0app"
set EAS_NO_VCS=1
echo.
echo [1/3] Installing app packages...
call npm.cmd install --no-audit --no-fund
if errorlevel 1 goto fail
echo.
echo [2/3] Signing in to Expo...
call npx.cmd --yes eas-cli@latest whoami || call npx.cmd --yes eas-cli@latest login
echo.
echo [3/3] Building for iPhone and sending it to App Store Connect.
echo  - Log in with your Apple ID when asked (a code will come to your iPhone).
echo  - Answer Y to: generate certificate, provisioning profile, push key, create the app.
echo  - Takes 20-40 minutes. Then the build appears in App Store Connect - TestFlight.
call npx.cmd --yes eas-cli@latest build -p ios --profile production --auto-submit
echo.
echo Done. In about 10-30 minutes the build shows up in App Store Connect - TestFlight.
pause
exit /b
:fail
echo.
echo Something went wrong while installing packages. Send Claude a screenshot of this window.
pause
