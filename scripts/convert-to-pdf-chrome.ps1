#!/usr/bin/env pwsh
param(
  [parameter(Mandatory = $true)][string] $inputfile,
  [parameter(Mandatory = $true)][string] $outputfile
)

# Usage: ./svg2pdf.bash input.svg output.pdf

$inputfile = Resolve-Path $inputfile
$outputpath = Split-Path -Path $outputfile
$outputleaf = Split-Path -Leaf $outputfile
$outputpath = Resolve-Path $outputpath
$outputfile = Join-Path $outputpath $outputleaf
$temppath = Resolve-Path "./"
$htmlfile = Join-Path $temppath "temphtml.html"

$svgContent = Get-Content $inputfile
$svgContent = $svgContent.Replace("<svg", "<svg id=`"targetsvg`" ")


$HTML = @"
<html>
  <head>
    <style>
body {
  margin: 0;
}
    </style>
    <script>
function init() {
  const element = document.getElementById('targetsvg');
  const positionInfo = element.getBoundingClientRect();
  const height = positionInfo.height;
  const width = positionInfo.width;
  const style = document.createElement('style');
  style.innerHTML = ``@page {margin: 0; size: `${width}px `${height}px}``;
  document.head.appendChild(style);
}
window.onload = init;
    </script>
  </head>
  <body>
  <div>
  $svgContent
  </div>
  </body>
</html>
"@

Write-Output $HTML > $htmlfile

Start-Process -FilePath "google-chrome" -ArgumentList @("--no-sandbox", "--headless","--disable-gpu", "--run-all-compositor-stages-before-draw","--print-to-pdf=$outputfile",$htmlfile) -Wait

Remove-Item $htmlfile
