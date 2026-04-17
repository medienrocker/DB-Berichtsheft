# feedBOOK - Das smarte Berichtsheft

**Handreichung für Lehrkräfte - Moodle-Datenbank von bildungssprit.de**

## Überblick

Das **feedBOOK** ist eine Moodle-Datenbank, die klassische Berichtshefte digital, reflexiv und lernförderlich ersetzt. Schüler*innen dokumentieren darin eine Praktikumswoche strukturiert über bis zu sechs Tage, reflektieren ihre Tätigkeiten und ziehen am Ende der Woche ein persönliches Fazit.

Die DB verbindet formale Dokumentation (Betrieb, Aufgaben, Arbeitszeit) mit Reflexionsimpulsen (Was hat mir gefallen? Was habe ich Neues gelernt? Highlight der Woche?) und erzeugt so ein echtes Feedback-Buch, kein reines Protokoll.

**Zielgruppe:** Schüler*innen in der Berufsorientierung (Klasse 8 bis 10) während eines ein- bis dreiwöchigen Betriebspraktikums.
**Fächer:** Wirtschaft, Arbeitslehre, Berufsorientierung, Klassenrat, WAT.
**Didaktischer Kern:** Dokumentation, Selbstreflexion, strukturierte Wochenauswertung.

---

## Teil A - Technik

### A.1 Voraussetzungen

- **Moodle** ab Version 4.1 (getestet mit 4.3 und 4.5)
- Kurs mit **Bearbeitungsrechten** für die Lehrkraft
- Ein **Kursraum pro Lerngruppe** (z. B. Klasse 9a - Praktikum Herbst)
- Die Schüler*innen benötigen Moodle-Accounts mit E-Mail

### A.2 Import der Datenbank-Voreinstellung

Die DB wird als **Preset-ZIP** bereitgestellt: `feedBOOK-preset.zip`.

1. Im Kurs oben rechts auf **Bearbeiten einschalten** klicken.
2. **Aktivität hinzufügen** -> **Datenbank** auswählen.
3. Name vergeben, z. B. `feedBOOK - Woche 1`. Speichern.
4. In der neu erstellten DB auf den Reiter **Voreinstellungen** wechseln.
5. Unter **Voreinstellung importieren** die Datei `feedBOOK-preset.zip` hochladen.
6. Mit **Importieren** bestätigen. Alle Felder und Ansichten werden automatisch angelegt.

> **Hinweis:** Der Import ersetzt ggf. vorhandene Felder. Bitte **immer in einer leeren DB** importieren.

### A.3 Empfohlene Aktivitäts-Einstellungen

| Einstellung | Empfehlung | Begründung |
|-------------|-----------|------------|
| Einträge pro Teilnehmer*in | 1 (pro Woche) | Jede Woche bekommt ihre eigene DB. |
| Freigabe erforderlich | Nein | Feedback-Kultur statt Kontrolle. |
| Kommentare erlauben | Ja | Ermöglicht Peer- und Lehrkraft-Feedback. |
| Bewertung | Optional (Skala) | Nur bei formaler Benotung aktivieren. |
| Sichtbarkeit | Gruppen getrennt | Andere sehen keine fremden Einträge. |

### A.4 Rollen und Sichtbarkeit

- **Schüler*innen** sehen nur eigene Einträge (Gruppenmodus: sichtbare Gruppen = Nein).
- **Lehrkräfte** sehen alle Einträge.
- **Betreuungspersonen im Betrieb** können optional als Gastrolle eingebunden werden, wenn eine Unterschrift/Kenntnisnahme gewünscht ist (nicht Standard).

### A.5 Dateistruktur der DB

Die DB enthält:

- **Allgemeine Angaben:** Beruf, Betrieb, Abteilung, Betreuung, Arbeitszeit.
- **Bis zu 6 Tagesberichte:** je Datum, Highlight, 4 Zeitblöcke à 2 Stunden, Zusammenarbeit.
- **Wochenbewertung:** Nicht-Gut-Erlebnis, Gut-Erlebnis, Neu-Gelerntes, Highlight, Klärungsbedarf.

### A.6 Smarte Ansichten - das Besondere am feedBOOK

Die DB nutzt zwei clevere UI-Mechanismen, die das Arbeiten für Schüler*innen und Lehrkräfte deutlich komfortabler machen.

#### A.6.1 Dynamisches Eingabeformular (Add-View)

Im Eingabeformular ist **initial nur Tag 1 sichtbar**. Unterhalb der Tagesberichte stehen zwei Buttons:

- **Tag hinzufügen** blendet den nächsten Tagesbericht ein (bis maximal Tag 6).
- **Tag entfernen** blendet den letzten sichtbaren Tag wieder aus.

So sehen Schüler*innen nur die Felder, die sie wirklich brauchen. Kein endloses Scrollen durch leere Tage. Die Lernenden entscheiden selbst, wie viele Tage das Praktikum umfasst (typisch 3 bis 5 Tage pro Woche).

#### A.6.2 Tab-Navigation in der Einzelansicht (Single-View)

Beim Öffnen eines Eintrags sehen Lehrkräfte und Schüler*innen unter der Überschrift "Tagesberichte" **6 kompakte Tabs (T1 bis T6)**. Jeder Tab zeigt einen Indikator:

- **Ausgefüllter Kreis mit Haken:** Der Tag wurde inhaltlich befüllt (Aufgaben, Highlight oder Zusammenarbeit eingegeben).
- **Leerer Kreis:** Der Tag hat nur das automatisch gesetzte Datum, aber keinen Inhalt.

Ein Klick auf einen Tab zeigt den jeweiligen Tagesbericht. Vorteile:

- **Schneller Überblick:** Man sieht auf einen Blick, welche Tage echten Inhalt haben.
- **Weniger Scrollen:** Nur ein Tag gleichzeitig sichtbar.
- **Barrierefrei:** Tabs sind mit Pfeiltasten, Home und End per Tastatur bedienbar.
- **Druckfreundlich:** Beim Ausdrucken werden alle Tage automatisch untereinander angezeigt.

### A.7 Fehlerbehebung

- **Import scheitert:** ZIP-Datei nicht entpacken. Immer als `.zip` hochladen.
- **Felder fehlen nach Import:** Reihenfolge der Voreinstellungen prüfen, ggf. erneut in leerer DB importieren.
- **Datumsfelder zeigen falsches Format:** Moodle-Sprache und Zeitzone prüfen (Systemadministration).
- **Tab-Icons fehlen:** Moodle-Theme auf einen Boost-basierten Theme stellen. FontAwesome 6 Free muss aktiv sein.
- **Layout sieht kaputt aus:** Ältere Themes interpretieren `[[feldname]]` teils fehlerhaft. Boost oder Boost-Union verwenden.

---

## Teil B - Pädagogik

### B.1 Kompetenzen und Lernziele

Die Schüler*innen...

- dokumentieren ihre Praktikumstätigkeiten **strukturiert und vollständig**.
- reflektieren ihre Erfahrungen aus **verschiedenen Perspektiven** (Tätigkeit, Gefühl, Zusammenarbeit, Lernzuwachs).
- erkennen **eigene Stärken und Interessen** im Berufsalltag.
- formulieren **Klärungsbedarf und Gesprächsanlässe** für die Nachbereitung.
- üben **digitale Dokumentation** in einem schulischen Rahmen.

### B.2 Hauptszenario - Das begleitende Wochen-feedBOOK

**Setting:** Eine Klasse absolviert ein zweiwöchiges Betriebspraktikum im Rahmen der Berufsorientierung. Das feedBOOK ersetzt den klassischen Berichtsheft-Vordruck.

#### Phase 1 - Einführung (Unterrichtsstunde vor dem Praktikum, ca. 45 Minuten)

1. Lehrkraft erklärt Sinn und Struktur des feedBOOKs, **nicht Kontrolle, sondern Selbstverständigung**.
2. Gemeinsamer Blick auf das Eingabeformular. Wichtig: Tag hinzufügen und Tag entfernen zeigen. Lernende sehen nur die Felder, die sie wirklich brauchen.
3. Verabredung: **Tägliche Eingabe im Betrieb oder abends** (maximal 10 bis 15 Minuten pro Tag).
4. Klärung: Was passiert bei Technik-Problemen? (Papier-Backup als PDF vorhalten.)

#### Phase 2 - Nutzung (während des Praktikums)

- **Täglich:** Schüler*innen klicken **Tag hinzufügen**, füllen den neuen Tagesbericht aus (Datum, Highlight, 4 Aufgaben-Blöcke, Zusammenarbeit) und speichern.
- **Am Wochenende:** Schüler*innen ergänzen den Wochenbewertungs-Block (Gut, Nicht-Gut, Neu-Gelerntes, Highlight, Klärungsbedarf).
- Die Lehrkraft **kommentiert alle 2 bis 3 Tage** kurz und wertschätzend, greift aber nicht korrigierend in den Inhalt ein.

#### Phase 3 - Nachbereitung (1 bis 2 Unterrichtsstunden nach dem Praktikum)

1. **Einzelarbeit:** Jede*r Schüler*in öffnet das eigene feedBOOK. Über die Tab-Navigation (T1 bis T6) lässt sich jeder Tag einzeln durchgehen. Drei Erkenntnisse markieren.
2. **Partnerinterview:** Zu zweit: Welche Aufgaben würdest du gern wieder machen? Welche nicht?
3. **Plenum:** Cluster an der Tafel. Berufe/Tätigkeiten mit Gut- und Nicht-Gut-Anteilen.
4. **Transfer:** Jede*r formuliert ein Ziel für die weitere Berufsorientierung (passt zu mir / passt nicht zu mir).

#### Differenzierung

- **Schriftlich schwächere Schüler*innen:** Antworten dürfen in Stichpunkten erfolgen. Audio-Aufnahmen über Moodle-Kommentarfeld als Alternative.
- **Schnellere Schüler*innen:** Zusätzliche Reflexionsfrage pro Tag (Was würde ich morgen anders angehen?) als Kommentar.
- **Sprachsensible Klassen:** Glossar mit Tätigkeitsverben (sortieren, beraten, reinigen) vorab gemeinsam erstellen.

#### Tipps für Lehrkräfte

- **Keine Benotung** der Inhalte, nur die vollständige Bearbeitung als formales Kriterium werten.
- **Antwortzeit klein halten:** Lieber drei kurze Kommentare als ein langer am Ende.
- **Vertraulichkeit respektieren:** Inhalte nicht ohne Einverständnis im Plenum zitieren.
- **Tab-Indikatoren nutzen:** Ein Blick auf die Tabs zeigt sofort, wie viele Tage befüllt wurden. Ideal für schnelle Fortschritts-Checks.

### B.3 Einsatzvariante - Das Projekt-Logbuch

**Setting:** In einem **mehrwöchigen Klassenprojekt** (z. B. Schülerfirma, Medienprojekt, Bau-AG) brauchen die Schüler*innen eine strukturierte Dokumentation.

**Anpassungen gegenüber dem Hauptszenario:**

- Feld **Praktikumsberuf** wird umbenannt in **Projekttitel**.
- Feld **Betrieb** wird zu **Projektgruppe**.
- Feld **Betreuung** wird zu **Projektleitung**.
- Eingabefrequenz: Pro Projekttreffen (nicht täglich), z. B. einmal pro Woche.
- Dauer: 6 bis 10 Einträge über mehrere Wochen möglich (DB mehrfach nutzen).

**Zusätzlicher Mehrwert:** Das Projekt-Logbuch dient zur **Prozess-Reflexion** und als **Material für Präsentationen** am Projektende. Die Klärungsbedarf-Frage wird zur Projekt-Retrospektive. Die Tab-Navigation in der Einzelansicht macht die Präsentationsvorbereitung besonders schnell: Projektphasen einzeln durchklicken, Highlights extrahieren.

### B.4 Evaluation und Weiterarbeit

- **Individuell:** Portfolio-Bestandteil in der Berufsorientierungs-Mappe.
- **Klasse:** Gemeinsame Auswertung der Was-habe-ich-Neues-gelernt-Felder (anonymisiert) als Berufswissen-Pool.
- **Schule:** Die ausgefüllten feedBOOKs können als Anschauungsmaterial für die jüngeren Jahrgänge dienen (mit Einverständnis).

---

*CC-BY-SA bildungssprit.de | Falk Szyba @medienrocker*
