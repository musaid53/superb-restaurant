global.weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

Date.prototype.getWeekDay = function () {
    return weekdays[this.getDay()];
}