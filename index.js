const SVG_NS = "http://www.w3.org/2000/svg"

const UNUSED_COLOUR = "#576574"
const THEMES = {
    "default": ["#feca57", "#2e86de", "#ee5253", "#c8d6e5", "#ff9f43", "#10ac84"],
    "french":  ["#f6b93b", "#4a69bd", "#b71540", "#c8d6e5", "#fa983a", "#079992"],
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

const verticalPolygons = [
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

const WHEEL_MAPS = [
    { "-0":"L'","+0":"L", "-1":"M'","+1":"M", "-2":"R", "+2":"R'",
      "-3":"F'","+3":"F", "-4":"S'","+4":"S", "-5":"B", "+5":"B'" },
    { "-0":"F'","+0":"F", "-1":"S'","+1":"S", "-2":"B", "+2":"B'",
      "-3":"L'","+3":"L", "-4":"M'","+4":"M", "-5":"R", "+5":"R'" },
]

const CLICK_MOVES = [
    [["U","E","D'"], ["U'","E'","D"]],
    [["D","E'","U'"], ["D'","E","U"]],
]

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
    saveCubeState(values)
}

cubesDiv.appendChild(createSVG(0))
cubesDiv.appendChild(createSVG(1))
createColourLegend()

const movePanel = document.getElementById("movePanel")
;["U","E","D","R","L","F","B","M","S"].forEach(m => {
    const d = document.createElement("div")
    d.className = "move-pair"
    d.innerHTML = `<button onclick="makeMove('${m}')">${m}</button><button onclick="makeMove('${m}\\'')">${m}'</button>`
    movePanel.appendChild(d)
})
const sep = document.createElement("div")
sep.className = "move-panel-separator"
movePanel.appendChild(sep)
Object.keys(rotations).forEach(r => {
    const d = document.createElement("div")
    d.className = "move-pair rotation-pair"
    d.innerHTML = `<button onclick="makeRotation('${r}')">${r}</button><button onclick="makeRotation('${r}\\'')">${r}'</button>`
    movePanel.appendChild(d)
})
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
            while (lastMove && randomMove === oppositeMove(lastMove)) {
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

function share() {
    const buffer = createByteBuffer(cubeState());
    const base64String = toBase64(buffer);
    const url = new URL(window.location.href);
    url.searchParams.set("state", base64String);
    navigator.clipboard.writeText(url.toString());
    const btn = document.getElementById("share-btn");
    const label = document.getElementById("share-label");
    btn.classList.add("copied");
    label.textContent = "Copied";
    setTimeout(() => {
        btn.classList.remove("copied");
        label.textContent = "Copy link";
    }, 2000);
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

function makeMove(move, isShuffle = false, shuffleMoveNum = null, isRotation = false) {
    if (!validMoves().includes(move)) {
        return console.error(`Invalid Move: ${move}`)
    }
    saveCubeState(applyMove(cubeState(), move))
    if (!isRotation) updatePolygons()
    if (!isShuffle && !isRotation) setMoveNumber(++moveNumber)
    if (!isRotation) {
        const displayNum = isShuffle ? shuffleMoveNum : moveNumber
        const row = document.createElement("div")
        row.textContent = `${displayNum.toString().padStart(4)}. ${move}`
        if (isShuffle) row.classList.add("shuffle-move")
        moveHistoryDiv.appendChild(row)
        moveHistoryDiv.scrollTop = moveHistoryDiv.scrollHeight
    }
}

function oppositeMove(move) {
    return move.endsWith("'") ? move.slice(0, -1) : move + "'"
}

function makeRotation(name) {
    const isPrime = name.endsWith("'")
    const base = isPrime ? name.slice(0, -1) : name
    rotations[base]
        .map(m => isPrime ? oppositeMove(m) : m)
        .forEach(move => makeMove(move, false, null, true))
    updatePolygons()
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
        polygon.setAttribute("points", points.map(y => y.join(",")).join(","))
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

    for (let i = 0; i < verticalPolygons.length; i++) {
        if (isPointInsidePolygon(x, y, verticalPolygons[i])) {
            makeMove(WHEEL_MAPS[cubeNumber][`${event.deltaY > 0 ? "+" : "-"}${i}`])
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
            makeMove(CLICK_MOVES[cubeNumber][event.button === 0 ? 0 : 1][index])
        }
    })

    updatePolygons()
}

function createColourLegend() {
    const container = document.getElementById("colour-legend")

    COLOURS.forEach((colour, i) => {
        const wrapper = document.createElement("div")
        wrapper.className = "swatch-row"

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

        const indicator = document.createElement("span")
        indicator.className = "swatch-indicator"

        label.style.backgroundColor = colour
        label.appendChild(input)
        label.appendChild(count)
        label.addEventListener("click", (e) => {
            if (paintMode) {
                e.preventDefault()
                setActivePaintColour(i)
            }
        })
        wrapper.appendChild(label)
        wrapper.appendChild(indicator)
        container.appendChild(wrapper)
        swatches.push({ label, input, count, indicator })
    })

    const leftPanel = document.getElementById("leftPanel")

    const applyBtn = document.createElement("button")
    applyBtn.id = "paint-apply-btn"
    applyBtn.textContent = "Apply"
    applyBtn.classList.add("hide")
    applyBtn.disabled = true
    applyBtn.addEventListener("click", () => {
        exitPaintMode(container, applyBtn, true)
        document.getElementById("paint").checked = false
    })
    document.getElementById("paint-row").appendChild(applyBtn)

    const themeSelector = document.createElement("div")
    themeSelector.id = "theme-selector"

    const themeNames = [...Object.keys(THEMES), "custom"]
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
    let allValid = true
    swatches.forEach(({ count, indicator }, i) => {
        const n = state.filter(v => v === i).length
        count.textContent = n
        indicator.textContent = n === 9 ? "\u2713" : "\u2717"
        indicator.classList.toggle("ok", n === 9)
        indicator.classList.toggle("err", n !== 9)
        if (n !== 9) allValid = false
    })
    const applyBtn = document.getElementById("paint-apply-btn")
    if (applyBtn) applyBtn.disabled = !allValid
}

function togglePaintMode() {
    const input = document.getElementById("paint")
    const container = document.getElementById("colour-legend")
    const applyBtn = document.getElementById("paint-apply-btn")
    if (input.checked) {
        enterPaintMode(container, applyBtn)
    } else {
        exitPaintMode(container, applyBtn, false)
    }
}

function setActivePaintColour(i) {
    activePaintColour = i
    swatches.forEach(({ label }, idx) => label.classList.toggle("active", idx === i))
}

function enterPaintMode(container, applyBtn) {
    paintMode = true
    paintModeCubeState = Array(54).fill(-1)
    updatePolygons()
    updateSwatchCounts()
    applyBtn.classList.remove("hide")
    container.classList.add("paint-mode")
    setActivePaintColour(0)
}

function exitPaintMode(container, applyBtn, apply) {
    if (apply) {
        saveCubeState(paintModeCubeState)
    }
    paintMode = false
    paintModeCubeState = null
    activePaintColour = null
    swatches.forEach(({ label }) => label.classList.remove("active"))
    updatePolygons()
    applyBtn.classList.add("hide")
    applyBtn.disabled = true
    container.classList.remove("paint-mode")
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
