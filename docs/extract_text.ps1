$word = New-Object -ComObject Word.Application
$word.Visible = $false
$path = "c:\Users\messi\OneDrive\Escritorio\ISC\Semestre 8\Taller de Investigación II\mktpesc\JLG_AIRM_CZG_JZG_Marketplace-Escolar\docs\MarketplaceEscolar_Formato_de_Informe_Final_de_Residencias 1.docx"
$doc = $word.Documents.Open($path)
$text = $doc.Content.Text
$doc.Close()
$word.Quit()
$text | Out-File -FilePath "c:\Users\messi\OneDrive\Escritorio\ISC\Semestre 8\Taller de Investigación II\mktpesc\JLG_AIRM_CZG_JZG_Marketplace-Escolar\docs\informe_texto.txt" -Encoding UTF8
Write-Host "Done"
