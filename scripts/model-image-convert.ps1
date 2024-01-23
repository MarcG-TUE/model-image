
#!/usr/bin/env pwsh
param(
  [parameter(Mandatory = $true)][string] $inputfile,
  [parameter(Mandatory = $false)][string] $outputfile
)

$startinglocation = Get-Location

$inputfile = Resolve-Path $inputfile

if ("" -ne $outputfile) {
    $outputpath = Split-Path -Path $outputfile
    $outputleaf = Split-Path -Leaf $outputfile
    $outputpath = Resolve-Path $outputpath
    $outputfile = Join-Path $outputpath $outputleaf
} else {
    $outputpath = Split-Path -Path $inputfile
    $outputbase = Split-Path -LeafBase $inputfile
    $outputpath = Resolve-Path $outputpath
    $outputfile = Join-Path $outputpath "$outputbase.svg"
}

$mypath = Split-Path -Path $MyInvocation.MyCommand.Path
Set-Location $mypath/../processor

Write-Output $inputfile
Write-Output $outputfile

npm run build
npm run start $inputfile output-file=$outputfile

Set-Location $startinglocation