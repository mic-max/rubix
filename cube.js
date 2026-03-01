const rotations = {
    "X": ["R",  "M'", "L'"],
    "Y": ["U",  "E",  "D'"],
    "Z": ["F",  "S",  "B'"],
}

const moves = {
    "U": [
        [53, 44],
        [52, 43],
        [51, 42],
        [9, 18],
        [10, 19],
        [11, 20],
        [18, 53],
        [19, 52],
        [20, 51],
        [42, 11],
        [43, 10],
        [44, 9],
        [0, 6],
        [1, 3],
        [2, 0],
        [5, 1],
        [8, 2],
        [7, 5],
        [6, 8],
        [3, 7],
    ],
    "E": [
        [12, 21],
        [13, 22],
        [14, 23],
        [21, 50],
        [22, 49],
        [23, 48],
        [50, 41],
        [49, 40],
        [48, 39],
        [41, 14],
        [40, 13],
        [39, 12],
    ],
    "D": [
        [15, 38],
        [16, 37],
        [17, 36],
        [24, 15],
        [25, 16],
        [26, 17],
        [47, 24],
        [46, 25],
        [45, 26],
        [38, 47],
        [37, 46],
        [36, 45],
        [27, 33],
        [28, 30],
        [29, 27],
        [32, 28],
        [35, 29],
        [34, 32],
        [33, 35],
        [30, 34],
    ],
    "R": [
        [11, 29],
        [14, 32],
        [17, 35],
        [29, 47],
        [32, 50],
        [35, 53],
        [47, 8],
        [50, 7],
        [53, 6],
        [8, 11],
        [7, 14],
        [6, 17],
        [18, 24],
        [19, 21],
        [20, 18],
        [23, 19],
        [26, 20],
        [25, 23],
        [24, 26],
        [21, 25],
    ],
    "L": [
        [0, 51],
        [1, 48],
        [2, 45],
        [51, 33],
        [48, 30],
        [45, 27],
        [33, 15],
        [30, 12],
        [27, 9],
        [15, 0],
        [12, 1],
        [9, 2],
        [36, 42],
        [37, 39],
        [38, 36],
        [41, 37],
        [44, 38],
        [43, 41],
        [42, 44],
        [39, 43],
    ],
    "F": [
        [0, 36],
        [3, 39],
        [6, 42],
        [18, 0],
        [21, 3],
        [24, 6],
        [29, 18],
        [28, 21],
        [27, 24],
        [36, 29],
        [39, 28],
        [42, 27],
        [9, 15],
        [10, 12],
        [11, 9],
        [14, 10],
        [17, 11],
        [16, 14],
        [15, 17],
        [12, 16],
    ],
    "B": [
        [20, 35],
        [23, 34],
        [26, 33],
        [35, 38],
        [34, 41],
        [33, 44],
        [38, 2],
        [41, 5],
        [44, 8],
        [2, 20],
        [5, 23],
        [8, 26],
        [45, 51],
        [46, 48],
        [47, 45],
        [50, 46],
        [53, 47],
        [52, 50],
        [51, 53],
        [48, 52],
    ],
    "M": [
        [5, 46],
        [4, 49],
        [3, 52],
        [10, 5],
        [13, 4],
        [16, 3],
        [28, 10],
        [31, 13],
        [34, 16],
        [46, 28],
        [49, 31],
        [52, 34],
    ],
    "S": [
        [1, 37],
        [4, 40],
        [7, 43],
        [19, 1],
        [22, 4],
        [25, 7],
        [32, 19],
        [31, 22],
        [30, 25],
        [37, 32],
        [40, 31],
        [43, 30],
    ],
}

function validMoves() {
    return Object.keys(moves).concat(Object.keys(moves).map(x => `${x}'`))
}

function applyMove(state, moveName) {
    const copy = [...state]
    const result = [...state]
    for (const [dest, src] of moves[moveName[0]]) {
        if (moveName.endsWith("'")) {
            result[src] = copy[dest]
        } else {
            result[dest] = copy[src]
        }
    }
    return result
}

const CUBE_STATE_KEY = "cubeState"

function saveCubeState(state) {
    localStorage.setItem(CUBE_STATE_KEY, JSON.stringify(state))
}

function cubeState() {
    if (localStorage.getItem(CUBE_STATE_KEY) === null) {
        resetCubeState()
    }
    const data = localStorage.getItem(CUBE_STATE_KEY)
    return JSON.parse(data)
}

function resetCubeState() {
    saveCubeState(Array.from({length: 54}, (_, i) => Math.floor(i / 9)))
}

function createByteBuffer(values) {
    const buffer = new Uint8Array(Math.ceil(values.length * 3 / 8)); // 21 bytes
    for (let i = 0, j = 0; i < values.length; i++, j += 3 ) {
        const byteIndex = Math.floor(j / 8)
        const bitOffset = j % 8
        buffer[byteIndex] |= (values[i] & 0b111) << bitOffset
        if (bitOffset > 5) {
            buffer[byteIndex + 1] |= (values[i] & 0b111) >> (8 - bitOffset)
        }
    }
    return buffer
}

function toBase64(buffer) {
    // TODO: https://stackoverflow.com/a/72631261 ==> 68 bits
    let stringValue = String.fromCharCode.apply(null, buffer);
    return btoa(stringValue)
}

function fromBase64(base64String) {
    return new Uint8Array(atob(base64String).split("").map(c => c.charCodeAt(0)))
}

function decodeByteBuffer(buffer) {
    const values = [];
    for (let i = 0, j = 0; i < 54; i++, j += 3) {
        const byteIndex = Math.floor(j / 8)
        const bitOffset = j % 8
        let value = (buffer[byteIndex] >> bitOffset) & 0b111
        if (bitOffset > 5) {
            value |= (buffer[byteIndex + 1] << (8 - bitOffset)) & 0b111
        }
        values.push(value)
    }
    return values
}
