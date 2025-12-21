Stop-Process -Name "OpenWispr" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "electron" -Force -ErrorAction SilentlyContinue
Write-Host "Done - processes killed"
