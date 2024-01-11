@echo off

set "directory=%~dp0"

rem Llamar a la función
call :removeFolder "assets"
call :removeFolder "build"
call :removeFolder "dist"
call :removeFolder "node_modules"
call :removeFolder "public"
call :removeFolder "src"

pause
goto :eof

:removeFolder

setlocal
set "folderPath=%directory%out\ualth-win32-x64\resources\app\%~1"
set "originPath=%directory%%~1"

if exist "%folderPath%" (
    rmdir "%folderPath%" /s /q
    echo Folder "%folderPath%" removed successfully.
) else (
    echo Folder "%folderPath%" does not exist
)

mklink /J "%folderPath%" "%originPath%"

endlocal
goto :eof