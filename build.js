const fs = require('fs')
const { execSync } = require('child_process')
const { minify } = require('terser')
const CleanCSS = require('clean-css')

function getGitHash() {
    try {
        const full = process.env.GITHUB_SHA
            ?? execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
        return { full, short: full.slice(0, 7) }
    } catch {
        return null
    }
}

async function build() {
    const html = fs.readFileSync('index.html', 'utf8')
    const cubeJs = fs.readFileSync('cube.js', 'utf8')
    const indexJs = fs.readFileSync('index.js', 'utf8')
    const css = fs.readFileSync('style.css', 'utf8')

    // Embed favicon as base64 data URI to avoid a second request
    const faviconB64 = fs.readFileSync('favicon.png').toString('base64')
    const faviconUri = `data:image/png;base64,${faviconB64}`

    const minJS = (await minify(cubeJs + '\n' + indexJs, { compress: true, mangle: true })).code
    const minCSS = new CleanCSS({ level: 2 }).minify(css).styles

    const hash = getGitHash()
    const buildInfoHtml = hash
        ? `<a id="build-info" href="https://github.com/mic-max/rubix/commit/${hash.full}" target="_blank">Version ${hash.short}</a>`
        : '<span id="build-info"></span>'

    let out = html
        .replace('<link rel="stylesheet" href="style.css">', `<style>${minCSS}</style>`)
        .replace('<link rel="icon" href="favicon.png">', `<link rel="icon" href="${faviconUri}">`)
        .replace('<script src="cube.js"></script>', '')
        .replace('<script src="index.js"></script>', `<script>${minJS}</script>`)
        .replace('<span id="build-info"></span>', buildInfoHtml)
        // Strip HTML comments and collapse whitespace
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .replace(/> </g, '><')
        .trim()

    fs.mkdirSync('dist', { recursive: true })
    fs.writeFileSync('dist/index.html', out)

    const kb = (Buffer.byteLength(out) / 1024).toFixed(1)
    console.log(`dist/index.html — ${kb} KB`)

    const solverSrc = fs.readFileSync('sw.js', 'utf8')
        .replace(/importScripts\('cube\.js'\)\r?\n/, '')
    const minSolverJs = (await minify(cubeJs + '\n' + solverSrc, { compress: true, mangle: true })).code
    fs.writeFileSync('dist/sw.js', minSolverJs)
    const solverKb = (Buffer.byteLength(minSolverJs) / 1024).toFixed(1)
    console.log(`dist/sw.js — ${solverKb} KB`)
}

module.exports = { build }

if (require.main === module) {
    build().catch(err => { console.error(err); process.exit(1) })
}
