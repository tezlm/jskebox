function Event() {
  this.listeners = [];
  this.addListener = function (func) {
    this.listeners.push(func);
  };
  this.removeListener = function (func) {
    this.listeners = this.listeners.filter((i) => i !== func);
  };
  this.fire = function (value) {
    this.listeners.forEach((i) => i(value));
  };
}

module.exports = Event;
