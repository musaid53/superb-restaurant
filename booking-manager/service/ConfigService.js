require('../models/configs.model');
require('../utils');
const mongoose = require("mongoose");
const Configs = mongoose.model('configs');
const dbConnection = require('./DbConnection');

class ConfigService {

    constructor() {
        this.db = dbConnection;
        this.model = Configs;
    }

    async create(request) {
        return await new Configs(request).save();
    }
    async findByDay(day) {
        return await Configs.find({ day: day })
    }
    async deleteAll(){
        return await Configs.deleteMany({});
    }

    async setWorkHours(ctx) {
        let dayFromReq = ctx.request.body.day || Date.now().getWeekDay();
        //console.log(weekdays.some(day => day === dayFromReq));
        if (!weekdays.some(day => day === dayFromReq)) {
            ctx.status = 400;
            ctx.body = {
                message: 'day is invalid'
            };
            return false;
        }
        return await this.findByDay(dayFromReq)
            .then((configs) => {
                let timezone = ctx.request.body.timezone || 0;
                if (configs.length > 1) {
                    ctx.status = 401;
                    return 'Duplicate conf found!';
                } else if (configs.length == 1) {
                    configs[0].startTime = ctx.request.body.startTime;
                    configs[0].endTime = ctx.request.body.endTime;
                    configs[0].startTime.hour += timezone;
                    configs[0].endTime.hour += timezone;
                    return configs[0].save();
                } else {
                    const newConfig = new Configs({
                        startTime: ctx.request.body.startTime,
                        endTime: ctx.request.body.endTime,
                        day: dayFromReq,
                        timezone: timezone
                    });
                    newConfig.startTime.hour += timezone;
                    newConfig.endTime.hour += timezone;
                    return newConfig.save();
                }
            });

    }

};
module.exports = new ConfigService();
