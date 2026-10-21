# Finanzen – persönlicher Finanzplaner

Installierbare Web-App (PWA) ohne Build-Schritt und ohne Abhängigkeiten. Alle Daten bleiben im Browser des Geräts (`localStorage`).

- **Übersicht:** frei verfügbares Geld, Betrag pro Tag, Monatsrechnung (Einnahmen → Steuer → Fixkosten → Sparziel → Variabel), Provisions-Abfrage ab dem 15., Monatsfazit, Vergleich der letzten Monate
- **Schnelleingabe (+):** Ausgabe oder Einnahme; Betrag tippen, Kategorie antippen = gespeichert, Schnellknöpfe für häufige Ausgaben, „Rückgängig“
- **Verlauf:** alle Einnahmen und Ausgaben eines Monats in einer Liste, mit Filter
- **Planung:** Fixkosten und feste Einnahmen (z. B. Miete); Betragsänderungen gelten automatisch ab dem aktuellen Monat, Immobilien-Bilanz, Provision im Schnitt
- **Vermögen:** Töpfe mit Automatik – der Monatsrest fließt in einen gewählten Topf, verknüpfte Sparpläne und Kredittilgungen werden jeden Monat gebucht; ein eingetragener Kontostand gilt als Abgleich
- **Statistik:** Jahresbilanz, Kategorien vs. Vormonat, größte Ausgaben
- **Einstellungen:** Steuerrücklage, Sparziel, Budget, Monatsbeginn, Monatsrest-Topf, Backup/Import, CSV-Export

Lokal starten: `python3 -m http.server 8000` in diesem Ordner, dann http://localhost:8000 öffnen.
