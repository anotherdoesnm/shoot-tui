const EventEmitter = require("events");

class AppState extends EventEmitter {
  constructor() {
    super();
    this.channels = [];
    this.activeChannel = null;
    this.activeChannelName = null;
    this.unread = new Map();
  }

  setActiveChannel(channelId, channelName) {
    this.activeChannel = channelId;
    this.activeChannelName = channelName || channelId;
    this.unread.set(channelId, 0);
    this.emit("channelChanged", this.activeChannelName);
  }

  addUnread(channelId) {
    if (this.activeChannel === channelId) return;
    const count = (this.unread.get(channelId) || 0) + 1;
    this.unread.set(channelId, count);
    this.emit("unreadUpdated", channelId, count);
  }
}

module.exports = new AppState();