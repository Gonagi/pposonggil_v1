const express = require('express');
const https = require('https');
const transport = require('./public_transport.js');
const fs = require('fs');
const fs2 = require('fs').promises;
const bodyParser = require('body-parser');
const path = require('path');
const url = require('url');
const { resourceUsage } = require('process');
var POI = require('./POI.js');
const fetch = require('node-fetch');

const app = express();
const port = 1521;

//날짜, 시간 구하기
function getTimeStamp(i) {
    var d = new Date();
    if (i == 1) {   // 날짜
        var s =
            leadingZeros(d.getFullYear(), 4) + leadingZeros(d.getMonth() + 1, 2) + leadingZeros(d.getDate(), 2);
    }
    else if (i == 2) {  // 시간
        var s = leadingZeros(d.getHours(), 2) + leadingZeros(d.getMinutes(), 2);
    }
    else if (i == 3) {  // 30분간격 4개의 시간 배열
        let s0 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
        d.setMinutes(d.getMinutes() + 30);
        let s1 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
        d.setMinutes(d.getMinutes() + 30);
        let s2 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
        d.setMinutes(d.getMinutes() + 30);
        let s3 = leadingZeros(d.getHours(), 2) + ":" + leadingZeros(d.getMinutes(), 2);
        var s = [s0, s1, s2, s3];
    }
    return s;
}

function leadingZeros(n, digits) {
    return n.toString().padStart(digits, '0');
}

//수정 2023.11.20 채수아
//기존 main.js에서 test.js로 이동
/*
async function readFile(filePath) {
    try {
        const data = await fs2.readFile(filePath, 'utf8');
        return data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}
*/
const options = {
    key: fs.readFileSync('./localhost.key'),
    cert: fs.readFileSync('./localhost.crt')
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '/public')));

//main화면 map 추가
//수정 2023.12.1 채수아
app.get("/main", async (req, res) => {
    const filePath = path.join(__dirname, "/views/map.html");
    fs.readFile(filePath, "utf8", (err, data) => {
        res.send(data);
    });
});

app.get('/main/POI', async (req, res) => {
    let stime = getTimeStamp(1) + "1200";
    let itime = parseInt(stime, 10);
    const filePath = path.join(__dirname, '/views/mainFunc.html');
    let Routes = {};

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
        }
        else {
            res.send(data);
        }
    });

});

//수정 2023.11.20 채수아
const { createDynamicHTML } = require('./test.js');
app.get('/main/POI/result', async (req, res) => {
    var resource = req.query;
    try {
        const html = await createDynamicHTML(resource);
        res.send(html);
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).send('Internal Server Error');
    }
});

https.createServer(options, app).listen(port);


