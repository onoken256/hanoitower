const DISK_COLORS = [
    ['#e74c3c', '#c0392b'],
    ['#e67e22', '#ca6f1e'],
    ['#f1c40f', '#d4ac0d'],
    ['#27ae60', '#1e8449'],
    ['#16a085', '#117a65'],
    ['#2980b9', '#1f618d'],
    ['#8e44ad', '#76349a'],
    ['#c0392b', '#922b21'],
    ['#00acc1', '#00838f'],
    ['#d35400', '#b04500'],
];

const REAL_DISK_COUNT = 64;
const REAL_MIN_MOVES = 2n ** 64n - 1n; // 18,446,744,073,709,551,615

let pegs     = [[], [], []];
let numDisks = 5;
let moves    = 0;
let fromPeg  = -1;
let cleared  = false;
let isRealMode       = false;
let realModeUnlocked = false;

function diskWidthPct(size, maxSize) {
    const MIN_PCT = 18, MAX_PCT = 88;
    if (maxSize === 1) return MAX_PCT;
    return MIN_PCT + (size - 1) / (maxSize - 1) * (MAX_PCT - MIN_PCT);
}

function render() {
    for (let p = 0; p < 3; p++) {
        const stackEl = document.getElementById('stack' + p);
        stackEl.innerHTML = '';
        for (let i = 0; i < pegs[p].length; i++) {
            const size   = pegs[p][i];
            const isTop  = (i === pegs[p].length - 1);
            const lifted = (isTop && p === fromPeg);
            const colorIdx = (size - 1) % DISK_COLORS.length;

            const el = document.createElement('div');
            el.className = 'disk' + (lifted ? ' lifted' : '');
            el.style.width      = diskWidthPct(size, numDisks) + '%';
            el.style.background = `linear-gradient(135deg, ${DISK_COLORS[colorIdx][0]}, ${DISK_COLORS[colorIdx][1]})`;
            if (!isRealMode) el.textContent = size;

            stackEl.appendChild(el);
        }
        document.getElementById('peg' + p).classList.toggle('active', p === fromPeg);
    }
    document.getElementById('statMoves').textContent = moves;
}

function clickPeg(p) {
    if (cleared) return;
    clearError();

    if (fromPeg === -1) {
        if (pegs[p].length === 0) {
            showError('この杭に円盤はありません');
            return;
        }
        fromPeg = p;
        render();
    } else {
        if (p === fromPeg) {
            fromPeg = -1;
            render();
            return;
        }
        const movingDisk = pegs[fromPeg][pegs[fromPeg].length - 1];
        const destTop    = pegs[p].length > 0 ? pegs[p][pegs[p].length - 1] : Infinity;

        if (movingDisk > destTop) {
            showError('大きな円盤を小さな円盤の上には置けません！');
            fromPeg = -1;
            render();
            return;
        }

        pegs[fromPeg].pop();
        pegs[p].push(movingDisk);
        moves++;
        fromPeg = -1;
        render();
        if (!isRealMode) checkClear();
    }
}

function checkClear() {
    if (pegs[0].length === 0 &&
        (pegs[1].length === numDisks || pegs[2].length === numDisks)) {
        cleared = true;
        const minMoves = Math.pow(2, numDisks) - 1;

        document.getElementById('msgArea').innerHTML =
            '<span class="clear-msg">🎉 クリア！おめでとうございます！</span>';

        if (moves === minMoves) {
            document.getElementById('hintText').textContent = '最短手数でのクリアです！';
        } else {
            document.getElementById('hintText').textContent =
                'もっと少ない手数で解くことができます。挑戦してみましょう！';
        }

        if (numDisks === 3) {
            document.getElementById('adminArea').style.display = 'block';
        }

        if (numDisks === 12 && !realModeUnlocked) {
            realModeUnlocked = true;
            document.getElementById('realUnlockArea').style.display = 'block';
        }
    }
}

function showError(msg) {
    const el = document.getElementById('msgArea');
    el.innerHTML = `<span class="error-msg">${msg}</span>`;
    clearTimeout(el._tid);
    el._tid = setTimeout(clearError, 2500);
}

function clearError() {
    if (!cleared) document.getElementById('msgArea').innerHTML = '';
}

function initBoard() {
    pegs    = [[], [], []];
    for (let i = numDisks; i >= 1; i--) pegs[0].push(i);
    moves   = 0;
    fromPeg = -1;
    cleared = false;
    document.getElementById('hintText').textContent = '杭をクリックして円盤を選択 → 別の杭をクリックして移動';
    document.getElementById('msgArea').innerHTML = '';
    document.getElementById('adminArea').style.display = 'none';
    render();
}

function resetGame() {
    if (!isRealMode) numDisks = parseInt(document.getElementById('diskSel').value, 10);
    initBoard();
}

// --- Real mode ---

function enterRealMode() {
    isRealMode = true;
    numDisks   = REAL_DISK_COUNT;

    document.getElementById('boardWrap').classList.add('real-mode-wrap');
    document.getElementById('diskSelGroup').style.display  = 'none';
    document.getElementById('realModeTitle').style.display = 'flex';
    document.getElementById('hintBtn').style.display       = 'inline-block';
    document.getElementById('exitRealBtn').style.display   = 'inline-block';
    document.getElementById('realMinDisplay').style.display = 'block';
    document.getElementById('realMinMoves').textContent    = formatBigInt(REAL_MIN_MOVES);
    document.getElementById('realUnlockArea').style.display = 'none';

    initBoard();
}

function exitRealMode() {
    isRealMode = false;
    numDisks   = parseInt(document.getElementById('diskSel').value, 10);

    document.getElementById('boardWrap').classList.remove('real-mode-wrap');
    document.getElementById('diskSelGroup').style.display   = 'flex';
    document.getElementById('realModeTitle').style.display  = 'none';
    document.getElementById('hintBtn').style.display        = 'none';
    document.getElementById('exitRealBtn').style.display    = 'none';
    document.getElementById('realMinDisplay').style.display = 'none';
    if (realModeUnlocked) {
        document.getElementById('realUnlockArea').style.display = 'block';
    }

    initBoard();
}

// --- Hint modal ---

function formatBigInt(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showHint() {
    const secsPerYear      = 31557600n;         // 365.25日
    const universeAgeYears = 13800000000n;       // 138億年
    const totalYears       = REAL_MIN_MOVES / secsPerYear;
    const universeRatio    = totalYears / universeAgeYears;
    const humanHistYears   = 300000n;            // 約30万年
    const humanRatio       = totalYears / humanHistYears;

    document.getElementById('hintContent').innerHTML = `
        <p>64枚の円盤を最短で解くのに必要な手数：</p>
        <p class="big-number">${formatBigInt(REAL_MIN_MOVES)} 手</p>
        <hr>
        <p class="hint-lead">1秒に1手動かし続けると…</p>
        <div class="hint-stat">
            <span class="hint-icon">⏳</span>
            <div>
                <div class="hint-stat-value">${formatBigInt(totalYears)} 年</div>
                <div class="hint-stat-label">かかる時間</div>
            </div>
        </div>
        <div class="hint-stat">
            <span class="hint-icon">🌌</span>
            <div>
                <div class="hint-stat-value">宇宙の年齢の約 ${formatBigInt(universeRatio)} 倍</div>
                <div class="hint-stat-label">宇宙の年齢は約138億年</div>
            </div>
        </div>
        <div class="hint-stat">
            <span class="hint-icon">🧬</span>
            <div>
                <div class="hint-stat-value">人類の歴史の約 ${formatBigInt(humanRatio)} 倍</div>
                <div class="hint-stat-label">人類の歴史は約30万年</div>
            </div>
        </div>
        <p class="hint-footer">
            宇宙が生まれた瞬間から現在まで1秒も休まず動かし続けても、<br>
            解を完成させることはできません。
        </p>
    `;
    document.getElementById('hintModal').style.display = 'flex';
}

function closeHintModal(e) {
    if (e.target === document.getElementById('hintModal')) {
        document.getElementById('hintModal').style.display = 'none';
    }
}

// --- Admin ---

function showAdminPrompt() {
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminModal').style.display = 'flex';
    setTimeout(() => document.getElementById('adminPasswordInput').focus(), 50);
}

function handleAdminKey(e) {
    if (e.key === 'Enter')  submitAdminPassword();
    if (e.key === 'Escape') closeAdminModal();
}

function submitAdminPassword() {
    const pw = document.getElementById('adminPasswordInput').value;
    document.getElementById('adminModal').style.display = 'none';
    if (pw === 'math') {
        realModeUnlocked = true;
        enterRealMode();
    } else {
        resetGame();
    }
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

document.getElementById('diskSel').addEventListener('change', resetGame);
resetGame();
