const blessed = require("blessed");
const state = require("./state");

class ChatUI {
  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      fullUnicode: true,
      title: "Shoot TUI",
    });

    this.channelsList = blessed.list({
      left: 0,
      top: 0,
      width: "20%",
      height: "100%",
      border: { type: "line" },
      label: " Channels ",
      style: {
        selected: { bg: "blue", fg: "white" },
        focus: { border: { fg: "cyan" } },
      },
      keys: true,
      vi: true,
      mouse: true,
    });

    this.membersBox = blessed.list({
      right: 0,
      top: 0,
      width: "20%",
      height: "100%",
      border: { type: "line" },
      label: " Members ",
      style: {
        focus: { border: { fg: "cyan" } },
      },
      keys: true,
      vi: true,
      mouse: true,
    });

    this.messagesBox = blessed.log({
      left: "20%",
      width: "60%",
      top: 0,
      bottom: 3,
      border: { type: "line" },
      label: " Chat ",
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      style: {
        focus: { border: { fg: "cyan" } },
      },
    });

    this.inputBox = blessed.textbox({
      left: "20%",
      width: "60%",
      bottom: 0,
      height: 3,
      border: { type: "line" },
      label: " Input ",
      inputOnFocus: true,
      style: {
        focus: { border: { fg: "green" } },
      },
    });

    this.screen.append(this.channelsList);
    this.screen.append(this.membersBox);
    this.screen.append(this.messagesBox);
    this.screen.append(this.inputBox);

    this.screen.key(["escape", "q", "C-c"], () => process.exit(0));

    this.screen.key(["tab"], () => {
      const focused = this.screen.focused;
      if (focused === this.channelsList) this.inputBox.focus();
      else if (focused === this.inputBox) this.membersBox.focus();
      else this.channelsList.focus();
    });

    state.on("channelChanged", (channelName) => {
      this.messagesBox.setLabel(` Channel: ${channelName} `);
      this.screen.render();
    });
  }

  formatMessage(m) {
    let timeStr = "";
    if (m.published) {
      try {
        timeStr = `[${new Date(m.published).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}] `;
      } catch (e) {}
    }

    let author = m.author_id || "Unknown";
    if (author.includes("@")) {
      author = author.split("@")[0];
    }

    let content = m.content || "";
    // Заменяем переносы строк на пробел, чтобы не ломать layout лога
    content = content.replace(/\n/g, " ");

    return `{grey-fg}${timeStr}{/}{bold}{green-fg}${author}{/}{/}: ${content}`;
  }

  renderSingleMessage(m) {
    this.messagesBox.add(this.formatMessage(m));
  }

  renderMessages(messages) {
    this.messagesBox.setContent("");
    messages.forEach((m) => this.renderSingleMessage(m));
    this.screen.render();
  }
}

module.exports = ChatUI;