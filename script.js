let allLogsText = '';

function appendText(parent, str) {
    const parts = str.split('[BETA]');
    parts.forEach(function(part, index) {
        if (part) {
            parent.appendChild(document.createTextNode(part));
        }
        if (index < parts.length - 1) {
            const span = document.createElement('span');
            span.className = 'log-beta';
            span.textContent = '[BETA]';
            parent.appendChild(span);
        }
    });
}

function renderLogs(text) {
    const box = document.getElementById('logs-content');
    box.innerHTML = '';
    const styles = {
        '+': 'log-line log-plus',
        '-': 'log-line log-minus',
        '*': 'log-line log-small',
        '@': 'log-line log-diamond',
        '/': 'log-line log-gold',
        '#': 'log-line log-head'
    };

    text.trim().split('\n').forEach(function(rawLine) {
        const line = rawLine.trim();
        const div = document.createElement('div');
        if (!line) {
            div.className = 'log-empty';
        } else if (styles[line.charAt(0)]) {
            div.className = styles[line.charAt(0)];
            appendText(div, line.slice(1).trim());
        } else {
            div.className = 'log-line';
            appendText(div, rawLine);
        }
        box.appendChild(div);
    });
}

function extractMapLog(rawText, mapKey) {
    const lines = rawText.split('\n');
    const openTag = '<log:' + mapKey + '>';
    const closeTag = '</log:' + mapKey + '>';
    let inside = false;
    let buffer = [];

    lines.forEach(function(line) {
        const t = line.trim();
        if (!inside && t === openTag) {
            inside = true;
        } else if (inside && (t === closeTag || t === closeTag + ',')) {
            inside = false;
        } else if (inside) {
            buffer.push(line);
        }
    });

    return buffer.join('\n').trim();
}

function parseVersions(rawText) {
    const tabsBox = document.getElementById('version-tabs');
    tabsBox.innerHTML = '';

    if (!rawText || !rawText.trim()) {
        document.getElementById('logs-content').textContent = 'Для этой карты пока нет обновлений.';
        return;
    }

    const versions = [];
    const lines = rawText.split('\n');
    let currentVer = null;
    let buffer = [];

    lines.forEach(function(line) {
        const t = line.trim();
        if (!currentVer && t.startsWith('<') && t.endsWith('>') && !t.startsWith('</') && !t.startsWith('<log:')) {
            currentVer = t.slice(1, -1).trim();
            buffer = [];
        } else if (currentVer && (t === '</' + currentVer + '>' || t === '</' + currentVer + '>,')) {
            versions.push({ name: currentVer, content: buffer.join('\n') });
            currentVer = null;
        } else if (currentVer) {
            buffer.push(line);
        }
    });

    if (versions.length === 0) {
        renderLogs(rawText);
        return;
    }

    versions.forEach(function(ver, idx) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ver-btn' + (idx === 0 ? ' active' : '');
        btn.textContent = ver.name;
        btn.onclick = function() {
            tabsBox.querySelectorAll('.ver-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            renderLogs(ver.content);
        };
        tabsBox.appendChild(btn);
    });

    renderLogs(versions.at(0).content);
}

function formatCode(rawCode) {
    const clean = rawCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length === 7) {
        return clean.slice(0, 4) + '-' + clean.slice(4);
    }
    return rawCode.trim();
}

function selectMap(mapObj) {
    document.getElementById('map-name').textContent = mapObj.name || mapObj.key;
    document.getElementById('map-icon').src = mapObj.icon || 'view.png';
    document.getElementById('map-code').textContent = formatCode(mapObj.code || '----');
    document.getElementById('map-desc').textContent = mapObj.desc || 'Пользовательская карта для игры NoomiClone от NoomiNoob.';

    const mapLog = extractMapLog(allLogsText, mapObj.key);
    parseVersions(mapLog);
}

function parseMaps(rawText) {
    const maps = [];
    const lines = rawText.split('\n');
    let current = null;

    lines.forEach(function(line) {
        const t = line.trim();
        if (!t) return;

        if (!current && t.startsWith('<') && t.endsWith('>') && !t.startsWith('</')) {
            const key = t.slice(1, -1).trim();
            current = { key: key, name: key, icon: '', code: '', desc: '' };
        } else if (current && (t === '<' + current.key + '>' || t === '</' + current.key + '>' || t === '<' + current.key + '>,' || t === '</' + current.key + '>,')) {
            maps.push(current);
            current = null;
        } else if (current) {
            const sep = t.indexOf(':');
            if (sep !== -1) {
                const field = t.slice(0, sep).trim().toLowerCase();
                const val = t.slice(sep + 1).trim();
                if (field === 'icon') current.icon = val;
                if (field === 'name') current.name = val;
                if (field === 'code') current.code = val;
                if (field === 'desc') current.desc = val;
            }
        }
    });

    return maps;
}

Promise.all([
    fetch('maps.txt?t=' + Date.now()).then(function(r) { return r.ok ? r.text() : ''; }).catch(function() { return ''; }),
    fetch('logs.txt?t=' + Date.now()).then(function(r) { return r.ok ? r.text() : ''; }).catch(function() { return ''; })
]).then(function(results) {
    const mapsRaw = results.at(0);
    allLogsText = results.at(1);

    const maps = parseMaps(mapsRaw);
    const tabsBox = document.getElementById('maps-tabs');
    tabsBox.innerHTML = '';

    if (maps.length === 0) {
        document.getElementById('map-name').textContent = 'Карты не найдены';
        document.getElementById('logs-content').textContent = 'Добавьте карты в файл maps.txt';
        return;
    }

    maps.forEach(function(m, idx) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'map-btn' + (idx === 0 ? ' active' : '');

        if (m.icon) {
            const img = document.createElement('img');
            img.src = m.icon;
            img.alt = '';
            btn.appendChild(img);
        }

        const span = document.createElement('span');
        span.textContent = m.name;
        btn.appendChild(span);

        btn.onclick = function() {
            tabsBox.querySelectorAll('.map-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            selectMap(m);
        };

        tabsBox.appendChild(btn);
    });

    selectMap(maps.at(0));
});
