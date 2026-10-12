# Finanzen – persönlicher Finanzplaner

Installierbare Web-App (PWA) ohne Build-Schritt und ohne Abhängigkeiten.

- **Übersicht:** frei verfügbares Geld, Betrag pro Tag, Wasserfall Einnahmen → Steuerrücklage → Fixkosten → Sparziel → variable Ausgaben, Hochrechnung bis Monatsende, Fazit des Vormonats
- **Ausgaben:** Schnelleingabe über den +-Button mit 16 Kategorien, Liste nach Tagen, Filter
- **Fixkosten:** monatlich/vierteljährlich/halbjährlich/jährlich (anteilig pro Monat), pausieren ab aktuellem Monat
- **Einnahmen:** Provision & Co., Ø 3/6/12 Monate, Schwankungs-Diagramm
- **Vermögen:** Töpfe für Konten, Depot, Versicherungen, Gold, Krypto, Immobilien und Kredite mit Verlauf, Kreisdiagramm (mit/ohne Immobilie), Eigenkapital der Immobilie, Entwicklung des Nettovermögens
- **Feste Einnahmen:** z. B. Mieteinnahmen, monatlich automatisch, mit Immobilien-Bilanz (Miete vs. Kosten)
- **Statistik:** Monate im Vergleich, Jahresbilanz, Kategorien vs. Vormonat, größte Ausgaben
- **Einstellungen:** Steuerrücklage in %, Sparziel, Budget, Monatsbeginn (1. oder 15.), Backup/Import, CSV-Export

Alle Daten bleiben im Browser des Geräts (`localStorage`), nichts wird hochgeladen.

Lokal starten: `python3 -m http.server 8000` in diesem Ordner, dann http://localhost:8000 öffnen.
