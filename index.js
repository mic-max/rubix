const SVG_NS = "http://www.w3.org/2000/svg"

const UNUSED_COLOUR = "#576574"
const THEMES = {
    "default": ["#feca57", "#2e86de", "#ee5253", "#c8d6e5", "#ff9f43", "#10ac84"],
    "light":   ["#ffeaa7", "#74b9ff", "#ff7675", "#dfe6e9", "#fdcb6e", "#55efc4"],
    "dark":    ["#b8860b", "#1e3a5f", "#7b1f1f", "#495057", "#8b4513", "#1a5c38"],
}
let activeTheme = localStorage.getItem("theme") || "default"
let COLOURS = activeTheme === "custom"
    ? (JSON.parse(localStorage.getItem("colours") || "null") || [...THEMES["default"]])
    : [...THEMES[activeTheme]]
let polygons = []
let paintMode = false
let activePaintColour = null
let paintModeCubeState = null
let swatches = []
let isPainting = false

// TODO: ensure symmetry
const vertices = [
    [ 0, 68 ],    [ 74, 43 ],   [ 146, 18 ],
    [ 195, 0 ],   [ 52, 90 ],   [ 126, 63 ],
    [ 197, 38 ],  [ 248, 18 ],  [ 123, 123 ],
    [ 194, 92 ],  [ 265, 64 ],  [ 315, 42 ],
    [ 194, 156 ], [ 269, 121 ], [ 339, 90 ],
    [ 389, 68 ],  [ 7, 151 ],   [ 56, 177 ],
    [ 123, 213 ], [ 196, 250 ], [ 268, 211 ],
    [ 331, 179 ], [ 379, 152 ], [ 14, 230 ],
    [ 61, 259 ],  [ 126, 300 ], [ 196, 340 ],
    [ 264, 299 ], [ 323, 261 ], [ 370, 233 ],
    [ 20, 301 ],  [ 64, 331 ],  [ 126, 369 ],
    [ 196, 413 ], [ 262, 367 ], [ 319, 326 ],
    [ 364, 291 ]
]

// Vertices in clockwise order.
const faces = [
    [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6],
    [4, 5, 9, 8], [5, 6, 10, 9], [6, 7, 11, 10],
    [8, 9, 13, 12], [9, 10, 14, 13], [10, 11, 15, 14],
    [0, 4, 17, 16], [4, 8, 18, 17], [8, 12, 19, 18],
    [16, 17, 24, 23], [17, 18, 25, 24], [18, 19, 26, 25],
    [23, 24, 31, 30], [24, 25, 32, 31], [25, 26, 33, 32],
    [12, 13, 20, 19], [13, 14, 21, 20], [14, 15, 22, 21],
    [19, 20, 27, 26], [20, 21, 28, 27], [21, 22, 29, 28],
    [26, 27, 34, 33], [27, 28, 35, 34], [28, 29, 36, 35],
]

// Hitbox for all 6 columns
const scrollPolygons = [
    [0, 4, 31, 30],
    [4, 8, 32, 31],
    [8, 12, 33, 32],
    [12, 13, 34, 33],
    [13, 14, 35, 34],
    [14, 15, 36, 35],
].map(x => x.map(i => vertices[i]))

const horizontalPolygons = [
    [0, 12, 15, 22, 19, 16],
    [16, 19, 22, 29, 26, 23],
    [23, 26, 29, 36, 33, 30],
].map(x => x.map(i => vertices[i]))

// TODO: extract this to a separate node.js script
const moves = {
    "U": {
        "53": 44,
        "52": 43,
        "51": 42,
        "9": 18,
        "10": 19,
        "11": 20,
        "18": 53,
        "19": 52,
        "20": 51,
        "42": 11,
        "43": 10,
        "44": 9,
        "0": 6,
        "1": 3,
        "2": 0,
        "5": 1,
        "8": 2,
        "7": 5,
        "6": 8,
        "3": 7,
    },
    "E": {
        "12": 21,
        "13": 22,
        "14": 23,
        "21": 50,
        "22": 49,
        "23": 48,
        "50": 41,
        "49": 40,
        "48": 39,
        "41": 14,
        "40": 13,
        "39": 12,
    },
    "D": {
        "15": 38,
        "16": 37,
        "17": 36,
        "24": 15,
        "25": 16,
        "26": 17,
        "47": 24,
        "46": 25,
        "45": 26,
        "38": 47,
        "37": 46,
        "36": 45,
        "27": 33,
        "28": 30,
        "29": 27,
        "32": 28,
        "35": 29,
        "34": 32,
        "33": 35,
        "30": 34,
    },
    "R": {
        "11": 29,
        "14": 32,
        "17": 35,
        "29": 47,
        "32": 50,
        "35": 53,
        "47": 8,
        "50": 7,
        "53": 6,
        "8": 11,
        "7": 14,
        "6": 17,
        "18": 24,
        "19": 21,
        "20": 18,
        "23": 19,
        "26": 20,
        "25": 23,
        "24": 26,
        "21": 25,
    },
    "L": {
        "0": 51,
        "1": 48,
        "2": 45,
        "51": 33,
        "48": 30,
        "45": 27,
        "33": 15,
        "30": 12,
        "27": 9,
        "15": 0,
        "12": 1,
        "9": 2,
        "36": 42,
        "37": 39,
        "38": 36,
        "41": 37,
        "44": 38,
        "43": 41,
        "42": 44,
        "39": 43,
    },
    "F": {
        "0": 36,
        "3": 39,
        "6": 42,
        "18": 0,
        "21": 3,
        "24": 6,
        "29": 18,
        "28": 21,
        "27": 24,
        "36": 29,
        "39": 28,
        "42": 27,
        "9": 15,
        "10": 12,
        "11": 9,
        "14": 10,
        "17": 11,
        "16": 14,
        "15": 17,
        "12": 16,
    },
    "B": {
        "20": 35,
        "23": 34,
        "26": 33,
        "35": 38,
        "34": 41,
        "33": 44,
        "38": 2,
        "41": 5,
        "44": 8,
        "2": 20,
        "5": 23,
        "8": 26,
        "45": 51,
        "46": 48,
        "47": 45,
        "50": 46,
        "53": 47,
        "52": 50,
        "51": 53,
        "48": 52,
    },
    "M": {
        "5": 46,
        "4": 49,
        "3": 52,
        "10": 5,
        "13": 4,
        "16": 3,
        "28": 10,
        "31": 13,
        "34": 16,
        "46": 28,
        "49": 31,
        "52": 34,
    },
    "S": {
        "1": 37,
        "4": 40,
        "7": 43,
        "19": 1,
        "22": 4,
        "25": 7,
        "32": 19,
        "31": 22,
        "30": 25,
        "37": 32,
        "40": 31,
        "43": 30,
    }
}

// Main
let isWonky = false
let wonkyOffsets = null
let moveNumber = 0

const cubesDiv = document.getElementById("cubes")
const moveNumberSpan = document.getElementById("moveNumber")
const moveHistoryDiv = document.getElementById("moveHistory")
const shuffleMoves = document.getElementById("shuffleMoves")
const urlParams = new URLSearchParams(window.location.search);
const myParam = urlParams.get("state");
if (myParam) {
    const buffer = fromBase64(myParam);
    const values = decodeByteBuffer(buffer);
    localStorage.setItem("cubeState", JSON.stringify(values))
}

cubesDiv.appendChild(createSVG(0))
cubesDiv.appendChild(createSVG(1))
createColourLegend()
document.addEventListener("mouseup", () => { isPainting = false })
document.getElementById("main").addEventListener("wheel", (event) => {
    if (!paintMode) return
    event.preventDefault()
    if (event.deltaY > 0) {
        setActivePaintColour((activePaintColour + 1) % COLOURS.length)
    } else {
        setActivePaintColour((activePaintColour - 1 + COLOURS.length) % COLOURS.length)
    }
}, { passive: false })

// Functions
function shuffle() {
    const shuffles = parseInt(shuffleMoves.value)
    const availableMoves = validMoves()

    moveHistoryDiv.appendChild(document.createElement("hr"))
    moveHistoryDiv.scrollTop = moveHistoryDiv.scrollHeight

    let i = 0
    let lastMove = null
    function makeNextRandomMove() {
        if (i < shuffles) {
            let randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)]
            while (lastMove && randomMove[0] == lastMove[0] && randomMove != lastMove) {
                // If there is a last move and it is the opposite of the current move choice
                randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)]
            }
            lastMove = randomMove
            i++
            makeMove(randomMove, true, i)
            setTimeout(makeNextRandomMove, 10)
        } else {
            moveHistoryDiv.appendChild(document.createElement("hr"))
            moveHistoryDiv.scrollTop = moveHistoryDiv.scrollHeight
        }
    }

    makeNextRandomMove()
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

function share() {
    const buffer = createByteBuffer(cubeState());
    const base64String = toBase64(buffer);
    const url = new URL(window.location.href);
    url.searchParams.set("state", base64String);
    navigator.clipboard.writeText(url.toString());
}

function cubeState() {
    const key = "cubeState"
    if (localStorage.getItem(key) === null) {
        resetCubeState()
    }
    const data = localStorage.getItem(key)
    return JSON.parse(data)
}

function validMoves() {
    return Object.keys(moves).concat(Object.keys(moves).map(x => `${x}'`))
}

function isPointInsidePolygon(x, y, polygon) {
    let isInside = false

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][1]
        let xj = polygon[j][0], yj = polygon[j][1]

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi))
            isInside = !isInside
    }

    return isInside
}


function resetCubeState() {
    localStorage.setItem("cubeState", JSON.stringify(Array.from({length: 54}, (_, i) => Math.floor(i / 9))))
    resetMoveCounter()
}

function setMoveNumber(value) {
    moveNumber = value
    moveNumberSpan.innerHTML = moveNumber
}

function resetMoveCounter() {
    moveHistoryDiv.innerHTML = ""
    setMoveNumber(0)
}

function updatePolygons() {
    const state = paintMode ? paintModeCubeState : cubeState()
    state.forEach((element, index) => {
        polygons[index].setAttribute("fill", element === -1 ? UNUSED_COLOUR : COLOURS[element])
    })
}

function debug(event) {
    document.querySelectorAll("svg text").forEach((element) => {
      element.classList.toggle("hide")
    })
}

function validate() {
    // return true if it is solveable
    // if there could be one or two faces changed to make it valid, change their stroke
}

function makeMove(move, isShuffle = false, shuffleMoveNum = null) {
    if (!validMoves().includes(move)) {
        return console.error(`Invalid Move: ${move}`)
    }

    const copy = Array.from({length: 54}, (_, i) => cubeState()[i])
    const state = cubeState()

    for (const [key, value] of Object.entries(moves[move[0]])) {
        if (move.endsWith("'")) {
            state[value] = copy[key]
        } else if (move.endsWith("2")) {
            // TODO: do move twice
        } else {
            state[parseInt(key)] = copy[value]
        }
    }

    // Note: localStorage must be set first so the updating of the polygons gets the
    //       most recent state.
    localStorage.setItem("cubeState", JSON.stringify(state))
    updatePolygons()

    if (!isShuffle) {
        // TODO: actually set this to the movequeue length, since a move can be undone by making another move
        // keep a separate actual move and a simplified move counter
        setMoveNumber(++moveNumber)
    }
    const displayNum = isShuffle ? shuffleMoveNum : moveNumber
    const row = document.createElement("div")
    row.textContent = `${displayNum.toString().padStart(4)}. ${move}`
    if (isShuffle) row.classList.add("shuffle-move")
    moveHistoryDiv.appendChild(row)
    moveHistoryDiv.scrollTop = moveHistoryDiv.scrollHeight
}

function wonky() {
    isWonky = !isWonky

    if (isWonky) {
        wonkyOffsets = vertices.map(() => [(Math.random() * 14) - 7, (Math.random() * 14) - 7])
    }

    for (let j = 0; j < polygons.length; j++) {
        const i = j % 27
        const pts = [0, 1, 2, 3].map(x => {
            const vi = faces[i][x]
            const [vx, vy] = vertices[vi]
            return isWonky ? [vx + wonkyOffsets[vi][0], vy + wonkyOffsets[vi][1]] : [vx, vy]
        })
        polygons[j].setAttribute("points", pts.map(p => p.join(",")).join(","))
    }
}

// TODO: generate this svg from JS but then include it in the HTML
// for SEO, speed, and to at least show something for people with JS disabled.
function createSVG(cubeNumber) {
    const svg = document.createElementNS(SVG_NS, "svg")
    svg.setAttribute("version", "1.1")
    svg.setAttribute("width", 389)
    svg.setAttribute("height", 413)

    svg.addEventListener("wheel", (event) => wheel(event, svg, cubeNumber))
    svg.addEventListener("mousedown", (event) => mousedown(event, svg, cubeNumber))	

    for (let i = 0; i < faces.length; i++) {
        let j = i + cubeNumber * 27
        
        let points = [0, 1, 2, 3].map(x => vertices[faces[i][x]])

        let polygon = document.createElementNS(SVG_NS, "polygon")
        polygon.setAttribute("points", points.map(y => y.join(",")).join(",")) // TODO: spaces or commas between points
        polygon.setAttribute("fill", COLOURS[cubeState()[j]])
        polygon.setAttribute("stroke", "#222f3e")
        polygon.setAttribute("stroke-width", 2.5)

        polygons.push(polygon)
        const paint = () => {
            if (!paintMode || activePaintColour === null) return
            if (paintModeCubeState[j] === activePaintColour) return
            if (paintModeCubeState.filter(v => v === activePaintColour).length >= 9) return
            paintModeCubeState[j] = activePaintColour
            updatePolygons()
            updateSwatchCounts()
        }
        polygon.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return
            isPainting = true
            paint()
        })
        polygon.addEventListener("mouseover", () => {
            if (isPainting) paint()
        })
        polygon.addEventListener("contextmenu", (e) => {
            if (!paintMode) return
            e.preventDefault()
            paintModeCubeState[j] = -1
            updatePolygons()
            updateSwatchCounts()
        })
        svg.appendChild(polygon)
        
        // Text
        let text = document.createElementNS(SVG_NS, "text")
        text.textContent = j
        text.classList.add("hide")
        let centroid = calculateCentroid(points)
        text.setAttribute("x", centroid.x)
        text.setAttribute("y", centroid.y)
        svg.appendChild(text)
    }

    for (let i = 0; i < vertices.length; i++) {
        let label = document.createElementNS(SVG_NS, "text")
        label.textContent = i
        label.classList.add("hide", "vertex-label")
        label.setAttribute("x", vertices[i][0])
        label.setAttribute("y", vertices[i][1])
        svg.appendChild(label)
    }

    return svg
}

function wheel(event, parentSvg, cubeNumber) {
    if (paintMode) return
    const svgRect = parentSvg.getBoundingClientRect()
    const x = event.clientX - svgRect.left
    const y = event.clientY - svgRect.top

    for (let i = 0; i < scrollPolygons.length; i++) {
        if (isPointInsidePolygon(x, y, scrollPolygons[i])) {
            let moveMapping = null
            if (cubeNumber === 0) {
                moveMapping = {
                    "-0": "L'",
                    "+0": "L",
                    "-1": "M'",
                    "+1": "M",
                    "-2": "R",
                    "+2": "R'",
                    "-3": "F'",
                    "+3": "F",
                    "-4": "S'",
                    "+4": "S",
                    "-5": "B",
                    "+5": "B'",
                }
            } else {
                moveMapping = {
                    "-0": "F'",
                    "+0": "F",
                    "-1": "S'",
                    "+1": "S",
                    "-2": "B",
                    "+2": "B'",
                    "-3": "L'",
                    "+3": "L",
                    "-4": "M'",
                    "+4": "M",
                    "-5": "R",
                    "+5": "R'",
                }
            }
            
            makeMove(moveMapping[`${event.deltaY > 0 ? "+" : "-"}${i}`])
            event.preventDefault()
            break
        }
    }

    updatePolygons()
}

function mousedown(event, parentSvg, cubeNumber) {
    if (paintMode) return
    const svgRect = parentSvg.getBoundingClientRect()
    const x = event.clientX - svgRect.left
    const y = event.clientY - svgRect.top

    horizontalPolygons.forEach((element, index) => {
        if (isPointInsidePolygon(x, y, element)) {
            let moveMapping = null
            if (cubeNumber === 0) {
                moveMapping = {
                    "10": "U",
                    "30": "U'",
                    "11": "E",
                    "31": "E'",
                    "12": "D'",
                    "32": "D",
                }
            } else {
                moveMapping = {
                    "10": "D",
                    "30": "D'",
                    "11": "E'",
                    "31": "E",
                    "12": "U'",
                    "32": "U",
                }
            }
            makeMove(moveMapping[`${event.which}${index}`])
        }
    })

    updatePolygons()
}

function cyclePolygonColour(event, j) {
    cubeState()[j]++
    cubeState()[j] %= COLOURS.length
    updatePolygons()
}

function createColourLegend() {
    const container = document.getElementById("colour-legend")

    COLOURS.forEach((colour, i) => {
        const label = document.createElement("label")
        label.className = "colour-swatch"
        label.title = `Face ${i + 1}`

        const input = document.createElement("input")
        input.type = "color"
        input.value = colour
        input.addEventListener("input", (e) => {
            COLOURS[i] = e.target.value
            label.style.backgroundColor = e.target.value
            localStorage.setItem("colours", JSON.stringify(COLOURS))
            updatePolygons()
            setActiveTheme("custom")
        })

        const count = document.createElement("span")
        count.className = "swatch-count"
        count.textContent = "0"

        label.style.backgroundColor = colour
        label.appendChild(input)
        label.appendChild(count)
        label.addEventListener("click", (e) => {
            if (paintMode) {
                e.preventDefault()
                setActivePaintColour(i)
            }
        })
        container.appendChild(label)
        swatches.push({ label, input, count })
    })

    const leftPanel = document.getElementById("leftPanel")

    const paintBtn = document.createElement("button")
    paintBtn.textContent = "Paint Mode"
    paintBtn.addEventListener("click", () => enterPaintMode(container, paintBtn, applyBtn, cancelBtn))
    leftPanel.appendChild(paintBtn)

    const applyBtn = document.createElement("button")
    applyBtn.textContent = "Apply"
    applyBtn.classList.add("hide")
    applyBtn.addEventListener("click", () => {
        const valid = COLOURS.every((_, i) => paintModeCubeState.filter(v => v === i).length === 9)
        if (!valid) return
        exitPaintMode(container, paintBtn, applyBtn, cancelBtn, true)
    })
    leftPanel.appendChild(applyBtn)

    const cancelBtn = document.createElement("button")
    cancelBtn.textContent = "Cancel"
    cancelBtn.classList.add("hide")
    cancelBtn.addEventListener("click", () => exitPaintMode(container, paintBtn, applyBtn, cancelBtn, false))
    leftPanel.appendChild(cancelBtn)

    const themeSelector = document.createElement("div")
    themeSelector.id = "theme-selector"

    const themeNames = ["default", "light", "dark", "custom"]
    themeNames.forEach(name => {
        const btn = document.createElement("button")
        btn.textContent = name
        btn.className = "theme-btn"
        btn.dataset.theme = name
        if (name === activeTheme) btn.classList.add("active")
        btn.addEventListener("click", () => applyTheme(name))
        themeSelector.appendChild(btn)
    })

    container.appendChild(themeSelector)
}

function updateSwatchCounts() {
    const state = paintMode ? paintModeCubeState : cubeState()
    swatches.forEach(({ count }, i) => {
        count.textContent = state.filter(v => v === i).length
    })
}

function setActivePaintColour(i) {
    activePaintColour = i
    swatches.forEach(({ label }, idx) => label.classList.toggle("active", idx === i))
}

function enterPaintMode(container, paintBtn, applyBtn, cancelBtn) {
    paintMode = true
    paintModeCubeState = Array(54).fill(-1)
    updatePolygons()
    updateSwatchCounts()
    paintBtn.classList.add("hide")
    applyBtn.classList.remove("hide")
    cancelBtn.classList.remove("hide")
    container.classList.add("paint-mode")
    setActivePaintColour(0)
}

function exitPaintMode(container, paintBtn, applyBtn, cancelBtn, apply) {
    if (apply) {
        localStorage.setItem("cubeState", JSON.stringify(paintModeCubeState))
    }
    paintMode = false
    paintModeCubeState = null
    activePaintColour = null
    swatches.forEach(({ label }) => label.classList.remove("active"))
    updatePolygons()
    paintBtn.classList.remove("hide")
    applyBtn.classList.add("hide")
    cancelBtn.classList.add("hide")
    container.classList.remove("paint-mode")
}

function solve() {
    const algorithm = document.getElementById("solveAlgorithm").value
    const state = cubeState()
    let moves
    if (algorithm === "beginner") {
        moves = solveBeginnerMethod(state)
    }
    console.log("Solution moves:", moves)
}

function solveBeginnerMethod(state) {
    // TODO: implement beginner method (layer-by-layer)
    // Steps: white cross → white face → middle layer → yellow cross → yellow face → permute last layer
    // Returns an array of move strings, e.g. ["U", "R", "U'", "R'"]
    return []
}

function setActiveTheme(name) {
    activeTheme = name
    localStorage.setItem("theme", name)
    document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.theme === name)
    })
}

function applyTheme(name) {
    const colours = name === "custom"
        ? (JSON.parse(localStorage.getItem("colours") || "null") || [...THEMES["default"]])
        : THEMES[name]
    COLOURS.splice(0, COLOURS.length, ...colours)
    swatches.forEach(({ label, input }, i) => {
        input.value = COLOURS[i]
        label.style.backgroundColor = COLOURS[i]
    })
    updatePolygons()
    setActiveTheme(name)
}

function calculateCentroid(points) {
    return {
        x: points.reduce((acc, x) => acc + x[0], 0) / points.length,
        y: points.reduce((acc, x) => acc + x[1], 0) / points.length
    }
}
