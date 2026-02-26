const boardEl = document.getElementById('board');
const turnIndicator = document.getElementById('turnIndicator');
const moveListEl = document.getElementById('moveList');
const statusMessageEl = document.getElementById('statusMessage');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = document.getElementById('undoBtn');
const promoModal = document.getElementById('promotionModal');
const promoOptionsEl = document.getElementById('promoOptions');
const difficultySelect = document.getElementById('difficulty');
const playWhiteBtn = document.getElementById('playWhite');
const playBlackBtn = document.getElementById('playBlack');
const pgnInput = document.getElementById('pgnInput');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');

// AI Stats Elements
const depthStat = document.getElementById('depthStat');
const nodesStat = document.getElementById('nodesStat');
const timeStat = document.getElementById('timeStat');

let board = [];
let selectedSquare = null;
let currentTurn = 'white';
let movedPieces = new Set();
let lastMove = null;
let historyStack = [];
let moveLog = [];
let pendingPromotion = null;
let gameActive = true;
let playerColor = 'white'; 

let AI_DEPTH = 3; 
let nodesEvaluated = 0;

// OPTIMASI: Menyimpan posisi raja agar AI tidak perlu looping 64 kotak
let kingPos = { w: { r: 7, c: 4 }, b: { r: 0, c: 4 } };

const PIECES = {
    white: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    black: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
};

const PIECE_VALUES = {
    p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000
};

const PST = {
    p: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ],
    n: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
    ],
    q: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    k: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
    ]
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS_DISPLAY = ['8', '7', '6', '5', '4', '3', '2', '1'];

function initBoard() {
    board = [
        ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
        ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
        Array(8).fill(''), Array(8).fill(''), Array(8).fill(''), Array(8).fill(''),
        ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
        ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
    ];
    selectedSquare = null;
    currentTurn = 'white';
    movedPieces = new Set();
    lastMove = null;
    historyStack = [];
    moveLog = [];
    pendingPromotion = null;
    gameActive = true;
    
    // Reset Cache Raja
    kingPos = { w: { r: 7, c: 4 }, b: { r: 0, c: 4 } };

    AI_DEPTH = parseInt(difficultySelect.value);
    statusMessageEl.textContent = '';
    promoModal.style.display = 'none';
    
    renderBoard();
    renderMoveList();
    updateStatus();

    if (playerColor === 'black' && currentTurn === 'white') {
        setTimeout(makeAIMove, 500);
    }
}

// --- STATE MANAGEMENT ---

function saveState() {
    historyStack.push({
        board: board.map(r => [...r]),
        currentTurn: currentTurn,
        movedPieces: new Set(movedPieces),
        lastMove: lastMove ? { ...lastMove } : null,
        moveLog: [...moveLog],
        kingPos: JSON.parse(JSON.stringify(kingPos)) // Simpan posisi raja saat undo
    });
}

function undoMove() {
    if (historyStack.length === 0 || (!gameActive && statusMessageEl.textContent.includes('Checkmate'))) return;
    
    let pops = (currentTurn !== playerColor || historyStack.length === 1) ? 1 : 2;
    let prevState;
    
    for(let i = 0; i < pops; i++) {
        if(historyStack.length > 0) prevState = historyStack.pop();
    }

    if (prevState) {
        board = prevState.board;
        currentTurn = prevState.currentTurn;
        movedPieces = prevState.movedPieces;
        lastMove = prevState.lastMove;
        moveLog = prevState.moveLog;
        kingPos = prevState.kingPos; // Kembalikan posisi raja
        
        gameActive = true;
        statusMessageEl.textContent = '';
        renderBoard();
        renderMoveList();
        updateStatus();
    }
}

// --- PGN LOGIC ---
function exportPGN() {
    let pgn = "";
    for (let i = 0; i < moveLog.length; i += 2) {
        pgn += `${(i/2)+1}. ${moveLog[i]} `;
        if (moveLog[i+1]) pgn += `${moveLog[i+1]} `;
    }
    pgnInput.value = pgn.trim();
}

function importPGN() {
    const pgn = pgnInput.value.trim();
    if (!pgn) return;
    
    const cleanPGN = pgn.replace(/\d+\./g, '').replace(/\s+/g, ' ').trim();
    const moves = cleanPGN.split(' ');
    
    initBoard(); 
    gameActive = false;

    let moveIdx = 0;
    const processNextMove = () => {
        if (moveIdx >= moves.length) {
            gameActive = true; 
            renderBoard();
            renderMoveList();
            updateStatus();
            if (currentTurn !== playerColor) makeAIMove();
            return;
        }

        const moveStr = moves[moveIdx];
        if (!moveStr) { moveIdx++; processNextMove(); return; } 

        const move = parseMove(moveStr, currentTurn);
        if (move) {
            executeMove(move.fromR, move.fromC, move.toR, move.toC, move.promotion, true); 
        } else {
            alert(`Invalid move in PGN: ${moveStr}`);
            initBoard(); 
            return;
        }
        moveIdx++;
        setTimeout(processNextMove, 10); 
    };
    setTimeout(processNextMove, 100);
}

function parseMove(san, color) {
    if (san === 'O-O' || san === '0-0') {
        const r = color === 'white' ? 7 : 0;
        return { fromR: r, fromC: 4, toR: r, toC: 6 };
    }
    if (san === 'O-O-O' || san === '0-0-0') {
        const r = color === 'white' ? 7 : 0;
        return { fromR: r, fromC: 4, toR: r, toC: 2 };
    }

    san = san.replace(/[+#]/g, '');

    let promotion = null;
    if (san.includes('=')) {
        promotion = san.split('=')[1].toLowerCase();
        san = san.split('=')[0];
    }

    const targetStr = san.slice(-2);
    const toC = targetStr.charCodeAt(0) - 97; 
    const toR = 8 - parseInt(targetStr[1]);

    let pieceType = 'p';
    let disambiguation = '';
    
    if (san.length > 2 && /^[RNBQK]/.test(san)) {
        pieceType = san[0].toLowerCase();
        disambiguation = san.slice(1, -2).replace('x', '');
    } else {
        disambiguation = san.slice(0, -2).replace('x', '');
    }

    const candidates = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p[0] === color[0] && p[1] === pieceType) {
                candidates.push({ r, c });
            }
        }
    }

    let finalFrom = null;
    for (const cand of candidates) {
        if (disambiguation) {
            const file = String.fromCharCode(97 + cand.c);
            const rank = (8 - cand.r).toString();
            if (disambiguation.includes(file) || disambiguation.includes(rank)) {
                finalFrom = cand; break;
            }
        } else {
            finalFrom = cand; break; 
        }
    }
    if (candidates.length > 1 && !disambiguation) finalFrom = candidates[0]; 
    if (finalFrom) return { fromR: finalFrom.r, fromC: finalFrom.c, toR, toC, promotion };
    return null;
}

// --- RENDERING ---

function renderBoard() {
    boardEl.innerHTML = '';
    const isHumanWhite = playerColor === 'white';
    
    const startR = isHumanWhite ? 0 : 7;
    const endR = isHumanWhite ? 8 : -1;
    const stepR = isHumanWhite ? 1 : -1;
    const startC = isHumanWhite ? 0 : 7;
    const endC = isHumanWhite ? 8 : -1;
    const stepC = isHumanWhite ? 1 : -1;
    
    for (let r = startR; r !== endR; r += stepR) {
        for (let c = startC; c !== endC; c += stepC) {
            const square = document.createElement('div');
            square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.r = r;
            square.dataset.c = c;
            
            const pieceCode = board[r][c];
            if (pieceCode) {
                const color = pieceCode[0] === 'w' ? 'white' : 'black';
                const type = pieceCode[1];
                const pieceEl = document.createElement('div');
                pieceEl.className = `piece ${color}`;
                pieceEl.textContent = PIECES[color][type];
                square.appendChild(pieceEl);
            }
            square.addEventListener('click', () => handleSquareClick(r, c));
            boardEl.appendChild(square);
        }
    }

    if (selectedSquare) {
        const squares = Array.from(boardEl.children);
        const selectedDiv = squares.find(s => parseInt(s.dataset.r) === selectedSquare.r && parseInt(s.dataset.c) === selectedSquare.c);
        if (selectedDiv) selectedDiv.classList.add('selected');

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (isValidMove(selectedSquare.r, selectedSquare.c, r, c)) {
                    const moveDiv = squares.find(s => parseInt(s.dataset.r) === r && parseInt(s.dataset.c) === c);
                    if (moveDiv) moveDiv.classList.add('valid-move');
                }
            }
        }
    }

    if (lastMove) {
        const squares = Array.from(boardEl.children);
        const src = squares.find(s => parseInt(s.dataset.r) === lastMove.fromR && parseInt(s.dataset.c) === lastMove.fromC);
        const dst = squares.find(s => parseInt(s.dataset.r) === lastMove.toR && parseInt(s.dataset.c) === lastMove.toC);
        if (src) src.classList.add('last-move-src');
        if (dst) dst.classList.add('last-move-dst');
    }
}

function renderMoveList() {
    moveListEl.innerHTML = '';
    for (let i = 0; i < moveLog.length; i += 2) {
        const row = document.createElement('div');
        row.className = 'move-row';
        const num = document.createElement('div');
        num.className = 'move-num'; num.textContent = `${(i / 2) + 1}.`;
        const w = document.createElement('div');
        w.className = 'move-white'; w.textContent = moveLog[i] || '';
        const b = document.createElement('div');
        b.className = 'move-black'; b.textContent = moveLog[i + 1] || '';
        row.append(num, w, b);
        moveListEl.appendChild(row);
    }
    moveListEl.scrollTop = moveListEl.scrollHeight;
}

function handleSquareClick(r, c) {
    if (!gameActive || pendingPromotion || statusMessageEl.textContent.includes('Wins') || statusMessageEl.textContent.includes('Draw')) return;
    if (currentTurn !== playerColor) return;

    const piece = board[r][c];
    const isOwnPiece = piece && piece[0] === playerColor[0]; 

    if (isOwnPiece) {
        selectedSquare = { r, c };
        renderBoard();
        return;
    }

    if (selectedSquare) {
        if (isValidMove(selectedSquare.r, selectedSquare.c, r, c)) {
            const p = board[selectedSquare.r][selectedSquare.c];
            if (p[1] === 'p' && (r === 0 || r === 7)) {
                showPromotionModal(selectedSquare.r, selectedSquare.c, r, c);
            } else {
                executeMove(selectedSquare.r, selectedSquare.c, r, c, null);
            }
            selectedSquare = null;
        } else {
            selectedSquare = null;
            renderBoard();
        }
    }
}

function showPromotionModal(fromR, fromC, toR, toC) {
    pendingPromotion = { fromR, fromC, toR, toC };
    const color = currentTurn;
    const pieces = ['q', 'r', 'b', 'n'];
    promoOptionsEl.innerHTML = '';
    pieces.forEach(type => {
        const div = document.createElement('div');
        div.className = 'promo-piece';
        div.textContent = PIECES[color][type];
        div.onclick = () => {
            promoModal.style.display = 'none';
            pendingPromotion = null;
            executeMove(fromR, fromC, toR, toC, type);
        };
        promoOptionsEl.appendChild(div);
    });
    promoModal.style.display = 'flex';
}

// --- AI ENGINE & OPTIMISASI VIRTUAL MOVE ---

function makeAIMove() {
    if (!gameActive || currentTurn === playerColor) return;

    AI_DEPTH = parseInt(difficultySelect.value);
    statusMessageEl.textContent = "AI Thinking...";
    
    setTimeout(() => {
        const startTime = performance.now();
        nodesEvaluated = 0;
        const bestMove = getBestMove(AI_DEPTH);
        const endTime = performance.now();
        
        depthStat.textContent = AI_DEPTH;
        nodesStat.textContent = nodesEvaluated;
        timeStat.textContent = Math.round(endTime - startTime);
        
        if (bestMove) {
            let promotion = null;
            const piece = board[bestMove.fromR][bestMove.fromC];
            if (piece[1] === 'p' && (bestMove.toR === 7 || bestMove.toR === 0)) promotion = 'q';
            executeMove(bestMove.fromR, bestMove.fromC, bestMove.toR, bestMove.toC, promotion);
        }
    }, 50);
}

function getBestMove(depth) {
    let bestScore = -Infinity;
    let bestMoves = [];
    
    const aiColor = playerColor === 'white' ? 'black' : 'white';
    const moves = getAllValidMoves(aiColor);
    
    if (moves.length === 0) return null; 
    
    // Move ordering
    moves.sort((a, b) => (board[b.toR][b.toC] ? 10 : 0) - (board[a.toR][a.toC] ? 10 : 0));

    for (const move of moves) {
        const undoData = doVirtualMove(move);
        const score = minimax(depth - 1, -Infinity, Infinity, false);
        undoVirtualMove(undoData);
        
        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (score === bestScore) {
            bestMoves.push(move);
        }
    }
    
    return bestMoves.length > 0 ? bestMoves[Math.floor(Math.random() * bestMoves.length)] : moves[0];
}

function minimax(depth, alpha, beta, isMaximizing) {
    nodesEvaluated++;
    
    if (depth === 0) return evaluateBoard();
    
    const turnColor = isMaximizing ? (playerColor === 'white' ? 'black' : 'white') : playerColor;
    const moves = getAllValidMoves(turnColor);
    
    if (moves.length === 0) {
        if (isKingInCheck(turnColor)) return isMaximizing ? -Infinity : Infinity; 
        return 0; 
    }
    
    moves.sort((a, b) => {
        const valA = board[a.toR][a.toC] ? PIECE_VALUES[board[a.toR][a.toC][1]] : 0;
        const valB = board[b.toR][b.toC] ? PIECE_VALUES[board[b.toR][b.toC][1]] : 0;
        return valB - valA; 
    });

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const undoData = doVirtualMove(move);
            const eval = minimax(depth - 1, alpha, beta, false);
            undoVirtualMove(undoData);
            
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const undoData = doVirtualMove(move);
            const eval = minimax(depth - 1, alpha, beta, true);
            undoVirtualMove(undoData);
            
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// FUNGSI INTI OPTIMASI - Sangat Cepat
function doVirtualMove(m) {
    const { fromR, fromC, toR, toC } = m;
    const piece = board[fromR][fromC];
    
    let undoData = { 
        m, 
        piece: piece, // PERBAIKAN: Simpan identitas bidak asli di sini
        captured: board[toR][toC], 
        epCaptured: null, epR: null, epC: null, 
        castlingRookNew: null, castlingRookOld: null, 
        prevTurn: currentTurn, prevLastMove: lastMove 
    };

    // En Passant logic
    if (piece[1] === 'p' && fromC !== toC && !board[toR][toC]) {
        undoData.epR = fromR; undoData.epC = toC;
        undoData.epCaptured = board[fromR][toC];
        board[fromR][toC] = ''; 
    }
    
    // Castling logic
    if (piece[1] === 'k' && Math.abs(toC - fromC) === 2) {
        const isKingside = toC > fromC;
        undoData.castlingRookOld = {r: fromR, c: isKingside ? 7 : 0};
        undoData.castlingRookNew = {r: fromR, c: isKingside ? 5 : 3};
        board[undoData.castlingRookNew.r][undoData.castlingRookNew.c] = board[undoData.castlingRookOld.r][undoData.castlingRookOld.c];
        board[undoData.castlingRookOld.r][undoData.castlingRookOld.c] = '';
    }

    board[toR][toC] = piece; 
    board[fromR][fromC] = '';
    
    // Auto Promote in search
    if (piece[1] === 'p' && (toR === 0 || toR === 7)) board[toR][toC] = piece[0] + 'q';
    
    // Cache Raja
    if (piece[1] === 'k') { kingPos[piece[0]].r = toR; kingPos[piece[0]].c = toC; }

    lastMove = { fromR, fromC, toR, toC, piece, color: piece[0] };
    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    
    return undoData;
}

function undoVirtualMove(data) {
    // PERBAIKAN: Tarik kembali identitas bidak asli dari parameter `piece`
    const { m, piece, captured, epCaptured, epR, epC, castlingRookNew, castlingRookOld, prevTurn, prevLastMove } = data;

    board[m.fromR][m.fromC] = piece; // Kembalikan bidak asli tanpa asumsi promosi
    board[m.toR][m.toC] = captured;

    if (epCaptured) board[epR][epC] = epCaptured;
    
    if (castlingRookOld) {
        board[castlingRookOld.r][castlingRookOld.c] = board[castlingRookNew.r][castlingRookNew.c];
        board[castlingRookNew.r][castlingRookNew.c] = '';
    }

    // Kembalikan Cache Raja
    if (piece[1] === 'k') { 
        kingPos[piece[0]].r = m.fromR; 
        kingPos[piece[0]].c = m.fromC; 
    }

    currentTurn = prevTurn;
    lastMove = prevLastMove;
}

function evaluateBoard() {
    let score = 0;
    const aiColor = playerColor === 'white' ? 'black' : 'white';
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                const color = piece[0];
                const type = piece[1];
                const val = PIECE_VALUES[type];
                let pstVal = color === 'w' ? PST[type][r][c] : PST[type][7 - r][c];
                
                if (color === aiColor[0]) score += (val + pstVal);
                else score -= (val + pstVal);
            }
        }
    }
    return score;
}

function isKingInCheck(color) {
    const c = color[0];
    const kr = kingPos[c].r;
    const kc = kingPos[c].c;
    return isSquareUnderAttack(kr, kc, c === 'w' ? 'b' : 'w');
}

function isSquareUnderAttack(r, c, attackerColor) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const p = board[i][j];
            if (p && p[0] === attackerColor) {
                if (isPseudoValidMove(i, j, r, c, p[1])) return true;
            }
        }
    }
    return false;
}

function isPseudoValidMove(fromR, fromC, toR, toC, type) {
    const dr = toR - fromR;
    const dc = toC - fromC;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);
    const piece = board[fromR][fromC];
    const color = piece ? piece[0] : currentTurn[0];
    const target = board[toR][toC];
    
    if (target && target[0] === color) return false;
    const direction = color === 'w' ? -1 : 1;
    
    switch (type) {
        case 'p':
            if (dc === 0 && dr === direction && !target) return true;
            const startRow = color === 'w' ? 6 : 1;
            if (dc === 0 && dr === direction * 2 && fromR === startRow && !target && !board[fromR + direction][fromC]) return true;
            if (absDc === 1 && dr === direction && target) return true;
            if (target === '' && absDc === 1 && dr === direction) return true; 
            return false;
        case 'r': return (dr === 0 || dc === 0) && isPathClear(fromR, fromC, toR, toC);
        case 'n': return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
        case 'b': return (absDr === absDc) && isPathClear(fromR, fromC, toR, toC);
        case 'q': return (dr === 0 || dc === 0 || absDr === absDc) && isPathClear(fromR, fromC, toR, toC);
        case 'k': return absDr <= 1 && absDc <= 1;
        default: return false;
    }
}

function isPathClear(r1, c1, r2, c2) {
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    let r = r1 + dr;
    let c = c1 + dc;
    while (r !== r2 || c !== c2) {
        if (board[r][c] !== '') return false;
        r += dr;
        c += dc;
    }
    return true;
}

function isValidMove(fromR, fromC, toR, toC) {
    const piece = board[fromR][fromC];
    if (!piece) return false;
    const type = piece[1];
    const color = piece[0];

    let validGeo = isPseudoValidMove(fromR, fromC, toR, toC, type);
    if (type === 'p') {
         const dr = toR - fromR; const dc = toC - fromC;
         const direction = color === 'w' ? -1 : 1;
         if (Math.abs(dc) === 1 && dr === direction && !board[toR][toC]) {
             if (canEnPassant(fromR, fromC, toR, toC)) validGeo = true;
             else validGeo = false;
         } else if (Math.abs(dc) === 1 && dr === direction && board[toR][toC]) validGeo = true; 
    }
    if (type === 'k' && Math.abs(toC - fromC) === 2) {
        if (toR !== fromR) return false;
        return canCastle(fromR, fromC, toR, toC);
    }
    if (!validGeo) return false;

    // OPTIMASI: Cek validitas tanpa membuat salinan board
    const undoData = doVirtualMove({fromR, fromC, toR, toC});
    const inCheck = isKingInCheck(color === 'w' ? 'white' : 'black');
    undoVirtualMove(undoData);
    
    return !inCheck;
}

function canEnPassant(fromR, fromC, toR, toC) {
    if (!lastMove) return false;
    const piece = board[fromR][fromC];
    if (piece[1] !== 'p') return false;
    if (lastMove.piece[1] === 'p' && Math.abs(lastMove.fromR - lastMove.toR) === 2) {
        if (lastMove.toR === fromR && Math.abs(lastMove.toC - fromC) === 1 && lastMove.toC === toC) return true;
    }
    return false;
}

function canCastle(fromR, fromC, toR, toC) {
    const piece = board[fromR][fromC];
    const color = piece[0];
    const opponent = color === 'w' ? 'b' : 'w';

    // --- PERBAIKAN BUG RAJA KEMBAR ---
    // Pastikan Raja benar-benar sedang berada di titik start aslinya
    if (fromC !== 4) return false; 
    if (color === 'w' && fromR !== 7) return false;
    if (color === 'b' && fromR !== 0) return false;
    // ---------------------------------

    if (movedPieces.has(`${fromR},${fromC}`)) return false;
    if (isSquareUnderAttack(fromR, fromC, opponent)) return false;
    
    const isKingside = toC > fromC;
    const rookC = isKingside ? 7 : 0;
    const rook = board[fromR][rookC];
    if (!rook || rook[1] !== 'r' || movedPieces.has(`${fromR},${rookC}`)) return false;
    
    const step = isKingside ? 1 : -1;
    for (let c = fromC + step; c !== rookC; c += step) {
        if (board[fromR][c] !== '') return false;
    }
    if (isSquareUnderAttack(fromR, fromC + step, opponent)) return false;
    if (isSquareUnderAttack(fromR, toC, opponent)) return false;
    
    return true;
}

function executeMove(fromR, fromC, toR, toC, promotionChoice, isImporting = false) {
    saveState();

    const piece = board[fromR][fromC];
    const color = piece[0];
    const type = piece[1];
    const target = board[toR][toC];
    
    let notation = type.toUpperCase() + (target?'x':'') + FILES[toC] + RANKS_DISPLAY[toR];
    if (type === 'p') {
        if (target) notation = FILES[fromC] + 'x' + FILES[toC] + RANKS_DISPLAY[toR];
        else notation = FILES[toC] + RANKS_DISPLAY[toR];
    }

    if (type === 'p' && fromC !== toC && !board[toR][toC]) {
        board[fromR][toC] = ''; 
        notation = FILES[fromC] + 'x' + FILES[toC] + RANKS_DISPLAY[toR]; 
    }
    
    if (type === 'k' && Math.abs(toC - fromC) === 2) {
        const isKingside = toC > fromC;
        const rookOldC = isKingside ? 7 : 0;
        const rookNewC = isKingside ? 5 : 3;
        board[fromR][rookNewC] = board[fromR][rookOldC];
        board[fromR][rookOldC] = '';
        movedPieces.add(`${fromR},${rookOldC}`);
        movedPieces.add(`${fromR},${rookNewC}`);
        notation = isKingside ? "O-O" : "O-O-O";
    }

    board[toR][toC] = piece;
    board[fromR][fromC] = '';
    
    // Update King Cache on Real Move
    if (type === 'k') { kingPos[color].r = toR; kingPos[color].c = toC; }

    movedPieces.add(`${fromR},${fromC}`);
    movedPieces.add(`${toR},${toC}`);

    if (promotionChoice) {
        board[toR][toC] = color + promotionChoice;
        notation += "=" + promotionChoice.toUpperCase();
    } else if (type === 'p' && (toR === 0 || toR === 7)) {
        board[toR][toC] = color + 'q';
        notation += "=Q";
    }

    lastMove = { fromR, fromC, toR, toC, piece, color };
    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    
    const opponent = currentTurn;
    const inCheck = isKingInCheck(opponent);
    const moves = getAllValidMoves(opponent);
    const noMoves = moves.length === 0;

    if (inCheck) {
        notation += "+";
        if (noMoves) {
            notation = notation.replace('+', '#');
            statusMessageEl.textContent = `Checkmate! ${color === 'w' ? 'You Win!' : 'AI Wins!'}`;
            gameActive = false;
        } else {
            statusMessageEl.textContent = "Check!";
        }
    } else if (noMoves) {
        statusMessageEl.textContent = "Draw (Stalemate)!";
        gameActive = false;
    }

    moveLog.push(notation);
    renderMoveList();
    renderBoard();
    updateStatus();
    
    if (!isImporting && gameActive && currentTurn !== playerColor) {
        makeAIMove();
    }
}

function updateStatus() {
    if (gameActive) {
        turnIndicator.textContent = `${currentTurn === 'white' ? "White" : "Black"}'s Turn`;
        turnIndicator.style.background = currentTurn === 'white' ? '#ecf0f1' : '#34495e';
        turnIndicator.style.color = currentTurn === 'white' ? '#2c3e50' : '#ecf0f1';
    } else {
        turnIndicator.textContent = "Game Over";
    }
}

function getAllValidMoves(color) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] && board[r][c][0] === color[0]) {
                for (let tr = 0; tr < 8; tr++) {
                    for (let tc = 0; tc < 8; tc++) {
                        if (isValidMove(r, c, tr, tc)) {
                            moves.push({ fromR: r, fromC: c, toR: tr, toC: tc });
                        }
                    }
                }
            }
        }
    }
    return moves;
}

// --- EVENT LISTENERS ---

playWhiteBtn.addEventListener('click', () => {
    playerColor = 'white';
    playWhiteBtn.classList.add('active');
    playBlackBtn.classList.remove('active');
    initBoard();
});

playBlackBtn.addEventListener('click', () => {
    playerColor = 'black';
    playBlackBtn.classList.add('active');
    playWhiteBtn.classList.remove('active');
    initBoard();
});

difficultySelect.addEventListener('change', initBoard);
resetBtn.addEventListener('click', initBoard);
undoBtn.addEventListener('click', undoMove);
exportBtn.addEventListener('click', exportPGN);
importBtn.addEventListener('click', importPGN);

initBoard();