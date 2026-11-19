/* CC BY-SA 4.0 bildungssprit.de | Falk Szyba @medienrocker */

(function () {
  'use strict';

  var MONTHS = {
    'januar': 1, 'jan': 1, 'jän': 1, 'january': 1,
    'februar': 2, 'feb': 2, 'february': 2,
    'märz': 3, 'maerz': 3, 'mär': 3, 'mrz': 3, 'march': 3,
    'april': 4, 'apr': 4,
    'mai': 5, 'may': 5,
    'juni': 6, 'jun': 6, 'june': 6,
    'juli': 7, 'jul': 7, 'july': 7,
    'august': 8, 'aug': 8,
    'september': 9, 'sep': 9, 'sept': 9,
    'oktober': 10, 'okt': 10, 'october': 10, 'oct': 10,
    'november': 11, 'nov': 11,
    'dezember': 12, 'dez': 12, 'december': 12, 'dec': 12
  };

  function pad2(value) {
    var s = String(value);
    return s.length < 2 ? '0' + s : s;
  }

  function makeDate(year, month, day) {
    var d = new Date(Date.UTC(year, month - 1, day));
    return isNaN(d.getTime()) ? null : d;
  }

  /* Liest Moodles Datumsanzeige („5. November 2026“), 05.11.2026 oder 2026-11-05. */
  function parseDate(text) {
    var s = String(text || '').replace(/\s+/g, ' ').trim();
    if (!s) {
      return null;
    }
    var m = s.match(/^(\d{1,2})\.?\s+([A-Za-zÄÖÜäöüß]+)\.?\s+(\d{4})$/);
    if (m && MONTHS[m[2].toLowerCase()]) {
      return makeDate(parseInt(m[3], 10), MONTHS[m[2].toLowerCase()], parseInt(m[1], 10));
    }
    m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) {
      return makeDate(parseInt(m[3], 10), parseInt(m[2], 10), parseInt(m[1], 10));
    }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      return makeDate(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10));
    }
    return null;
  }

  function formatShort(date) {
    return pad2(date.getUTCDate()) + '.' + pad2(date.getUTCMonth() + 1) + '.' + date.getUTCFullYear();
  }

  /* Kalenderwoche nach ISO 8601. */
  function weekNumber(date) {
    var d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /* „KW 45, 02.11.2026 bis 06.11.2026“ aus einer Liste von Daten, leer ohne Datum. */
  function weekRange(dates) {
    var valid = dates.filter(function (d) { return d; }).sort(function (a, b) { return a - b; });
    if (!valid.length) {
      return '';
    }
    var first = valid[0];
    var last = valid[valid.length - 1];
    var text = 'KW ' + weekNumber(first) + ', ' + formatShort(first);
    if (last.getTime() !== first.getTime()) {
      text += ' bis ' + formatShort(last);
    }
    return text;
  }

  function hasText(element) {
    return (element.textContent || '').replace(/\s+/g, '').length > 0;
  }

  /* ---------- Eingabeansicht ---------- */

  /* Eigenes Label mit dem Eingabefeld verbinden, das Moodle erzeugt. Moodle bringt ein
     verstecktes Label mit dem Feldnamen mit (zum Beispiel „Aufgabe1_1“). aria-labelledby
     sorgt dafür, dass Screenreader nur die eigene Frage vorlesen. */
  function linkLabels(view) {
    var groups = view.querySelectorAll('.bs_field_group[data-bs-field]');
    for (var i = 0; i < groups.length; i++) {
      var group = groups[i];
      var label = group.querySelector('.bs_question, .bs_question_time');
      var controls = group.querySelectorAll('input:not([type="hidden"]), select, textarea');
      if (!label || !label.id || !controls.length) {
        continue;
      }
      var required = group.getAttribute('data-bs-required') === 'true';
      var fieldset = group.querySelector('fieldset');
      if (controls.length === 1 && controls[0].type !== 'radio') {
        if (!controls[0].id) {
          controls[0].id = 'bs_input_' + group.getAttribute('data-bs-field');
        }
        label.setAttribute('for', controls[0].id);
        controls[0].setAttribute('aria-labelledby', label.id);
        if (required) {
          controls[0].setAttribute('aria-required', 'true');
        }
      } else if (fieldset) {
        fieldset.setAttribute('role', 'radiogroup');
        fieldset.setAttribute('aria-labelledby', label.id);
        if (required) {
          fieldset.setAttribute('aria-required', 'true');
        }
      } else {
        group.setAttribute('role', 'group');
        group.setAttribute('aria-labelledby', label.id);
      }
    }
  }

  function dayHasText(day) {
    var fields = day.querySelectorAll('input[type="text"], textarea');
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].value.replace(/<[^>]*>/g, '').trim() !== '') {
        return true;
      }
    }
    return false;
  }

  /* Moodle schickt für jedes Datumsfeld immer einen Wert, voreingestellt ist heute.
     Ausgeblendete Tage bekommen deshalb gesperrte Datumsfelder: Gesperrte Felder
     sendet der Browser nicht, und der Wochenzeitraum bleibt richtig. */
  function setDayVisible(day, visible) {
    day.classList.toggle('bs_is_hidden', !visible);
    var selects = day.querySelectorAll('[data-bs-field^="Datum"] select');
    for (var i = 0; i < selects.length; i++) {
      selects[i].disabled = !visible;
    }
  }

  function makeButton(className, iconName, label, action) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'bs_button ' + className;
    button.setAttribute('data-bs-action', action);
    var icon = document.createElement('i');
    icon.className = 'fa ' + iconName;
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);
    button.appendChild(document.createTextNode(' ' + label));
    return button;
  }

  function setupDays(view) {
    var section = view.querySelector('.bs_tagesberichte');
    if (!section) {
      return;
    }
    var days = Array.prototype.slice.call(section.querySelectorAll('.bs_tagesbericht'));
    if (!days.length) {
      return;
    }
    var status = view.querySelector('#bs_day_status');

    /* Beim Bearbeiten bleiben alle Tage bis zum letzten mit Text sichtbar. */
    var visibleCount = 1;
    days.forEach(function (day, index) {
      if (dayHasText(day)) {
        visibleCount = index + 1;
      }
    });

    var controls = document.createElement('div');
    controls.className = 'bs_day_controls';
    var addButton = makeButton('bs_button_primary', 'fa-plus', 'Tag hinzufügen', 'add-day');
    var removeButton = makeButton('bs_button_secondary', 'fa-minus', 'Letzten Tag ausblenden', 'remove-day');
    controls.appendChild(addButton);
    controls.appendChild(removeButton);
    section.insertBefore(controls, status || null);

    function render() {
      days.forEach(function (day, index) {
        setDayVisible(day, index < visibleCount);
      });
      addButton.hidden = visibleCount >= days.length;
      removeButton.hidden = visibleCount <= 1;
    }

    function announce(text) {
      if (status) {
        status.textContent = text;
      }
    }

    controls.addEventListener('click', function (event) {
      var button = event.target.closest('[data-bs-action]');
      if (!button) {
        return;
      }
      if (button.getAttribute('data-bs-action') === 'add-day' && visibleCount < days.length) {
        visibleCount++;
        render();
        var title = days[visibleCount - 1].querySelector('.bs_day_title');
        if (title) {
          title.focus();
        }
        announce('Tag ' + visibleCount + ' hinzugefügt.');
      } else if (button.getAttribute('data-bs-action') === 'remove-day' && visibleCount > 1) {
        visibleCount--;
        render();
        (removeButton.hidden ? addButton : removeButton).focus();
        announce('Tag ' + (visibleCount + 1) + ' ausgeblendet. Text darin bleibt erhalten.');
      }
    });

    render();
  }

  function selectedDate(group) {
    var selects = group.querySelectorAll('select');
    var parts = {};
    for (var i = 0; i < selects.length; i++) {
      if (selects[i].disabled) {
        return null;
      }
      var name = selects[i].name || '';
      var key = name.slice(name.lastIndexOf('_') + 1);
      parts[key] = parseInt(selects[i].value, 10);
    }
    if (!parts.day || !parts.month || !parts.year) {
      return null;
    }
    return makeDate(parts.year, parts.month, parts.day);
  }

  /* Füllt das versteckte Feld Wochenzeitraum beim Speichern aus den sichtbaren Tagen. */
  function setupWeekField(view) {
    var holder = view.querySelector('[data-bs-field="Wochenzeitraum"]');
    var input = holder ? holder.querySelector('input[type="text"]') : null;
    var form = view.closest('form');
    if (!input || !form) {
      return;
    }
    form.addEventListener('submit', function () {
      var groups = view.querySelectorAll('.bs_tagesbericht:not(.bs_is_hidden) [data-bs-field^="Datum"]');
      var dates = [];
      for (var i = 0; i < groups.length; i++) {
        dates.push(selectedDate(groups[i]));
      }
      input.value = weekRange(dates);
    });
  }

  /* ---------- Einzelansicht ---------- */

  function formatDates(view) {
    var cells = view.querySelectorAll('.bs_datum_container');
    for (var i = 0; i < cells.length; i++) {
      var date = parseDate(cells[i].textContent);
      if (date) {
        cells[i].textContent = formatShort(date);
      }
    }
    var saved = view.querySelector('.bs_week_saved');
    if (saved && !hasText(saved)) {
      saved.closest('.bs_detail_row').classList.add('bs_is_hidden');
    }
  }

  function cardHasContent(card) {
    var parts = card.querySelectorAll('.bs_text_content, .bs_aufgabe_text, .bs_detail_value:not(.bs_datum_container)');
    for (var i = 0; i < parts.length; i++) {
      if (hasText(parts[i])) {
        return true;
      }
    }
    return false;
  }

  /* Reiter T1 bis T6 nach dem ARIA-Muster „Tabs“, mit Pfeiltasten, Pos1 und Ende. */
  function setupDayTabs(view) {
    var section = view.querySelector('.bs_tagesberichte');
    if (!section) {
      return;
    }
    var cards = Array.prototype.slice.call(section.querySelectorAll('.bs_tagesbericht_card'));
    if (!cards.length) {
      return;
    }
    var tablist = document.createElement('div');
    tablist.className = 'bs_day_tabs';
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Tagesberichte');

    var tabs = cards.map(function (card, index) {
      var day = card.getAttribute('data-day') || String(index + 1);
      var filled = cardHasContent(card);
      card.id = 'bs_day_panel_' + day;
      card.setAttribute('role', 'tabpanel');
      card.setAttribute('aria-labelledby', 'bs_day_tab_' + day);
      card.setAttribute('tabindex', '0');

      var tab = document.createElement('button');
      tab.type = 'button';
      tab.id = 'bs_day_tab_' + day;
      tab.className = 'bs_day_tab' + (filled ? ' bs_is_filled' : '');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', card.id);
      tab.setAttribute('aria-label', 'Tag ' + day + (filled ? ', ausgefüllt' : ', noch leer'));
      var icon = document.createElement('i');
      icon.className = filled ? 'fa fa-circle-check' : 'fa-regular fa-circle';
      icon.setAttribute('aria-hidden', 'true');
      var text = document.createElement('span');
      text.textContent = 'T' + day;
      tab.appendChild(icon);
      tab.appendChild(text);
      tablist.appendChild(tab);
      return tab;
    });

    var title = section.querySelector('.bs_section_title');
    section.insertBefore(tablist, title ? title.nextSibling : section.firstChild);

    function activate(index, focus) {
      tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.setAttribute('tabindex', active ? '0' : '-1');
        cards[i].classList.toggle('bs_is_hidden', !active);
      });
      if (focus) {
        tabs[index].focus();
      }
    }

    tablist.addEventListener('click', function (event) {
      var tab = event.target.closest('.bs_day_tab');
      if (tab) {
        activate(tabs.indexOf(tab), true);
      }
    });

    tablist.addEventListener('keydown', function (event) {
      var current = tabs.indexOf(document.activeElement);
      if (current === -1) {
        return;
      }
      var next = null;
      if (event.key === 'ArrowRight') {
        next = (current + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft') {
        next = (current - 1 + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        next = 0;
      } else if (event.key === 'End') {
        next = tabs.length - 1;
      }
      if (next !== null) {
        event.preventDefault();
        activate(next, true);
      }
    });

    activate(0, false);
  }

  /* ---------- Listenansicht ---------- */

  /* Zweizeilig, damit die Tabelle schmal bleibt: „KW 45“ und „02.11. bis 06.11.2026“. */
  function showWeekCompact(target, dates) {
    var valid = dates.filter(function (d) { return d; }).sort(function (a, b) { return a - b; });
    target.textContent = '';
    if (!valid.length) {
      return;
    }
    var first = valid[0];
    var last = valid[valid.length - 1];
    var kw = document.createElement('span');
    kw.className = 'bs_week_kw';
    kw.textContent = 'KW ' + weekNumber(first);
    var days = document.createElement('span');
    days.className = 'bs_week_days';
    if (last.getTime() === first.getTime()) {
      days.textContent = formatShort(first);
    } else {
      var start = formatShort(first);
      if (first.getUTCFullYear() === last.getUTCFullYear()) {
        start = start.slice(0, 6);
      }
      days.textContent = start + ' bis ' + formatShort(last);
    }
    target.appendChild(kw);
    target.appendChild(days);
  }

  function setupList(view) {
    var cells = view.querySelectorAll('.bs_week_range');
    for (var i = 0; i < cells.length; i++) {
      var spans = cells[i].querySelectorAll('[data-bs-dates] span');
      var dates = [];
      for (var j = 0; j < spans.length; j++) {
        dates.push(parseDate(spans[j].textContent));
      }
      var target = cells[i].querySelector('.bs_week_text');
      if (target) {
        showWeekCompact(target, dates);
      }
    }

    var trophies = view.querySelectorAll('.bs_trophy');
    for (var k = 0; k < trophies.length; k++) {
      var textEl = trophies[k].querySelector('.bs_trophy_text');
      var text = textEl ? (textEl.textContent || '').replace(/\s+/g, ' ').trim() : '';
      if (text) {
        trophies[k].title = 'Highlight der Woche: ' + text;
        trophies[k].classList.remove('bs_is_hidden');
      }
    }
  }

  function init() {
    var add = document.querySelector('[data-bs-view="add"]');
    if (add) {
      linkLabels(add);
      setupDays(add);
      setupWeekField(add);
    }
    var single = document.querySelector('[data-bs-view="single"]');
    if (single) {
      formatDates(single);
      setupDayTabs(single);
    }
    var list = document.querySelector('[data-bs-view="list"]');
    if (list) {
      setupList(list);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
