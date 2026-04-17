/* CC-BY-SA bildungssprit.de | Falk Szyba @medienrocker */

/**
 * Berichtsheft Template JavaScript
 * - Automatische Wochentag-Berechnung (add view)
 * - Wochenzeitraum-Berechnung (list view)
 * - Datums-Formatierung (single view)
 * - Tag hinzufuegen / entfernen (add view)
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        initializeDayReports();
        initializeWeekdayCalculation();
        initializeWeekRange();
        formatDateContainers();
    });

    /* ------------------------------------------------------------
       Tagesberichte vorbereiten
       ------------------------------------------------------------ */
    function initializeDayReports() {
        const dayReports = document.querySelectorAll('.bs_day_report');
        dayReports.forEach(function (report, index) {
            report.classList.add('bs_day_report_' + (index + 1));
            report.setAttribute('data-day-index', index + 1);
        });
    }

    /* ------------------------------------------------------------
       Wochentag hinter Datum anzeigen (add view)
       ------------------------------------------------------------ */
    function initializeWeekdayCalculation() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(function (input) {
            input.addEventListener('change', function () {
                updateWeekdayDisplay(this);
            });
            if (input.value) {
                updateWeekdayDisplay(input);
            }
        });
    }

    function updateWeekdayDisplay(dateInput) {
        const dateValue = dateInput.value;
        if (!dateValue) return;
        const date = new Date(dateValue);
        const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        const weekday = weekdayNames[date.getDay()];
        const daySection = dateInput.closest('.bs_day_report');
        if (daySection) {
            const weekdayDisplay = daySection.querySelector('.bs_weekday_display');
            if (weekdayDisplay) {
                weekdayDisplay.textContent = ' (' + weekday + ')';
                weekdayDisplay.style.fontWeight = 'normal';
                weekdayDisplay.style.color = 'var(--bs_color-text-muted)';
            }
        }
    }

    /* ------------------------------------------------------------
       Datums-Container in dd.mm.yyyy umformatieren (single view)
       ------------------------------------------------------------ */
    function formatDateContainers() {
        const containers = document.querySelectorAll('.bs_datum_container');
        containers.forEach(function (el) {
            const text = el.textContent.trim();
            const date = parseGermanDate(text);
            if (date) {
                el.textContent = formatDateShort(date);
            }
        });
    }

    /* ------------------------------------------------------------
       Wochenzeitraum berechnen (list view)
       ------------------------------------------------------------
       Liest alle 6 Datumswerte aus data-Attributen der Zelle und
       zeigt entweder:
         - KW XX, dd.mm.yyyy - dd.mm.yyyy   (mehrere Tage)
         - KW XX, dd.mm.yyyy                (genau ein Tag)
         - leeren String                    (kein Tag eingetragen)
       ------------------------------------------------------------ */
    function initializeWeekRange() {
        const cells = document.querySelectorAll('.bs_week_range');
        cells.forEach(function (el) {
            const raw = [
                el.dataset.d1, el.dataset.d2, el.dataset.d3,
                el.dataset.d4, el.dataset.d5, el.dataset.d6
            ];
            const validDates = raw
                .map(parseGermanDate)
                .filter(function (d) { return d instanceof Date && !isNaN(d); })
                .sort(function (a, b) { return a - b; });

            if (validDates.length === 0) {
                el.textContent = '';
                return;
            }

            const first = validDates[0];
            const last = validDates[validDates.length - 1];
            const kw = getWeekNumber(first);

            if (first.getTime() === last.getTime()) {
                el.textContent = 'KW ' + kw + ', ' + formatDateShort(first);
            } else {
                el.textContent = 'KW ' + kw + ', ' + formatDateShort(first) + ' - ' + formatDateShort(last);
            }
        });
    }

    /* ------------------------------------------------------------
       Datums-Parser
       Akzeptiert:
         - "4. November 2025"  (deutsches Langformat, Moodle default)
         - "04.11.2025"        (kurz)
         - "2025-11-04"        (ISO)
       ------------------------------------------------------------ */
    function parseGermanDate(text) {
        if (!text) return null;
        text = String(text).trim();
        if (!text) return null;

        const months = {
            'januar': 1, 'februar': 2, 'maerz': 3, 'märz': 3, 'april': 4,
            'mai': 5, 'juni': 6, 'juli': 7, 'august': 8,
            'september': 9, 'oktober': 10, 'november': 11, 'dezember': 12
        };

        // Langformat: "4. November 2025"
        let m = text.match(/^(\d{1,2})\.\s*([A-Za-zäöüÄÖÜß]+)\s+(\d{4})$/);
        if (m) {
            const month = months[m[2].toLowerCase()];
            if (month) {
                return new Date(Date.UTC(parseInt(m[3], 10), month - 1, parseInt(m[1], 10)));
            }
        }

        // Kurzformat: "04.11.2025"
        m = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (m) {
            return new Date(Date.UTC(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10)));
        }

        // ISO: "2025-11-04"
        m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) {
            return new Date(Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)));
        }

        return null;
    }

    function formatDateShort(date) {
        const dd = String(date.getUTCDate()).padStart(2, '0');
        const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
        const yyyy = date.getUTCFullYear();
        return dd + '.' + mm + '.' + yyyy;
    }

    /**
     * Berechnet die Kalenderwoche (ISO 8601) fuer ein Datum
     */
    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    /* ------------------------------------------------------------
       Global Exports
       ------------------------------------------------------------ */
    window.BerichtsheftTemplate = {
        parseGermanDate: parseGermanDate,
        formatDateShort: formatDateShort,
        getWeekNumber: getWeekNumber,
        initializeWeekRange: initializeWeekRange
    };
})();

/* ============================================================
   Day Visibility Toggle (add view)
   ============================================================ */
(function () {
    'use strict';

    function initializeDayControls() {
        // Nur in der Add-Ansicht aktiv (Single-View nutzt .bs_tagesbericht_card)
        const addContainer = document.querySelector('.bs_berichtsheft_add');
        if (!addContainer) return;

        const tagesberichteSection = addContainer.querySelector('.bs_tagesberichte');
        if (!tagesberichteSection) return;

        const allDays = Array.from(tagesberichteSection.querySelectorAll('.bs_tagesbericht'));
        if (allDays.length === 0) return;

        // Nur Tag 1 initial sichtbar
        allDays.forEach(function (day, index) {
            if (index > 0) {
                day.classList.add('hidden');
            }
        });

        // Control-Container
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'bs_day_controls';

        const addBtn = document.createElement('button');
        addBtn.className = 'bs_btn bs_btn_add';
        addBtn.type = 'button';
        addBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Tag hinzufügen';
        addBtn.setAttribute('data-action', 'add-day');

        const removeBtn = document.createElement('button');
        removeBtn.className = 'bs_btn bs_btn_remove hidden';
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i class="fas fa-minus-circle"></i> Tag entfernen';
        removeBtn.setAttribute('data-action', 'remove-day');

        controlsDiv.appendChild(addBtn);
        controlsDiv.appendChild(removeBtn);
        tagesberichteSection.appendChild(controlsDiv);

        controlsDiv.addEventListener('click', function (e) {
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

    function addNextDay(allDays, addBtn, removeBtn) {
        const nextHiddenDay = allDays.find(function (day) { return day.classList.contains('hidden'); });
        if (nextHiddenDay) {
            nextHiddenDay.classList.remove('hidden');
            setTimeout(function () {
                nextHiddenDay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
        updateButtonStates(allDays, addBtn, removeBtn);
    }

    function removeLastDay(allDays, addBtn, removeBtn) {
        const visibleDays = allDays.filter(function (day) { return !day.classList.contains('hidden'); });
        if (visibleDays.length > 1) {
            const lastVisibleDay = visibleDays[visibleDays.length - 1];
            lastVisibleDay.classList.add('hidden');
            setTimeout(function () {
                const newLastDay = allDays.filter(function (day) { return !day.classList.contains('hidden'); }).pop();
                if (newLastDay) {
                    newLastDay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
        }
        updateButtonStates(allDays, addBtn, removeBtn);
    }

    function updateButtonStates(allDays, addBtn, removeBtn) {
        const visibleDays = allDays.filter(function (day) { return !day.classList.contains('hidden'); });
        const hiddenDays = allDays.filter(function (day) { return day.classList.contains('hidden'); });

        if (hiddenDays.length === 0) {
            addBtn.classList.add('hidden');
        } else {
            addBtn.classList.remove('hidden');
        }

        if (visibleDays.length > 1) {
            removeBtn.classList.remove('hidden');
        } else {
            removeBtn.classList.add('hidden');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDayControls);
    } else {
        initializeDayControls();
    }

    if (window.BerichtsheftTemplate) {
        window.BerichtsheftTemplate.initializeDayControls = initializeDayControls;
    }
})();

/* ============================================================
   Tagesbericht-Tabs (single view)
   ------------------------------------------------------------
   - Immer 6 Tabs T1-T6
   - Icon-Swap: fa-circle-check (befuellt) vs fa-circle (leer)
   - Befuellt = mind. ein Feld ausser Datum hat Inhalt
   - ARIA-Tabs-Pattern mit Keyboard-Navigation
   ============================================================ */
(function () {
    'use strict';

    function initializeDayTabs() {
        const singleContainer = document.querySelector('.bs_berichtsheft_single');
        if (!singleContainer) return;

        const section = singleContainer.querySelector('.bs_tagesberichte');
        if (!section) return;

        const cards = Array.from(section.querySelectorAll('.bs_tagesbericht_card'));
        if (cards.length === 0) return;

        // Tab-Leiste
        const tablist = document.createElement('nav');
        tablist.className = 'bs_day_tabs';
        tablist.setAttribute('role', 'tablist');
        tablist.setAttribute('aria-label', 'Tagesberichte');

        const tabs = cards.map(function (card, index) {
            const day = card.getAttribute('data-day') || String(index + 1);
            const panelId = 'bs_day_panel_' + day;
            const tabId = 'bs_day_tab_' + day;

            card.id = panelId;
            card.setAttribute('role', 'tabpanel');
            card.setAttribute('aria-labelledby', tabId);

            const isFilled = cardHasContent(card);

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'bs_day_tab' + (isFilled ? ' is-filled' : ' is-empty');
            btn.id = tabId;
            btn.setAttribute('role', 'tab');
            btn.setAttribute('data-day', day);
            btn.setAttribute('aria-controls', panelId);
            btn.setAttribute('aria-selected', 'false');
            btn.setAttribute('tabindex', '-1');

            const iconClass = isFilled ? 'fas fa-circle-check' : 'far fa-circle';
            const srLabel = isFilled ? 'Tag ' + day + ', befuellt' : 'Tag ' + day + ', nur Datum';
            btn.setAttribute('aria-label', srLabel);
            btn.innerHTML = '<i class="' + iconClass + '" aria-hidden="true"></i><span>T' + day + '</span>';

            tablist.appendChild(btn);
            return btn;
        });

        // Tab-Leiste nach Section-Title einfuegen
        const sectionTitle = section.querySelector('.bs_section_title');
        if (sectionTitle && sectionTitle.nextSibling) {
            section.insertBefore(tablist, sectionTitle.nextSibling);
        } else {
            section.insertBefore(tablist, section.firstChild);
        }

        // Alle Karten ausblenden, ersten Tab aktivieren
        cards.forEach(function (c) { c.classList.add('hidden'); });
        activateTab(0, false);

        function activateTab(idx, focusTab) {
            tabs.forEach(function (t, i) {
                const isActive = (i === idx);
                t.classList.toggle('is-active', isActive);
                t.setAttribute('aria-selected', isActive ? 'true' : 'false');
                t.setAttribute('tabindex', isActive ? '0' : '-1');
                cards[i].classList.toggle('hidden', !isActive);
            });
            if (focusTab) tabs[idx].focus();
        }

        tablist.addEventListener('click', function (e) {
            const btn = e.target.closest('.bs_day_tab');
            if (!btn) return;
            const idx = tabs.indexOf(btn);
            if (idx !== -1) activateTab(idx, true);
        });

        tablist.addEventListener('keydown', function (e) {
            const currentIdx = tabs.indexOf(document.activeElement);
            if (currentIdx === -1) return;
            let nextIdx = null;
            if (e.key === 'ArrowRight') nextIdx = (currentIdx + 1) % tabs.length;
            else if (e.key === 'ArrowLeft') nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
            else if (e.key === 'Home') nextIdx = 0;
            else if (e.key === 'End') nextIdx = tabs.length - 1;
            if (nextIdx !== null) {
                e.preventDefault();
                activateTab(nextIdx, true);
            }
        });
    }

    function cardHasContent(card) {
        // Datum wird von Moodle automatisch gesetzt -> ausschliessen
        const selectors = '.bs_text_content, .bs_aufgabe_text, .bs_info_value:not(.bs_datum_container)';
        const els = card.querySelectorAll(selectors);
        return Array.from(els).some(function (el) {
            return el.textContent.trim() !== '';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDayTabs);
    } else {
        initializeDayTabs();
    }

    if (window.BerichtsheftTemplate) {
        window.BerichtsheftTemplate.initializeDayTabs = initializeDayTabs;
    }
})();
