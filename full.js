var AudioContext = require("web-audio-api").AudioContext;
var MusicTempo = require("music-tempo");
const fs = require('fs')
const getMP3Duration = require('get-mp3-duration')
const zlib = require('zlib')



    function xor(str, key) {     
        str = String(str).split('').map(letter => letter.charCodeAt());
        let res = "";
        for (let i = 0; i < str.length; i++) res += String.fromCodePoint(str[i] ^ key);
        return res; 
    }

    function decode(data){
        console.log("Decoding...")
        if (data.startsWith('<?xml version="1.0"?>')) return data
        let decoded = xor(data, 11)
        decoded = Buffer.from(decoded, 'base64')
        try { return zlib.unzipSync(decoded).toString() }
        catch (e) { return console.log("Error! GD save file seems to be corrupt!") }
    }



let oldDate = new Date()

console.log('Initialised program')
console.log('Reading CCLocalLevels.dat')

let gdSave = process.env.HOME || process.env.USERPROFILE + "/AppData/Local/GeometryDash/CCLocalLevels.dat"

fs.readFile(gdSave, 'utf8', function (err, saveData) {
    if (err) return console.log("Could not open or find GD save file")
    let decoded = decode(saveData)
    if (!decoded) return
    fs.writeFileSync('CCLocalLevels.xml', decoded, 'utf8')
    console.log(`Decoded save file and written to CCLocalLevels.xml`)
    var xml = fs.readFileSync('CCLocalLevels.xml')

    console.log(xml)
    xml = xml.toString()

    console.log('Extracting created levels')

    let parsed = xml.match(/<k>LLM_01<\/k><d><k>_isArr<\/k><t \/>(.+)<\/d><k>LLM_02<\/k><i>35<\/i>/)
    parsed = parsed[1].match(/<k>k45<\/k><i>(\d+)<\/i>/g)

    console.log('Extracted songs from created levels and saved them to CClocalLevels.json')

    fs.writeFileSync('CCLocalLevels.json', JSON.stringify(parsed, null, 4))
    sav()
})



// find bpm
function sav() {

    findBPM()
    console.log(`\n${new Date() - oldDate}ms elapsed`)
    // add bpm to text file





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
    let offset = 0
    let pattern = 'G Y Y Y'
    let BPM = parseInt(fs.readFileSync('./tempo.json'))
    let songLength = parseInt(fs.readFileSync('./duration.json'))


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




function findBPM() {
    let rawdata = fs.readFileSync('CCLocalLevels.json');
    let songID = JSON.parse(rawdata)[0];
    songID = songID.toString()
    let songID2 =  songID.replace("<k>k45</k><i>", "")
    let songID3 = songID2.replace("</i>", "")
    songID3 += ".mp3"
    console.log(songID3);
    const buffer = fs.readFileSync(process.env.HOME || process.env.USERPROFILE + `/AppData/Local/GeometryDash/${songID3}`)
    const duration = getMP3Duration(buffer)
    let duras = duration/1000
    duras = Math.round(duras)
    fs.writeFileSync('./duration.json', JSON.stringify(duras, null, 4))

        

    var calcTempo = function (buffer) {
    var audioData = [];
    // Take the average of the two channels
    if (buffer.numberOfChannels == 2) {
    var channel1Data = buffer.getChannelData(0);
    var channel2Data = buffer.getChannelData(1);
    var length = channel1Data.length;
    for (var i = 0; i < length; i++) {
    audioData[i] = (channel1Data[i] + channel2Data[i]) / 2;
    }
    } else {
    audioData = buffer.getChannelData(0);
    }
    var mt = new MusicTempo(audioData);
    console.log(mt.tempo);
    jn = Math.round(mt.tempo)
    fs.writeFileSync('tempo.json', JSON.stringify(jn, null, 4))
    console.log(mt.beats);

    }

    console.log(duras)

    var data = fs.readFileSync(`${process.env.LOCALAPPDATA}\\GeometryDash\\${songID3}`);
    var context = new AudioContext();
    context.decodeAudioData(data, calcTempo);
 }