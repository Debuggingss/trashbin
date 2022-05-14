const http = require("http");
const path = require("path");
const express = require("express");

const { getRandomPhoneticKey, loadLimiter, createLimiter } = require("./utils/utils.js");
const { createPaste, getPaste, Paste } = require("./utils/paste-utils.js");

const config = require("./config.json");

if (config.password === "") {
    console.error("Password must be not empty or 'null'.");
    process.exit(1);
}

if (config.master_password === "") {
    console.error("Master password must be not empty or 'null'.");
    process.exit(1);
}

const filenameRegex = new RegExp(config.paste.filename_regex);

const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/public", express.static(path.join(__dirname, "./public")));

app.get("/", (req, res) => {
    res.render("create", {
        max_length: config.paste.max_length,
    });
});

app.post("/save", createLimiter, async (req, res) => {
    const { filename, content, dpassword, password } = req.body;

    if (!content) {
        res.status(400).json({
            error: "No content provided.",
        });
        return;
    }

    if (content.length > config.paste.max_length) {
        res.status(413).json({
            error: "Content is too long.",
        });
        return;
    }

    if (password !== config.password && password !== config.master_password) {
        res.status(403).json({
            error: "Invalid password.",
        });
        return;
    }

    let pastename = getRandomPhoneticKey(config.paste.filename_length);

    if (filename && filename !== "") {
        if (config.master_password && password !== config.master_password) {
            res.status(400).json({
                error: "Master password is required for custom filenames.",
            });
            return;
        }

        if (!filenameRegex.test(filename)) {
            res.status(400).json({
                error: `Invalid filename. Filename must match the regular expression:\n${config.paste.filename_regex}`,
            });
            return;
        }

        pastename = filename;
    }

    const existing = await getPaste(pastename);

    if (existing) {
        res.status(409).json({
            error: "Paste with that name already exists.",
        });
        return;
    }

    const paste = new Paste(pastename, content, dpassword);

    await createPaste(paste);

    res.status(201).json({
        filename: paste.filename,
    });
});

app.get("/:filename", loadLimiter, async (req, res) => {
    sendDocument(req, res, false);
});

app.get("/raw/:filename", loadLimiter, async (req, res) => {
    sendDocument(req, res, true);
});

const sendDocument = async (req, res, raw) => {
    const { filename } = req.params;
    const { password } = req.query;

    let syntax = "";
    let name = filename;

    if (filename.includes(".")) {
        [name, syntax] = filename.split(".");
    }

    console.log(`Requested paste ${filename}.`);

    const paste = await getPaste(name);

    if (!paste) {
        res.redirect("/");
        return;
    }

    if (paste.password && paste.password !== password) {
        res.render("password", {
            filename: paste.filename,
            raw: raw,
        });
        return;
    }

    if (raw) {
        res.set({
            "Content-Type": "text/plain",
        });

        res.send(paste.content);
    } else {
        res.render("view", {
            filename: paste.filename,
            content: paste.content,
            syntax: syntax,
        });
    }
};

server.listen(config.port, () => {
    console.log(`Listening on port ${config.port}.`);
});
