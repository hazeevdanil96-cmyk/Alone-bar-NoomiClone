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

function parseVersions(rawText) {
    const tabsBox = document.getElementById('version-tabs');
    tabsBox.innerHTML = '';
    const versions = [];
    const lines = rawText.split('\n');
    let currentVer = null;
    let buffer = [];

    lines.forEach(function(line) {
        const t = line.trim();
        if (!currentVer && t.startsWith('<') && t.endsWith('>') && !t.startsWith('</')) {
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
        rawText.trim() ? renderLogs(rawText) : (document.getElementById('logs-content').textContent = 'Лог пуст.');
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

fetch('logs.txt?t=' + Date.now())
    .then(function(r) { return r.ok ? r.text() : Promise.reject(); })
    .then(function(t) { parseVersions(t); })
    .catch(function() { document.getElementById('logs-content').textContent = 'Файл logs.txt не найден.'; });
