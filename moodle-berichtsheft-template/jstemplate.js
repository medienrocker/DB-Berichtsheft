/**
 * Berichtsheft Template JavaScript
 * Automatische Wochentag-Berechnung und Wochenzeitraum-Berechnung
 */

(function() {
    'use strict';
    
    // Warten bis DOM geladen ist
    document.addEventListener('DOMContentLoaded', function() {
        initializeTooltips();
        initializeDayReports();
        initializeWeekdayCalculation();
        initializeWeekRangeCalculation();
    });
    
    /**
     * Initialisiert Tooltip-Funktionalität für Highlight-Icons
     */
    function initializeTooltips() {
        const highlightIcons = document.querySelectorAll('.bs_highlight_icon');
        
        highlightIcons.forEach(function(icon) {
            // Erstelle Tooltip-Element
            const tooltip = document.createElement('div');
            tooltip.className = 'bs_tooltip';
            tooltip.textContent = icon.getAttribute('title') || 'Highlight der Woche';
            tooltip.style.cssText = `
                position: absolute;
                background: #333;
                color: #fff;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 0.8rem;
                z-index: 1000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                max-width: 200px;
                word-wrap: break-word;
            `;
            
            // Füge Tooltip zum Body hinzu
            document.body.appendChild(tooltip);
            
            // Event Listener für Mouse-Events
            icon.addEventListener('mouseenter', function(e) {
                const rect = icon.getBoundingClientRect();
                tooltip.style.left = (rect.left + window.scrollX) + 'px';
                tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
                tooltip.style.opacity = '1';
            });
            
            icon.addEventListener('mouseleave', function() {
                tooltip.style.opacity = '0';
            });
            
            icon.addEventListener('mousemove', function(e) {
                const rect = icon.getBoundingClientRect();
                tooltip.style.left = (rect.left + window.scrollX) + 'px';
                tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
            });
        });
    }
    
    /**
     * Initialisiert Funktionalität für Tagesberichte
     */
    function initializeDayReports() {
        const dayReports = document.querySelectorAll('.bs_day_report');
        
        dayReports.forEach(function(report, index) {
            // Füge CSS-Klasse für zukünftige Animationen hinzu
            report.classList.add('bs_day_report_' + (index + 1));
            
            // Vorbereitung für spätere show/hide Funktionalität
            report.setAttribute('data-day-index', index + 1);
        });
    }
    
    /**
     * Initialisiert automatische Wochentag-Berechnung
     */
    function initializeWeekdayCalculation() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        
        dateInputs.forEach(function(input) {
            input.addEventListener('change', function() {
                updateWeekdayDisplay(this);
            });
            
            // Initiale Berechnung falls bereits ein Wert vorhanden ist
            if (input.value) {
                updateWeekdayDisplay(input);
            }
        });
    }
    
    /**
     * Aktualisiert die Wochentag-Anzeige basierend auf dem eingegebenen Datum
     */
    function updateWeekdayDisplay(dateInput) {
        const dateValue = dateInput.value;
        if (!dateValue) return;
        
        const date = new Date(dateValue);
        const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        const weekday = weekdayNames[date.getDay()];
        
        // Finde das entsprechende bs_weekday_display Element
        const daySection = dateInput.closest('.bs_day_report');
        if (daySection) {
            const weekdayDisplay = daySection.querySelector('.bs_weekday_display');
            if (weekdayDisplay) {
                weekdayDisplay.textContent = ' (' + weekday + ')';
                weekdayDisplay.style.fontWeight = 'normal';
                weekdayDisplay.style.color = '#6c757d';
            }
        }
    }
    
    /**
     * Initialisiert automatische Wochenzeitraum-Berechnung für Listenansicht
     */
    function initializeWeekRangeCalculation() {
        // Diese Funktion wird in der Listenansicht verwendet
        // Sie berechnet den Wochenzeitraum basierend auf den eingegebenen Daten
        const weekRangeElements = document.querySelectorAll('.bs_week_range');
        
        weekRangeElements.forEach(function(element) {
            // Hier würde normalerweise die Berechnung aus den Datenbankfeldern erfolgen
            // Da wir in Moodle sind, wird dies über PHP/Moodle-Template-Engine gehandhabt
            // Das JavaScript dient als Fallback für dynamische Updates
        });
    }
    
    /**
     * Berechnet den Wochenzeitraum aus einem Array von Daten
     */
    function calculateWeekRange(dates) {
        if (!dates || dates.length === 0) return '';
        
        // Filtere leere Daten heraus
        const validDates = dates.filter(date => date && date.trim() !== '');
        if (validDates.length === 0) return '';
        
        // Konvertiere zu Date-Objekten und sortiere
        const dateObjects = validDates.map(dateStr => new Date(dateStr)).sort((a, b) => a - b);
        
        const firstDate = dateObjects[0];
        const lastDate = dateObjects[dateObjects.length - 1];
        
        // Berechne Kalenderwoche
        const weekNumber = getWeekNumber(firstDate);
        
        // Formatiere Datum
        const formatDate = (date) => {
            return date.getDate().toString().padStart(2, '0') + '.' + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + '.' + 
                   date.getFullYear();
        };
        
        if (firstDate.getTime() === lastDate.getTime()) {
            return 'KW ' + weekNumber + ', ' + formatDate(firstDate);
        } else {
            return 'KW ' + weekNumber + ', ' + formatDate(firstDate) + ' - ' + formatDate(lastDate);
        }
    }
    
    /**
     * Berechnet die Kalenderwoche für ein gegebenes Datum
     */
    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    /**
     * Hilfsfunktion zum Ein-/Ausblenden von Tagesberichten
     */
    function toggleDayReport(dayIndex) {
        const report = document.querySelector('.bs_day_report_' + dayIndex);
        if (report) {
            const isVisible = report.style.display !== 'none';
            report.style.display = isVisible ? 'none' : 'block';
            return !isVisible;
        }
        return false;
    }
    
    /**
     * Hilfsfunktion zum Hinzufügen eines neuen Tagesberichts
     */
    function addDayReport() {
        // Hier kann später Ihr Code für das Hinzufügen neuer Tagesberichte integriert werden
        console.log('Add day report functionality - ready for integration');
    }
    
    /**
     * Hilfsfunktion zum Entfernen eines Tagesberichts
     */
    function removeDayReport(dayIndex) {
        const report = document.querySelector('.bs_day_report_' + dayIndex);
        if (report) {
            report.remove();
            return true;
        }
        return false;
    }
    
    /**
     * Validierungsfunktion für Formulareingaben
     */
    function validateForm() {
        const requiredFields = document.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(function(field) {
            if (!field.value.trim()) {
                field.style.borderColor = '#dc3545';
                isValid = false;
            } else {
                field.style.borderColor = '#28a745';
            }
        });
        
        return isValid;
    }
    
    /**
     * Hilfsfunktion für responsive Tabellen
     */
    function handleResponsiveTable() {
        const table = document.getElementById('DBName');
        if (table && window.innerWidth < 768) {
            table.classList.add('bs_mobile_table');
        }
    }
    
    // Event Listener für Window Resize
    window.addEventListener('resize', handleResponsiveTable);
    
    // Initialisiere responsive Tabellen beim Laden
    handleResponsiveTable();
    
    // Globale Funktionen für externe Nutzung verfügbar machen
    window.BerichtsheftTemplate = {
        toggleDayReport: toggleDayReport,
        addDayReport: addDayReport,
        removeDayReport: removeDayReport,
        validateForm: validateForm,
        initializeTooltips: initializeTooltips,
        initializeDayReports: initializeDayReports,
        initializeWeekdayCalculation: initializeWeekdayCalculation,
        calculateWeekRange: calculateWeekRange,
        getWeekNumber: getWeekNumber
    };
    
})();

/**
 * Dokumentation für Integration:
 * 
 * 1. Automatische Wochentag-Berechnung:
 *    - initializeWeekdayCalculation() - Initialisiert Event Listener für Datum-Eingaben
 *    - updateWeekdayDisplay() - Aktualisiert Wochentag-Anzeige basierend auf Datum
 * 
 * 2. Wochenzeitraum-Berechnung:
 *    - calculateWeekRange(dates) - Berechnet Wochenzeitraum aus Datum-Array
 *    - getWeekNumber(date) - Berechnet Kalenderwoche für ein Datum
 * 
 * 3. Integration in Moodle:
 *    - Für Listenansicht: Verwende calculateWeekRange() in PHP/Moodle-Template
 *    - Für Einzelansicht: JavaScript aktualisiert Wochentage automatisch
 * 
 * 4. Beispiel für Moodle-Integration:
 *    PHP: $weekRange = calculateWeekRange([$datum1, $datum2, $datum3, $datum4, $datum5, $datum6]);
 *    Template: <td class="bs_week_range"><?php echo $weekRange; ?></td>
 */
