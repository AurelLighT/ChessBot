
/**
 * UNIT TEST CHESSBOT - LOGIKA PERGERAKAN (VALIDATION)
 * Lokasi: C:\Users\steve\Desktop\ChessBot\unit_tests_logic.js
 * Catatan: File ini HANYA untuk pengetesan lokal, tidak di-push ke GitHub.
 */

// Mocking lingkungan Board
let board = Array(8).fill(null).map(() => Array(8).fill(null));

// Fungsi pembantu untuk menaruh bidak
function setPiece(pos, piece) {
    const r = 8 - parseInt(pos[1]);
    const c = pos.charCodeAt(0) - 97;
    board[r][c] = piece;
}

// Mocking isValidMove sederhana untuk simulasi (logika Kuda)
function testKnightMove(from, to) {
    const fromR = 8 - parseInt(from[1]);
    const fromC = from.charCodeAt(0) - 97;
    const toR = 8 - parseInt(to[1]);
    const toC = to.charCodeAt(0) - 97;
    
    const dr = Math.abs(toR - fromR);
    const dc = Math.abs(toC - fromC);
    return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
}

function runTests() {
    console.log("=== CHESSBOT LOGIC UNIT TESTS (LOCAL ONLY) ===");
    let passed = 0;
    let total = 0;

    function assert(condition, message) {
        total++;
        if (condition) {
            console.log(`[PASS] ${message}`);
            passed++;
        } else {
            console.error(`[FAIL] ${message}`);
        }
    }

    // --- TEST 1: Gerakan Kuda (L-Shape) ---
    assert(testKnightMove("g1", "f3") === true, "Kuda g1 ke f3 harus valid (L-Shape)");
    assert(testKnightMove("g1", "g3") === false, "Kuda g1 ke g3 harus tidak valid (Lurus)");

    // --- TEST 2: Koordinat Array ---
    const getCoords = (pos) => ({ r: 8 - parseInt(pos[1]), c: pos.charCodeAt(0) - 97 });
    assert(getCoords("a8").r === 0 && getCoords("a8").c === 0, "Koordinat a8 harus [0,0]");
    assert(getCoords("h1").r === 7 && getCoords("h1").c === 7, "Koordinat h1 harus [7,7]");

    // --- TEST 3: Deteksi Warna Bidak ---
    const isWhite = (piece) => piece && piece[0] === 'w';
    assert(isWhite("wp") === true, "Bidak 'wp' harus terdeteksi sebagai Putih");
    assert(isWhite("bn") === false, "Bidak 'bn' harus terdeteksi sebagai bukan Putih");

    console.log(`\nSelesai: ${passed}/${total} test berhasil.`);
}

runTests();
