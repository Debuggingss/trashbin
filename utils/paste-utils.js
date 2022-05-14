const { createClient } = require("redis");

const client = createClient();
client.connect();

class Paste {
    constructor(filename, content, password = null) {
        this.filename = filename;
        this.content = content;
        this.password = password;
        this.uploaded_at = Date.now();
    }
}

const createPaste = async (paste) => {
    await client.set(
        paste.filename,
        JSON.stringify({
            filename: paste.filename,
            content: Buffer.from(paste.content).toString("base64"),
            password: paste.password,
            uploaded_at: paste.uploaded_at,
        })
    );

    console.log(`Created paste ${paste.filename}. Length: ${paste.content.length}`);
};

const getPaste = async (filename) => {
    const value = await client.get(filename);

    if (!value) return null;

    const json = JSON.parse(value);
    json.content = Buffer.from(json.content, "base64").toString();

    return json;
};

module.exports = {
    Paste,
    createPaste,
    getPaste,
};
