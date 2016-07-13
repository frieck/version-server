'use strict';
const fs = require('fs');
const express = require('express');
const path = require('path');
const serveIndex = require('serve-index');
const app = express();
const manifest = require('./package.json');

var port = process.env.PORT || 9003;

var generateError = (description) => {
    return {
        status: "error",
        err: description
    }
}

app.use(require('morgan')('dev'));

app.use('/releases', express.static(path.join(__dirname, 'data/releases')));

app.use('/releases/darwin', serveIndex(path.join(__dirname, 'data/releases/darwin'), {
    icons: true
}));
app.use('/releases/win32', serveIndex(path.join(__dirname, 'data/releases/win32'), {
    icons: true
}));

app.get('/updates/latest/darwin', (req, res) => {
    const platform = "darwin";

    if (!platform || platform === ':os') {
        res.json(generateError("Nenhuma plataforma foi especificada!"));
    }

    const latest = getLatestRelease(platform);
    if (latest.status != "error") {
        const clientVersion = req.query.v;

        if (clientVersion === latest.version) {
            res.status(204).end();
        } else {
            res.json({
                platform: `${platform}`,
                url: `${getBaseUrl(req)}/releases/${platform}/${latest.version}/${latest.file}`
            });
        }

    } else {
        res.json({
            status: latest.status,
            description: latest.err
        })
    }
});

app.get('/updates/win32', (req, res) => {

});

let getLatestRelease = (platform) => {

    var ret = {
        status: "",
        description: "",
        version: "",
        file: ""
    }

    const dir = `${__dirname}/data/releases/${platform}`;
    try {
        var completePath;
        const versionsDesc = fs.readdirSync(dir).filter((file) => {
            const filePath = path.join(dir, file);
            completePath = filePath;
            return fs.statSync(filePath).isDirectory();
        }).reverse();

        console.log("versionsDesc: " + versionsDesc[0]);

        ret.status = "success";
        ret.version = versionsDesc[0];
        console.log(completePath);
        var files = fs.readdirSync(completePath);
        for (var i in files) {
            if (path.extname(files[i]) === ".zip") {
                ret.file = files[i];
            }
        }

    } catch (error) {
        ret = generateError(error);
    }

    if (ret.file == "") {
        ret = generateError(`Nenuma versão encontrada para a plataforma ${platform}!`);
    }

    return ret;
}

let getBaseUrl = (req) => {
    return `${req.protocol}://${req.get('host')}`;
}

app.listen(port, () => {
    console.log(`${manifest.name} listening on port ${port}`);
});