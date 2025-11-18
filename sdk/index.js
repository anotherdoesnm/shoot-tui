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
			this.ws.send(
				JSON.stringify({
					t: "heartbeat",
					s: this.seq,
				}),
			);
		}, 7000);
		this.emit("ready", null);
	}
	fetchMessages(channel){
	  return fetch(`${this.instance}/channel/${channel}/messages`, {
	    headers: {
	      'Content-Type': 'application/json',
	      'Authorization': this.token
	    }
	  }).then(r => r.json())
	}
	sendTextMessage(channel, content) {
		fetch(`${this.instance}/channel/${channel}/messages`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: this.token,
			},
			body: JSON.stringify({
				content: content,
			}),
		});
	}
	login(token) {
		this.token = token;
		this.ws = new WebSocket(this.instance);
		this.ws.addEventListener("open", () => {
			this.ws.send(
				JSON.stringify({
					t: "identify",
					token: token,
				}),
			);
		});
    this.on("READY", this.ready);
		this.ws.addEventListener("message", (msg) => {
			const pack = JSON.parse(msg.data);
			this.seq++;
			this.emit(pack.t, pack.d);
		});
		this.ws.addEventListener("close", (ev) => {
			console.log("websocket closed with code", ev.code);
		});
	}
}
module.exports = Client;
