const fs = require('fs')
const zlib = require('zlib')
var AudioContext = require("web-audio-api").AudioContext;
var MusicTempo = require("music-tempo");
var parseString = require('xml2js').parseString;
const Dec = require('./dec.js')
let dec = new Dec()
const bpm = require('./bpm.js')

let oldDate = new Date()

dec.done = null

console.log('Initialised program')
console.log('Reading CCLocalLevels.dat')

let gdSave = process.env.HOME || process.env.USERPROFILE + "/AppData/Local/GeometryDash/CCLocalLevels.dat"

fs.readFile(gdSave, 'utf8', function (err, saveData) {
    if (err) return console.log("Could not open or find GD save file")
    let decoded = dec.decode(saveData)
    if (!decoded) return
    fs.writeFileSync('CCLocalLevels.xml', decoded, 'utf8')
    console.log(`Decoded save file and written to CCLocalLevels.xml`)
    sav()
})



// find bpm
function sav() {

    bpm.findBPM()

    var xml = fs.readFileSync('CCLocalLevels.xml')
    
    console.log(xml)
    xml = xml.toString()

    console.log('Extracting created levels')

    let parsed = xml.match(/<k>LLM_01<\/k><d><k>_isArr<\/k><t \/>(.+)<\/d><k>LLM_02<\/k><i>35<\/i>/)
    parsed = parsed[1].match(/<k>k45<\/k><i>(\d+)<\/i>/g)

    console.log('Extracted songs from created levels and saved them to CClocalLevels.json')

    fs.writeFileSync('CCLocalLevels.json', JSON.stringify(parsed, null, 4))

    console.log(`\n${new Date() - oldDate}ms elapsed`)

    textfile = fs.readFileSync('settings.txt').toString()
    json = fs.readFileSync('tempo.json')
    textfile = textfile.replace("BPBPM", json, JSON.parse(json)[0])
    console.log(textfile)
    fs.writeFileSync('settings.txt', textfile)
    // add bpm to text file

  

    const zlib = require('zlib')
    
    let colors = {o: 0.8, y: 0.9, g: 1.0}
    let gdLevels = process.env.HOME || process.env.USERPROFILE + "/AppData/Local/GeometryDash/CCLocalLevels.dat"
    let levelRegex = /(<k>k_0<\/k>.+?<k>k4<\/k><s>)(.+?)<\/s>/
    
    let localLevels = fs.readFileSync(gdLevels, 'utf8')
    console.log("Reading save...")
    
    if (!localLevels.startsWith('<?xml version="1.0"?>')) {
        function xor(str, key) {
            str = String(str).split('').map(letter => letter.charCodeAt());
            let res = "";
            for (i = 0; i < str.length; i++) res += String.fromCodePoint(str[i] ^ key);
            return res;
        }
        localLevels = xor(localLevels, 11)
        localLevels = Buffer.from(localLevels, 'base64')
        try { localLevels = zlib.unzipSync(localLevels).toString() }
        catch(e) { return console.log("Error! GD save file seems to be corrupt!") }
    }
    
    console.log("Parsing level data...")
    let foundLevel = localLevels.match(levelRegex)
    let foundData = foundLevel[2]
    let levelData = foundData.startsWith('kS38') ? foundData : zlib.unzipSync(Buffer.from(foundData, 'base64')).toString()
    levelData = levelData.replace(/kA14,.*?,/, "")  // clear old guidelined
    let guidelines = ""
    
    console.log("Adding guidelines...")
    let config = fs.readFileSync('./settings.txt', 'utf8').split("\n").map(x => x.replace(/\s/g, "").split(":")[1])
    let [BPM, songLength, offset, pattern] = config
    
    pattern = pattern.toLowerCase().split("")
    let beatsPerBar = pattern.length
    let secondsPerBeat = Math.abs(60 / (+BPM || 100))
    
    let beatCount = 0
    let secs = (+offset || 0) / 1000
    
    while (secs <= (+songLength || 150)) {
        let beat = pattern[beatCount % beatsPerBar]
        if (colors[beat]) guidelines += `${Number(secs.toFixed(5))}~${colors[beat]}~`
        beatCount++
        secs += secondsPerBeat
    }
    
    console.log("Saving level...")
    let newData = levelData.replace(",kA6,", `,kA14,${guidelines.slice(0, -1)},kA6,`)
    let newLevels = localLevels.replace(levelRegex, `$1${newData}</s>`)
    fs.writeFileSync(gdLevels, newLevels, 'utf8')
    console.log("Saved!")
}
