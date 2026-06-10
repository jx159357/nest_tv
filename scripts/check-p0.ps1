param(
  [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot

function Invoke-Check {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [string]$Directory,

    [Parameter(Mandatory = $true)]
    [string]$Executable,

    [string[]]$Arguments = @()
  )

  $WorkDir = Join-Path $Root $Directory
  Write-Host ""
  Write-Host "==> $Name"
  Push-Location $WorkDir
  try {
    Write-Host "Command: $Executable $($Arguments -join ' ')"
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "$Name failed with exit code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
}

Invoke-Check -Name 'frontend:lint' -Directory 'frontend' -Executable 'npm.cmd' -Arguments @('run', 'lint:check')
Invoke-Check -Name 'backend:lint' -Directory 'backend' -Executable 'npm.cmd' -Arguments @('run', 'lint:check')
Invoke-Check -Name 'frontend:type-check' -Directory 'frontend' -Executable 'npm.cmd' -Arguments @('run', 'type-check')
Invoke-Check -Name 'backend:type-check' -Directory 'backend' -Executable 'npm.cmd' -Arguments @('run', 'type-check')

if (-not $SkipTests) {
  Invoke-Check -Name 'frontend:test' -Directory 'frontend' -Executable 'npm.cmd' -Arguments @('test')
  Invoke-Check -Name 'backend:test' -Directory 'backend' -Executable 'npm.cmd' -Arguments @('test')
}

Invoke-Check -Name 'frontend:build' -Directory 'frontend' -Executable 'npm.cmd' -Arguments @('run', 'build')
Invoke-Check -Name 'backend:build' -Directory 'backend' -Executable 'npm.cmd' -Arguments @('run', 'build')

Write-Host ""
Write-Host "P0 checks passed."
