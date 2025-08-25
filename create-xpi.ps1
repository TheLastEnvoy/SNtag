# Script para criar XPI compatível com Firefox Add-ons
# Resolve o problema de barras invertidas nos caminhos

param(
    [string]$SourceDir = "build\mozilla",
    [string]$OutputName = "standard-notes-tag-addon-v2.2.0-RELEASE.xpi"
)

Write-Host "Criando XPI compatível com Firefox Add-ons..." -ForegroundColor Green

# Carregar assembly para ZIP
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Remover arquivo existente se houver
$OutputPath = Join-Path $SourceDir $OutputName
if (Test-Path $OutputPath) {
    Remove-Item $OutputPath -Force
    Write-Host "Arquivo XPI anterior removido" -ForegroundColor Yellow
}

# Criar novo arquivo ZIP
$zip = [System.IO.Compression.ZipFile]::Open($OutputPath, [System.IO.Compression.ZipArchiveMode]::Create)

try {
    # Função para adicionar arquivos recursivamente com caminhos Unix
    function Add-FilesToZip {
        param($ZipArchive, $SourcePath, $BasePath = "")
        
        Get-ChildItem $SourcePath | Where-Object { $_.Name -notlike "*.xpi" -and $_.Name -notlike "*.zip" } | ForEach-Object {
            if ($_.PSIsContainer) {
                # É um diretório - adicionar recursivamente
                $newBasePath = if ($BasePath) { "$BasePath/$($_.Name)" } else { $_.Name }
                Add-FilesToZip -ZipArchive $ZipArchive -SourcePath $_.FullName -BasePath $newBasePath
            } else {
                # É um arquivo - adicionar ao ZIP
                $entryName = if ($BasePath) { "$BasePath/$($_.Name)" } else { $_.Name }
                # Garantir que usa barras normais (Unix style)
                $entryName = $entryName -replace '\\', '/'
                
                Write-Host "Adicionando: $entryName" -ForegroundColor Cyan
                $entry = $ZipArchive.CreateEntry($entryName)
                $entryStream = $entry.Open()
                $fileStream = [System.IO.File]::OpenRead($_.FullName)
                $fileStream.CopyTo($entryStream)
                $fileStream.Close()
                $entryStream.Close()
            }
        }
    }
    
    # Adicionar todos os arquivos
    $sourceFullPath = Join-Path (Get-Location) $SourceDir
    Add-FilesToZip -ZipArchive $zip -SourcePath $sourceFullPath
    
} finally {
    # Fechar o arquivo ZIP
    $zip.Dispose()
}

# Verificar arquivo criado
if (Test-Path $OutputPath) {
    $fileInfo = Get-Item $OutputPath
    Write-Host "✅ XPI criado com sucesso!" -ForegroundColor Green
    Write-Host "Arquivo: $($fileInfo.Name)" -ForegroundColor White
    Write-Host "Tamanho: $([math]::Round($fileInfo.Length / 1KB, 1)) KB" -ForegroundColor White
    Write-Host "Localização: $($fileInfo.FullName)" -ForegroundColor Gray
} else {
    Write-Host "❌ Erro ao criar XPI" -ForegroundColor Red
}
