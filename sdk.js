const { EventEmitter } = require("events");

class Client extends EventEmitter {
    constructor(instance) {
        super();
        this.ws = null;
        this.seq = 0;
        this.instance = instance;
    }

    ready(data) {
        this.user = data.user;
        this.dms = data.dms;
        this.guilds = data.guilds;
        this.relationships = data.relationships;
        this.channels = data.channels;
        this.interval = setInterval(() => {
            this.ws.send(JSON.stringify({ t: "heartbeat", s: this.seq }));
        }, 7000);
        this.emit("ready", data); 
    }
    fetchMessages(channel) {
        // Кодируем @ в %40 и добавляем обязательный слеш в конце
        const encodedChannel = encodeURIComponent(channel);
        return fetch(`${this.instance}/channel/${encodedChannel}/messages/`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.token
            }
        }).then(r => {
            if (!r.ok) throw new Error(`API Error: ${r.status}`);
            return r.json();
        });
    }
    sendTextMessage(channel, content) {
        const encodedChannel = encodeURIComponent(channel);
        return fetch(`${this.instance}/channel/${encodedChannel}/messages/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: this.token,
            },
            body: JSON.stringify({ content }),
        });
    }
    login(token) {
        this.token = token;
        this.ws = new WebSocket(this.instance);
        this.ws.addEventListener("open", () => {
            this.ws.send(JSON.stringify({ t: "identify", token }));
        });
        this.on("READY", this.ready.bind(this));

        this.ws.addEventListener("message", (msg) => {
            const pack = JSON.parse(msg.data);
            this.seq++;
            this.emit(pack.t, pack.d);
        });
        this.ws.addEventListener("close", (ev) => {
            process.stderr.write(`WebSocket closed with code ${ev.code}\n`);
        });
    }
}

module.exports = Client;