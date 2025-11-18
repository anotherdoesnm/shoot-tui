const Client = require(".");
const config = require("../config.json");
const util = require("util");
const bot = new Client(config.instance);
bot.on("ready", () => {
  console.log(`${util.inspect(bot.user)} is ready`)
})
bot.login(config.token);