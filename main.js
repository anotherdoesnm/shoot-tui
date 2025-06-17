const blessed = require("blessed");
const instance = "https://shoot.doesnm.cc/api";
const token = "";

function splitLongStringToArray(inputString, maxLength = 48) {
    const words = inputString.split(' '); // Split the string into words
    const result = [];
    let currentLine = '';

    words.forEach(word => {
        // Check if adding the next word would exceed the max length
        if (currentLine.length + word.length + 1 > maxLength) {
            // If it does, add the current line to the result and start a new line
            result.push(currentLine.trim());
            currentLine = word + ' '; // Start a new line with the current word
        } else {
            // If it doesn't, add the word to the current line
            currentLine += word + ' ';
        }
    });

    // Add any remaining text in the current line to the result
    if (currentLine) {
        result.push(currentLine.trim());
    }

    return result;
}

let activeChannel = null;
const screen = blessed.screen({
  smartCSR: true
})
const guildsList = blessed.list({
  height: '100%',
  width: '15%',
  border: {
    type: 'line'
  },
  tags: true,
  keys: true,
  style: {
    border: {
      fg: 'grey'
    },
    selected: {
      bg: 'white',
      fg: 'black'
    },
    focus: {
      border: {
        fg: 'white'
      }
    }
  }
})
guildsList.on("select", data => {
  data = data.getText();
  channelsList.clearItems();
  if(data == "Private"){
    dms.forEach(d => channelsList.add(d.name))
    screen.render()
    return;
  }
  guilds.find(g => g.name == data).channels.forEach(c => {
    channelsList.addItem(c.name)
  })
  screen.render();
})
guildsList.key('right', () => {
  channelsList.focus();
  screen.render();
})

const channelsList = blessed.list({
  left: '15%',
  height: '100%',
  width: '15%',
  border: {
    type: 'line'
  },
  tags: true,
  keys: true,
  style: {
    border: {
      fg: 'grey'
    },
    focus: {
      border: {
        fg: 'white'
      }
    },
    selected: {
      bg: 'white',
      fg: 'black'
    }
  }
});
channelsList.key('left', () => {
  guildsList.focus();
  screen.render();
})
channelsList.on("select", data => {
  data = data.getText();
  let c;
  if(guildsList.getItem(guildsList.selected).getText() == "Private"){
    c = dms.find(f => f.name == data)
    membersBox.clearItems()
    c.recipients.forEach(r => {
      membersBox.addItem(r.split("@")[0])
    })
  }else{
  const selectedGuildName = guildsList.getItem(guildsList.selected).getText(); // Get the text of the selected guild
  const selectedGuild = guilds.find(g => g.name === selectedGuildName);
    c = selectedGuild.channels.find(c => c.name == data);
ws.send(JSON.stringify({
     t: "members",
     channel_id: `${c.id}@${c.domain}`,
     range: [0,100]
   }))
  }
   activeChannel = `${c.id}@${c.domain}`
   
   if(!c.messages){
     c.messages = [];
     fetch(`${instance}/channel/${c.id}@${c.domain}/messages`, {
       headers: {
         'Authorization': token
       }
     }).then(r => r.json()).then(json => {
       c.messages = json.reverse();
       messagesBox.clearItems()
       messagesBox.addItem(`Messages in #${c.name}`)
       c.messages.forEach(m =>
       splitLongStringToArray(`${m.author_id.split("@")[0]}: ${m.content}`).forEach(e => messagesBox.addItem(e)))
       
       messagesBox.select(messagesBox.items.length)
       screen.render();
     })
   }else{
       messagesBox.clearItems()
       messagesBox.addItem(`Messages in #${c.name}`)
c.messages.forEach(m =>
       splitLongStringToArray(`${m.author_id.split("@")[0]}: ${m.content}`).forEach(e => messagesBox.addItem(e)))
       messagesBox.select(messagesBox.items.length)
       screen.render();
       
   }
})
const messagesBox = blessed.list({
  left: '30%',
  height: '98%',
  width: '55%',
  border: {
    type: 'line'
  },
  tags: true,
  keys: true,
  style: {
    border: {
      fg: 'grey'
    },
    focus: {
      border: {
        fg: 'white'
      }
    },
    selected: {
      bg: 'white',
      fg: 'black'
    }
  },
  alwaysScroll: true
})

const messagebox = blessed.textbox({
  //inputOnFocus: true,
  height: '6%', 
  width: '55%',
  left: '30%',
  top: '95%',
  border: {
    type: 'line'
  },
  style: {
    border: {
      fg: 'grey'
    },
    focus: {
      border: {
        fg: 'white'
      }
    },
    fg: 'white',
    bg: 'black'
  }
});

//form.append(messagebox)
const readAndSend =() => {
    if(!activeChannel) return;
    fetch(`${instance}/channel/${activeChannel}/messages`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        content: messagebox.getValue()
      })
    }).then()
    messagebox.clearValue()
    screen.render()
  }
channelsList.key('right', () => {
  messagebox.focus()
  messagebox.readInput(readAndSend)
})
messagebox.key('left', ()=>{
  channelsList.focus();
})

const membersBox = blessed.list({
  left: '85%',
  height: '100%',
  width: '15%',
  border: {
    type: 'line'
  },
  tags: true,
  style: {
    border: {
      fg: 'grey'
    },
  }
})
screen.append(guildsList)
screen.append(channelsList)
screen.append(messagesBox);
screen.append(membersBox);
screen.append(messagebox);
guildsList.focus();



let seq = 0;
let guilds = [];
let dms = [];
let relationships = [];
const ws = new WebSocket(`${instance}`);
ws.addEventListener("open", () => {
  ws.send(JSON.stringify({
    t: "identify",
    token: token
  }))
})
screen.key(['escape', 'C-c'], function(ch, key) {
    ws.close()
});
ws.addEventListener("message", msg => {
  //console.log(msg.data)
  const pack = JSON.parse(msg.data);
  seq++;
  if(pack.t == "READY"){
    messagesBox.addItem(`${pack.d.user.name}@${pack.d.user.domain} is ready`)
    guilds = pack.d.guilds;
    guildsList.addItem("Private")
    guilds.forEach(g => {
      guildsList.addItem(g.name)
    })
    dms = pack.d.channels;
    relationships = pack.d.relationships;
    setInterval(() => {
      ws.send(JSON.stringify({
        t: "heartbeat",
        s: seq
      }))
    },8000)
    screen.render();
  }else if(pack.t == "MESSAGE_CREATE"){
    const content = pack.d.message.content;
    //console.log(pack.d.message.author_id, content)
    //messagesBox.addItem(`${pack.d.message.author_id}: ${content}`)

if(guildsList.getItem(guildsList.selected).getText() == "Private"){
  const c = dms.find(d => d.id == pack.d.message.channel_id.split("@")[0])
  if(c){
if(c.id == activeChannel.split("@")[0]){
splitLongStringToArray(`${pack.d.message.author_id.split("@")[0]}: ${content}`).forEach(e => messagesBox.addItem(e))
         }
         if(!c.messages) return;
         c.messages.push(pack.d.message)
         messagesBox.select(messagesBox.items.length)
         screen.render()
  }
}else{
     guilds.forEach(g => {
       const c = g.channels.find(c => c.id == pack.d.message.channel_id.split("@")[0])
       //messagesBox.addItem(pack.d.message.channel_id)
       if(c){
         if(c.id == activeChannel.split("@")[0]){
splitLongStringToArray(`${pack.d.message.author_id.split("@")[0]}: ${content}`).forEach(e => messagesBox.addItem(e))
         }
         if(!c.messages) return;
         c.messages.push(pack.d.message)
         messagesBox.select(messagesBox.items.length)
         screen.render()
       }
     })
  }
       screen.render();
    if(content.startsWith('!ping')){
      fetch(`${instance}/channel/${pack.d.message.channel_id}/messages`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          content: "Pong!"
        })
      })
    }
  }else if(pack.t == "MEMBERS_CHUNK"){
    membersBox.clearItems()
    pack.d.items.forEach(e => {
      if(typeof e == 'string'){
        // TODO: handle role
      }else{
        membersBox.addItem(e.name)
      }
    })
  }else{
    //console.log(pack)
  }
});
ws.addEventListener("error",e=>{
  console.error(e);
})
ws.addEventListener("close", e => {
  process.exit(0)
})
