const http = require("http");
const path = require("path");
const express = require("express");

const {
    createPaste,
    getPaste,
    Paste,
} = require("./utils/paste-utils.js");

const {
    getRandomPhoneticKey,
} = require("./utils/utils.js");

const config = require("./config.json");

if (config.password === "") {
    console.error("Password must be not empty or 'null'.");
    process.exit(1);
}

if (config.master_password === "") {
    console.error("Master password must be not empty or 'null'.");
    process.exit(1);
}

const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "./public")));

app.get("/", (req, res) => {
    res.render("create");
});

app.post("/save", async (req, res) => {
    const { filename, content, dpassword, password } = req.body;

    if (!content) {
        return res.sendStatus(400);
    }

    if (password !== config.password && password !== config.master_password) {
        return res.sendStatus(403);
    }

    const existing = await getPaste(filename);

    if (existing) {
        return res.sendStatus(409);
    }

    let pastename = getRandomPhoneticKey(config.paste.filename_length);
    
    if (filename && filename !== "") {
        if (config.master_password && password !== config.master_password) {
            return res.sendStatus(406);
        }

        pastename = filename;
    }

    const paste = new Paste(pastename, content, dpassword)

    await createPaste(paste);

    return res.status(201).json({
        filename: paste.filename,
    });
});

app.get("/:filename", async (req, res) => {
    sendDocument(req, res, false);
});

app.get("/raw/:filename", async (req, res) => {
    sendDocument(req, res, true);
});

const sendDocument = async (req, res, raw) => {
    const { filename } = req.params;
    const { password } = req.query;

    console.log(`Requested paste ${filename}.`);

    const paste = await getPaste(filename);

    if (!paste) {
        res.redirect("/");
        return;
    }

    if (paste.password && paste.password !== password) {
        return res.render("password", {
            filename: paste.filename,
            raw: raw,
        });
    }

    if (raw) {
        res.set({
            "Content-Type": "text/plain"
        });

        res.send(paste.content);
    } else {
        res.render("view", {
            filename: paste.filename,
            content: paste.content,
        });
    }
}

server.listen(config.port, () => {
    console.log(`Listening on port ${config.port}.`);
});
