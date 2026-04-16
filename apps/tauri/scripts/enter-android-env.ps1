$ErrorActionPreference = 'Stop'

$javaHome = 'D:\scoop\apps\android-studio\current\jbr'
$androidHome = 'C:\Users\zzz\AppData\Local\Android\Sdk'
$ndkHome = 'C:\Users\zzz\AppData\Local\Android\Sdk\ndk\30.0.14904198'

$requiredPaths = @(
    (Join-Path $javaHome 'bin\java.exe')
    (Join-Path $androidHome 'platform-tools')
    (Join-Path $androidHome 'platforms')
    $ndkHome
)

foreach ($path in $requiredPaths) {
    if (-not (Test-Path $path)) {
        throw "Path not found: $path"
    }
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidHome
$env:ANDROID_SDK_ROOT = $androidHome
$env:NDK_HOME = $ndkHome

$javaBin = Join-Path $javaHome 'bin'
if (($env:PATH -split ';') -notcontains $javaBin) {
    $env:PATH = "$javaBin;$env:PATH"
}

Write-Host 'Injected Android environment into current shell:'
Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "ANDROID_SDK_ROOT=$env:ANDROID_SDK_ROOT"
Write-Host "NDK_HOME=$env:NDK_HOME"
