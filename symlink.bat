@echo off

set "directory=%~dp0"

rem Llamar a la función
call :removeFolder "out\ualth-win32-x64\resources\app\assets" "assets"
call :removeFolder "out\ualth-win32-x64\resources\app\build" "build"
call :removeFolder "out\ualth-win32-x64\resources\app\dist" "dist"
call :removeFolder "out\ualth-win32-x64\resources\app\node_modules" "node_modules"
call :removeFolder "out\ualth-win32-x64\resources\app\public" "public"
call :removeFolder "out\ualth-win32-x64\resources\app\src" "src"
call :removeFolder "build\icons" "public\icons"

pause
goto :eof

:removeFolder

setlocal
set "folderPath=%directory%%~1"
set "originPath=%directory%%~2"

if exist "%folderPath%" (
    rmdir "%folderPath%" /s /q
    echo Folder "%folderPath%" removed successfully.
) else (
    echo Folder "%folderPath%" does not exist
)

mklink /J "%folderPath%" "%originPath%"

endlocal
goto :eof