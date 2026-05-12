import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

function walk(d, acc = []) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name)
    if (f.isDirectory() && f.name !== "node_modules" && f.name !== ".next") walk(p, acc)
    else if (f.isFile() && /\.(tsx|ts|jsx|js)$/.test(f.name)) acc.push(p)
  }
  return acc
}

const roots = ["app", "components", "lib", "hooks", "contexts"].map((r) => path.join(root, r))
let all = []
for (const r of roots) {
  if (fs.existsSync(r)) all = all.concat(walk(r))
}

const uiDir = path.join(root, "components", "ui")
const uis = fs.readdirSync(uiDir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))

const dead = []
for (const f of uis) {
  const base = f.replace(/\.(tsx|ts)$/, "")
  const needle = `@/components/ui/${base}`
  const needle2 = `components/ui/${base}`
  let hits = 0
  for (const fp of all) {
    if (fp.replace(/\\/g, "/").endsWith(`components/ui/${f}`)) continue
    const txt = fs.readFileSync(fp, "utf8")
    if (txt.includes(needle) || txt.includes(needle2)) hits++
  }
  if (hits === 0) dead.push(f)
}

console.log(dead.sort().join("\n"))
console.error("dead count:", dead.length)
