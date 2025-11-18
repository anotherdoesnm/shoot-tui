const config = require("./config.json")
const Client = require("./sdk");
const blessed = require("blessed");
const client = new Client(config.instance);
const util = require("util");
function splitLongStringToArray(inputString, maxLength = 48) {
    const words = inputString.split(' ');
    const result = [];
    let currentLine = '';
    words.forEach(word => {
        if (currentLine.length + word.length + 1 > maxLength) {
            result.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    });
    if (currentLine) {
        result.push(currentLine.trim());
    }
    return result;
}

let activeChannel = null;
const screen = blessed.screen({
  smartCSR: true
})
const style = {
  border: {
    type: 'line',
  },
  tags: true,
  keys: true,
  style: {
    border: {
      fg: 'grey'
    },
    focus: {
      fg: 'white'
    },
    selected: {
      bg: 'white',
      fg: 'black'
    }
  }
}
const channelsList = blessed.list({
  height: '100%',
  width: '15%',
  ...style
});
channelsList.on("select", async data => {
  data = data.getText();
  if(!data.startsWith("#")) return;
  const messages = await client.fetchMessages(client.index[channelsList.getItemIndex(data)]);
  activeChannel = client.index[channelsList.getItemIndex(data)]
  messagesBox.setContent('');
  messages.forEach(m => {
    splitLongStringToArray(m.content).forEach(c => messagesBox.add(`${m.author_id}: ${c}`))
  })
  screen.render();
})
client.on("MESSAGE_CREATE", m => {
  m = m.message;
  if(activeChannel == m.channel_id){
    splitLongStringToArray(m.content).forEach(c => messagesBox.add(`${m.author_id}: ${c}`))
  }
})
screen.key("escape", () => {
  process.exit(0);
})
const messagesBox = blessed.log({
  left: '15%',
  height: '98%',
  width: '65%',
  ...style,
})

const messagebox = blessed.textbox({
  height: '6%', 
  width: '65%',
  left: '15%',
  top: '95%',
  ...style
});
client.index = [];
client.on("ready", () => {
  channelsList.add("Private");
  client.index.push("Private");
  client.channels.forEach(c => {
    channelsList.add("#" + c.name);
    client.index.push(c.mention);
  })
  client.guilds.forEach(g => {
    client.index.push(g.name);
    channelsList.add(g.name);
    g.channels.forEach(c => {
    channelsList.add("#" + c.name)
    client.index.push(c.mention);
    })
  })
  screen.render();
})
channelsList.key('right', () => {
  messagebox.focus()
  messagebox.readInput(() => {
    client.sendTextMessage(activeChannel,messagebox.getValue());
      messagebox.clearValue();
  })
})
messagebox.key('left', ()=>{
  channelsList.focus();
})

const membersBox = blessed.list({
  left: '85%',
  height: '100%',
  width: '15%',
  ...style
})
screen.append(channelsList)
screen.append(messagesBox);
screen.append(membersBox);
screen.append(messagebox);
client.login(config.token);
screen.render();