const fs = require('fs')
require('dotenv').config()

const rawData = fs.readFileSync('./messages.json')
const { conversations } = JSON.parse(rawData)

if (!process.env.SKYPE_RECEPIENTS) {
    console.error("no SKYPE_RECEPIENTS")
    process.exit(1)
}
const year = process.env.YEAR || '' + (new Date().getFullYear())
const interesedIn = process.env.SKYPE_RECEPIENTS.split(",")
const isOneOf = (value, arr) => (arr.some(v => (value.toLowerCase().indexOf(v) !== -1)));
const filtered = conversations.filter(conv => (
    isOneOf(conv.displayName || '-', interesedIn)
))
const months = [ 'Jan','Feb','Mar','Apr','May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov','Dec' ];
const dims = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const pad2 = x => ((x >= 10) ? x : `0${x}`);
const lim8 = x => ((x >= 8) ? 8 : x);

const getSums = (arr, dt) => {
    if (!arr[dt]) { arr[dt] = 0; }
    arr[dt]++
    return arr
}
const mergedDateStat = (merged, arr) => {
    Object.keys(arr).map(dt => {
        if (!merged[dt]) { merged[dt] = 0; }
        merged[dt] += arr[dt]
    })
    return merged
}
const dailyStats = (conversations) => {
    return conversations.map(cnv => (
        cnv.MessageList
            .filter(m => m.originalarrivaltime.substring(0, 4) === year)
            .map(m => m.originalarrivaltime.substring(0, 10))
            .reduce(getSums, {})
    )).reduce(mergedDateStat, {})
}
const mergedMessages = (merged, messages) => {
    messages.map(msg => {
        // if (!merged[dt]) { merged[dt] = 0; }
        // merged[dt] += arr[dt]
        merged.push(msg)
    })
    return merged
}
const byArrival = (v1, v2) => (v2.originalarrivaltime > v1.originalarrivaltime ? -1 : 1);

const getChats = (conversations, dt) => {
    return conversations.map(cnv => (
        cnv.MessageList
            .filter(m => m.originalarrivaltime.substring(0, dt.length) === dt)
    )).reduce(mergedMessages, []).sort(byArrival)
}

console.log(conversations.length + ' conversations loaded')
console.log(filtered.length + ' interested conversations')
// console.log(JSON.stringify(dailyStats(filtered), null, 2))
// fs.writeFileSync("./filtered.json", JSON.stringify(filtered, null, 2))

const express = require('express')
const app = express()
app.set('view engine', 'pug')
app.use(express.static(__dirname + '/public'));


const port = 3000
app.get('/dt/:dt', (req, res) => {
    const dt = req.params.dt;
    res.render('chats', { 
        months, dims, year, pad2, lim8,
        pageTitle: 'Chats for ' + dt, 
        dailyStats: dailyStats(filtered),
        chats: getChats(filtered, dt)
    })
})

app.get('/', (req, res) => 
    res.render('index', { 
        months, dims, year, pad2, lim8,
        pageTitle: 'Calendar for ' + year, 
        dailyStats: dailyStats(filtered) 
    })
)
app.listen(port, () => console.log(`Example app listening http://localhost:${port}/`))