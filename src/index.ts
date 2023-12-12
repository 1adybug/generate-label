import { Resvg } from "@resvg/resvg-js"
import { isFullWidthChar, splitTextToLines } from "deepsea-tools-node"
import express from "express"
import { readdir, writeFile } from "fs/promises"
import md5 from "md5"

const app = express()

app.use(express.json())

app.use("/images", express.static("./static/images"))

function getSvg(text: string) {
    const fontSize = 32
    const paddingX = 16
    const paddingY = 8
    const lineHeight = 48
    const backgroundColor = "#011023"
    const textColor = "#FFFFFF"
    const fontWight = "bold"
    const opacity = 0.6
    const borderRadius = 8
    const lines = splitTextToLines(text, { maxWidth: 50, maxLines: 3 })
    const maxLength = Math.max(...lines.map(line => Array.from(line).reduce((prev: number, item) => prev + (isFullWidthChar(item) ? 1 : 0.5), 0)))
    const width = paddingX * 2 + maxLength * fontSize
    const height = paddingY * 2 + lines.length * lineHeight

    return `<svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <path d="M 0 ${borderRadius} L 0 ${height - borderRadius} A ${borderRadius} ${borderRadius} 0 0 0 ${borderRadius} ${height} L ${width - borderRadius} ${height} A ${borderRadius} ${borderRadius} 0 0 0 ${width} ${height - borderRadius} L ${width} ${borderRadius} A ${borderRadius} ${borderRadius} 0 0 0 ${width - borderRadius} 0 L ${borderRadius} 0 A ${borderRadius} ${borderRadius} 0 0 0 0 ${borderRadius} Z" fill="${backgroundColor}" fill-opacity="${opacity}" />
${lines.map((line, index) => `    <text x="${paddingX}" y="${paddingY + (18 / 16) * fontSize + index * lineHeight}" fill="${textColor}" font-size="${fontSize}" font-weight="${fontWight}">${line}</text>`).join("\n")}
</svg>`
}

async function generateImage(text: string): Promise<string> {
    const hash = md5(splitTextToLines(text, { maxWidth: 50, maxLines: 3 }).join(""))
    const dir = await readdir("./static/images")
    if (dir.includes(`${hash}.png`)) return hash
    const svg = getSvg(text)
    const resvg = new Resvg(svg, {
        font: {
            fontFiles: ["./static/fonts/Alibaba-PuHuiTi-Bold.ttf"],
            loadSystemFonts: false
        }
    })
    const png = resvg.render()
    const buffer = png.asPng()
    await writeFile(`./static/images/${hash}.png`, buffer)
    return hash
}

app.get("/get-image", async (req, res) => {
    try {
        const text = req.query.text
        if (typeof text !== "string" || text.length === 0) {
            res.status(400).send("Bad Request")
            return
        }
        const hash = generateImage(text)
        res.redirect(`/images/${hash}.png`)
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
})

app.post("/update-camera", async (req, res) => {
    try {
        const { x, y, z, rx, ry, rz } = req.body
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
})

app.listen(3000)
