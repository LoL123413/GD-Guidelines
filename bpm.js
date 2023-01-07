var AudioContext = require("web-audio-api").AudioContext;
var MusicTempo = require("music-tempo");
const fs = require('fs')

function findBPM() {
    let rawdata = fs.readFileSync('CCLocalLevels.json');
    let songID = JSON.parse(rawdata)[0];
    songID = songID.toString()
    let songID2 =  songID.replace("<k>k45</k><i>", "")
    let songID3 = songID2.replace("</i>", "")
    songID3 += ".mp3"
    console.log(songID3);
    

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



    var data = fs.readFileSync(`${process.env.LOCALAPPDATA}\\GeometryDash\\${songID3}`);
    var context = new AudioContext();
    context.decodeAudioData(data, calcTempo);
}

module.exports = { findBPM };