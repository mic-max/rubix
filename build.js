const fs = require('fs')
const { minify } = require('terser')
const CleanCSS = require('clean-css')

async function build() {
    const html = fs.readFileSync('index.html', 'utf8')
    const js = fs.readFileSync('index.js', 'utf8')
    const css = fs.readFileSync('style.css', 'utf8')

    // Embed favicon as base64 data URI to avoid a second request
    const faviconB64 = fs.readFileSync('favicon.png').toString('base64')
    const faviconUri = `data:image/png;base64,${faviconB64}`

    const minJS = (await minify(js, { compress: true, mangle: true })).code
    const minCSS = new CleanCSS({ level: 2 }).minify(css).styles

    let out = html
        .replace('<link rel="stylesheet" href="style.css">', `<style>${minCSS}</style>`)
        .replace('<link rel="icon" href="favicon.png">', `<link rel="icon" href="${faviconUri}">`)
        .replace('<script src="index.js"></script>', `<script>${minJS}</script>`)
        // Strip HTML comments and collapse whitespace
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .replace(/> </g, '><')
        .trim()

    fs.mkdirSync('dist', { recursive: true })
    fs.writeFileSync('dist/index.html', out)

    const kb = (Buffer.byteLength(out) / 1024).toFixed(1)
    console.log(`dist/index.html — ${kb} KB`)
}

build().catch(err => { console.error(err); process.exit(1) })
