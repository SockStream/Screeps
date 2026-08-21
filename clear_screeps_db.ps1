$db = "C:\Screeps\db.json"

if (Test-Path $db) {

    Write-Host "Base de donnees trouvee : $db"
    Write-Host "ATTENTION : cela supprimera toute la partie locale Screeps."
    
    $confirmation = Read-Host "Tapez OUI pour continuer"

    if ($confirmation -eq "OUI") {
        Remove-Item $db -Force
        Write-Host "Sauvegarde supprimee."
    }
    else {
        Write-Host "Operation annulee."
    }

}
else {
    Write-Host "Aucune base de donnees trouvee : $db"
}