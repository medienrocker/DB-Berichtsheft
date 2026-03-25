/**
 * Berichtsheft Template JavaScript
 * Automatische Wochentag-Berechnung und Wochenzeitraum-Berechnung
 */

/* Berichtsheft Template JS - by bildungssprit.de | Falk Szyba @medienrocker */

(function() {
    'use strict';
    
    // Warten bis DOM geladen ist
    document.addEventListener('DOMContentLoaded', function() {
        initializeTooltips();
        initializeDayReports();
        initializeWeekdayCalculation();
        initializeWeekRangeCalculation();
        formatDateContainers();
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
     * Formatiert deutsche Datumsangaben von "4. November 2025" zu "04.11.2025"
     */
    function formatDateContainers() {
        var months = {
            'Januar': '01', 'Februar': '02', 'März': '03', 'April': '04',
            'Mai': '05', 'Juni': '06', 'Juli': '07', 'August': '08',
            'September': '09', 'Oktober': '10', 'November': '11', 'Dezember': '12'
        };
        var containers = document.querySelectorAll('.bs_datum_container');
        containers.forEach(function(el) {
            var text = el.textContent.trim();
            var match = text.match(/^(\d{1,2})\.\s*(\w+)\s+(\d{4})$/);
            if (match) {
                var day = match[1].padStart(2, '0');
                var month = months[match[2]];
                var year = match[3];
                if (month) {
                    el.textContent = day + '.' + month + '.' + year;
                }
            }
        });
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

/**
 * Day Visibility Toggle System
 * Smart, simple and robust solution for adding/removing daily reports
 */

(function() {
    'use strict';
    
    /**
     * Initialize day visibility controls
     */
    function initializeDayControls() {
        const tagesberichteSection = document.querySelector('.bs_tagesberichte');
        if (!tagesberichteSection) return;
        
        const allDays = Array.from(tagesberichteSection.querySelectorAll('.bs_tagesbericht'));
        
        // Hide all days except day 1 on initialization
        allDays.forEach((day, index) => {
            if (index > 0) {
                day.classList.add('hidden');
            }
        });
        
        // Create control container
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'bs_day_controls';
        
        // Create "Add Day" button
        const addBtn = document.createElement('button');
        addBtn.className = 'bs_btn bs_btn_add';
        addBtn.type = 'button';
        addBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Tag hinzufügen';
        addBtn.setAttribute('data-action', 'add-day');
        
        // Create "Remove Day" button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'bs_btn bs_btn_remove hidden';
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i class="fas fa-minus-circle"></i> Tag entfernen';
        removeBtn.setAttribute('data-action', 'remove-day');
        
        // Append buttons to controls
        controlsDiv.appendChild(addBtn);
        controlsDiv.appendChild(removeBtn);
        
        // Insert controls at the end of the section (below all days)
        tagesberichteSection.appendChild(controlsDiv);
        
        // Event delegation for button clicks
        controlsDiv.addEventListener('click', function(e) {
            const button = e.target.closest('[data-action]');
            if (!button) return;
            
            const action = button.getAttribute('data-action');
            
            if (action === 'add-day') {
                addNextDay(allDays, addBtn, removeBtn);
            } else if (action === 'remove-day') {
                removeLastDay(allDays, addBtn, removeBtn);
            }
        });
    }
    
    /**
     * Show the next hidden day
     */
    function addNextDay(allDays, addBtn, removeBtn) {
        // Find the first hidden day
        const nextHiddenDay = allDays.find(day => day.classList.contains('hidden'));
        
        if (nextHiddenDay) {
            nextHiddenDay.classList.remove('hidden');
            
            // Add smooth scroll to newly visible day
            setTimeout(() => {
                nextHiddenDay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
        
        // Update button states
        updateButtonStates(allDays, addBtn, removeBtn);
    }
    
    /**
     * Hide the last visible day (symmetrical to addNextDay)
     */
    function removeLastDay(allDays, addBtn, removeBtn) {
        // Find all visible days
        const visibleDays = allDays.filter(day => !day.classList.contains('hidden'));
        
        // Get the last visible day (but never remove day 1)
        if (visibleDays.length > 1) {
            const lastVisibleDay = visibleDays[visibleDays.length - 1];
            lastVisibleDay.classList.add('hidden');
            
            // Scroll to the new last visible day
            setTimeout(() => {
                const newLastDay = allDays.filter(day => !day.classList.contains('hidden')).pop();
                if (newLastDay) {
                    newLastDay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
        }
        
        // Update button states
        updateButtonStates(allDays, addBtn, removeBtn);
    }
    
    /**
     * Update button visibility based on current state
     */
    function updateButtonStates(allDays, addBtn, removeBtn) {
        const visibleDays = allDays.filter(day => !day.classList.contains('hidden'));
        const hiddenDays = allDays.filter(day => day.classList.contains('hidden'));
        
        // Hide "Add Day" button if all days are visible
        if (hiddenDays.length === 0) {
            addBtn.classList.add('hidden');
        } else {
            addBtn.classList.remove('hidden');
        }
        
        // Show "Remove Day" button only if more than 1 day is visible
        if (visibleDays.length > 1) {
            removeBtn.classList.remove('hidden');
        } else {
            removeBtn.classList.add('hidden');
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDayControls);
    } else {
        initializeDayControls();
    }
    
    // Expose to global BerichtsheftTemplate object
    if (window.BerichtsheftTemplate) {
        window.BerichtsheftTemplate.initializeDayControls = initializeDayControls;
    }
    
})();