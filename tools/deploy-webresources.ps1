<#
.SYNOPSIS
    Sube los archivos de src/ como Web Resources a Dataverse y publica los cambios.

.PARAMETER EnvironmentUrl
    URL base del entorno. Ej: https://devcapitalia.crm.dynamics.com

.PARAMETER SolutionName
    Nombre lógico de la solución. Ej: EntidadesVer21

.PARAMETER Publisher
    Prefijo del publisher sin guión bajo. Por defecto: new

.PARAMETER SrcPath
    Carpeta fuente. Por defecto: ..\src relativa al script.

.EXAMPLE
    .\deploy-webresources.ps1 -EnvironmentUrl "https://devcapitalia.crm.dynamics.com" `
        -SolutionName "EntidadesVer21"
#>
param(
    [Parameter(Mandatory)][string]$EnvironmentUrl,
    [Parameter(Mandatory)][string]$SolutionName,
    [string]$Publisher = "new",
    [string]$SrcPath   = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Resolver ruta src/ por defecto relativa al script
if (-not $SrcPath) {
    $SrcPath = Join-Path (Split-Path $MyInvocation.MyCommand.Path) "..\src"
}

# ── Mapa de tipos de web resource ─────────────────────────────────────────────
# 1=HTML 2=CSS 3=JS 4=XML 5=PNG 6=JPG 7=GIF 10=ICO 11=SVG 12=RESX
$TypeMap = @{
    ".html" = 1; ".htm" = 1
    ".css"  = 2
    ".js"   = 3
    ".xml"  = 4
    ".png"  = 5
    ".jpg"  = 6; ".jpeg" = 6
    ".gif"  = 7
    ".ico"  = 10
    ".svg"  = 11
    ".resx" = 12
}

# ── Obtener token vía MSAL.PS (Device Code Flow) ─────────────────────────────
$envBase = $EnvironmentUrl.TrimEnd("/")
$apiBase = "$envBase/api/data/v9.2"

Write-Host "`nObteniendo token para $envBase..." -ForegroundColor Cyan
Import-Module MSAL.PS -ErrorAction Stop

$clientId  = "51f81489-12ee-4a9e-aaae-a2591f45987d"   # Power Platform CLI (público)
$scopes    = "$envBase/.default"

Write-Host "Autenticando via Device Code..." -ForegroundColor Yellow
Write-Host "(Se mostrara un codigo. Ingresalo en https://microsoft.com/devicelogin)`n"

$tokenResult = Get-MsalToken -ClientId $clientId `
                              -Scopes $scopes `
                              -DeviceCode
$token = $tokenResult.AccessToken
Write-Host "`nAutenticado como: $($tokenResult.Account.Username)" -ForegroundColor Green

# ── Headers base ──────────────────────────────────────────────────────────────
$hBase = @{
    "Authorization"    = "Bearer $token"
    "Accept"           = "application/json"
    "OData-MaxVersion" = "4.0"
    "OData-Version"    = "4.0"
}

# ── Obtener solución ──────────────────────────────────────────────────────────
Write-Host "`nBuscando solucion '$SolutionName'..." -ForegroundColor Cyan
$solUri  = $apiBase + "/solutions?`$filter=uniquename eq '" + $SolutionName + "'`&`$select=solutionid,friendlyname"
$solResp = Invoke-RestMethod -Uri $solUri -Headers $hBase -Method Get

if (-not $solResp.value -or $solResp.value.Count -eq 0) {
    throw "Solucion '$SolutionName' no encontrada en el entorno."
}
$sol = $solResp.value[0]
Write-Host "Solución: $($sol.friendlyname) [$($sol.solutionid)]" -ForegroundColor Green

# ── Procesar archivos de src/ ─────────────────────────────────────────────────
$srcFull = (Resolve-Path $SrcPath).Path
$files   = Get-ChildItem -Path $srcFull -Recurse -File |
           Where-Object { $TypeMap.ContainsKey($_.Extension.ToLower()) }

Write-Host "`nArchivos a subir: $($files.Count)" -ForegroundColor Cyan
$created = 0; $updated = 0; $errors = 0

foreach ($file in $files) {
    $relPath = $file.FullName.Substring($srcFull.Length).TrimStart("\", "/").Replace("\", "/")
    $wrName  = "${Publisher}_/$relPath"        # ej. new_/scripts/forms/lead.js
    $wrType  = $TypeMap[$file.Extension.ToLower()]
    $content = [Convert]::ToBase64String([IO.File]::ReadAllBytes($file.FullName))

    Write-Host "  $wrName" -NoNewline

    try {
        $checkUri = $apiBase + "/webresourceset?`$filter=name eq '" + $wrName + "'`&`$select=webresourceid"
        $check    = Invoke-RestMethod -Uri $checkUri -Headers $hBase -Method Get

        if ($check.value -and $check.value.Count -gt 0) {
            # ── Actualizar ──────────────────────────────────────────────────
            $wrId   = $check.value[0].webresourceid
            $body   = @{ content = $content } | ConvertTo-Json -Compress
            $hPatch = $hBase + @{ "Content-Type" = "application/json"; "If-Match" = "*" }
            Invoke-RestMethod -Uri "$apiBase/webresourceset($wrId)" `
                -Headers $hPatch -Method Patch -Body $body | Out-Null
            Write-Host " [ACTUALIZADO]" -ForegroundColor Yellow
            $updated++
        } else {
            # ── Crear ───────────────────────────────────────────────────────
            $body   = @{
                name                    = $wrName
                displayname             = $file.Name
                webresourcetype         = $wrType
                content                 = $content
                "solutionid@odata.bind" = "/solutions($($sol.solutionid))"
            } | ConvertTo-Json -Compress
            $hPost  = $hBase + @{ "Content-Type" = "application/json" }
            Invoke-RestMethod -Uri "$apiBase/webresourceset" `
                -Headers $hPost -Method Post -Body $body | Out-Null
            Write-Host " [CREADO]" -ForegroundColor Green
            $created++
        }
    } catch {
        Write-Host " [ERROR] $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
}

# ── Publicar ──────────────────────────────────────────────────────────────────
if (($created + $updated) -gt 0) {
    Write-Host "`nPublicando cambios en Dataverse..." -ForegroundColor Cyan
    $hXml = $hBase + @{ "Content-Type" = "application/xml" }
    Invoke-RestMethod -Uri "$apiBase/PublishAllXml" `
        -Headers $hXml -Method Post -Body "<importexportxml></importexportxml>" | Out-Null
    Write-Host "Publicación completada." -ForegroundColor Green
}

# ── Resumen ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Creados      : $created"
Write-Host "  Actualizados : $updated"
Write-Host "  Errores      : $errors"
Write-Host "========================================" -ForegroundColor Cyan
