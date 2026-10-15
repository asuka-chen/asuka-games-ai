$ErrorActionPreference='Stop';
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;
$desktop=[Environment]::GetFolderPath('Desktop');
if(-not $desktop){throw 'Desktop folder unavailable'};
$work=Join-Path ([IO.Path]::GetTempPath()) ('Star-Abyss-'+[Guid]::NewGuid().ToString('N'));
New-Item -ItemType Directory -Path $work | Out-Null;
$base='__BASE_URL__';
$manifest=Invoke-RestMethod -Uri ($base+'manifest.json');
if($manifest.sha256 -ne '__ARCHIVE_SHA256__'){throw 'Unexpected download manifest'};
$archive=Join-Path $desktop 'Star-Abyss-Windows-x64.zip';
if(Test-Path -LiteralPath $archive){$archive=Join-Path $desktop ('Star-Abyss-Windows-x64-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.zip')};
$stream=[IO.File]::Open($archive,[IO.FileMode]::CreateNew);
try {
  foreach($part in $manifest.parts){
    Write-Host ('Downloading '+$part.name);
    $file=Join-Path $work $part.name;
    Invoke-WebRequest -UseBasicParsing -Uri ($base+$part.name) -OutFile $file;
    if((Get-FileHash -Algorithm SHA256 -LiteralPath $file).Hash.ToLower() -ne $part.sha256){throw ('Checksum mismatch: '+$part.name)};
    $inputFile=[IO.File]::OpenRead($file);
    try {$inputFile.CopyTo($stream)} finally {$inputFile.Dispose()};
    Remove-Item -LiteralPath $file;
  }
} finally {$stream.Dispose()};
if((Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLower() -ne '__ARCHIVE_SHA256__'){throw 'Archive checksum mismatch'};
$destination=Join-Path $desktop ('Star-Abyss-'+(Get-Date -Format 'yyyyMMdd-HHmmss'));
Expand-Archive -LiteralPath $archive -DestinationPath $destination;
Remove-Item -LiteralPath $work;
Write-Host ('Download verified and saved to Desktop: '+$archive);
Write-Host ('Open '+(Join-Path $destination 'Star-Abyss-win32-x64/Star-Abyss.exe'));
