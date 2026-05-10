const config = require("./config.json");
const Client = require("./sdk");
const ChatUI = require("./ui");
const state = require("./state");

const client = new Client(config.instance);
const ui = new ChatUI();

ui.channelsList.on("select", async (item, index) => {
  const channel = state.channels[index];
  if (!channel || !channel.id) return;

  state.setActiveChannel(channel.id, `#${channel.name}`);

  try {
    const messages = await client.fetchMessages(channel.id);
    
    let actualMessages = [];
    if (Array.isArray(messages)) {
      actualMessages = messages;
    } else if (messages && Array.isArray(messages.messages)) {
      actualMessages = messages.messages;
    }

    if (actualMessages.length > 0) {
      ui.renderMessages(actualMessages.reverse());
    } else {
      ui.messagesBox.setContent("{grey-fg}No messages in this channel yet{/}");
      ui.screen.render();
    }
  } catch (err) {
    ui.messagesBox.add(`{red-fg}Error: ${err.message}{/}`);
    ui.screen.render();
  }
});

ui.inputBox.on("submit", (text) => {
  if (!text.trim() || !state.activeChannel) {
    ui.inputBox.clearValue();
    ui.screen.render();
    return;
  }
  client.sendTextMessage(state.activeChannel, text);
  ui.inputBox.clearValue();
  ui.inputBox.focus();
  ui.screen.render();
});

// ЕДИНСТВЕННЫЙ обработчик входящих сообщений
client.on("MESSAGE_CREATE", (payload) => {
  const m = payload.message || payload; // Распаковка обертки шлюза

  if (state.activeChannel === m.channel_id) {
    ui.renderSingleMessage(m);
    ui.screen.render();
  } else {
    state.addUnread(m.channel_id);
  }
});

client.on("ready", (data) => {
  state.channels = [];

  const channels = Array.isArray(data.channels) ? data.channels : Object.values(data.channels || {});
  const guilds = Array.isArray(data.guilds) ? data.guilds : Object.values(data.guilds || {});
  const dms = Array.isArray(data.dms) ? data.dms : Object.values(data.dms || {});

  if (dms.length > 0) {
    ui.channelsList.addItem("Private");
    state.channels.push({ id: "Private", name: "Private" });
  }

  channels.forEach((c) => {
    ui.channelsList.addItem(`#${c.name}`);
    state.channels.push({ id: c.mention, name: c.name });
  });

  guilds.forEach((g) => {
    ui.channelsList.addItem(g.name);
    state.channels.push({ id: null, name: g.name });
    const gChannels = Array.isArray(g.channels) ? g.channels : Object.values(g.channels || {});
    gChannels.forEach((c) => {
      ui.channelsList.addItem(`  #${c.name}`);
      state.channels.push({ id: c.mention, name: c.name });
    });
  });

  ui.channelsList.focus();
  ui.screen.render();
});

client.login(config.token);