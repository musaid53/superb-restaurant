const logger = require('koa-logger');
const router = require('@koa/router')();
const koaBody = require('koa-body');
const mongoose = require("mongoose");
const Koa = require('koa');
const app = module.exports = new Koa();
require('./table.model');
require('./reservation.model');
require('./configs.model');
const url = process.env.MONGO_URL || "mongodb://localhost:27017/tables"
const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const Table = mongoose.model('tables');
const Reservation = mongoose.model('reservations');
const Configs = mongoose.model('configs');
app.use(logger());
app.use(koaBody());

Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + (h * 60 * 60 * 1000));
  return this;
}

Date.prototype.getWeekDay = function () {
  return weekdays[this.getDay()];
}

mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connection established ");
  })
  .catch((err) => {
    console.log("Connection failed");
    console.log(err);
  });


// route definitions

router.get('/', health)
  .post('/create-table', createTable)
  .delete('/delete-all-tables', deleteAllTables)
  .get('/list-tables', listTables)
  .post('/reserve', validateMakeReservation)
  .post('/work-hours', setWorkHours)
  //.post('/validate', validate)
  .get('/list-all-reservations', listAllReservations)
  ;



app.use(router.routes());

/**
 * health.
 */

async function health(ctx) {
  ctx.body = 'Up';
}

/**
 * Create a table.
 */

async function createTable(ctx) {

  const table = new Table(ctx.request.body);

  await table.save()
    .then((data) => {
      if (data) {
        ctx.body = tableMapper(data);
        console.log("table created")
      } else {
        console.log("table not  created")
        ctx.body = {
          message: 'Table creation failed.'
        };
      }
    })
    .catch((err) => errHandler(err, ctx, 406));
}

/**
 * delete all tables.
 */

async function deleteAllTables(ctx) {
  await Table.deleteMany({}, () => {
    ctx.body = {
      message: 'All tables deleted'
    };
  })
    .catch((err) => errHandler(err, ctx, 401));
}

/**
 * List all tables.
 */

async function listTables(ctx) {
  await Table.find()
    .then((tables) => {

      ctx.body = tables.map(it => {
        return {
          id: it.id,
          description: it.description || 'No desc'
        }
      });


    })
    .catch((err) => errHandler(err, ctx, 404));
}


/**
 * Create a reservation
 */

async function makeReservation(ctx) {

  await Table.findById(ctx.request.body.tableId)
    .then((table) => {
      if (table) {
        let reservationReq = {
          tableId: ctx.request.body.tableId,
          peopleCount: ctx.request.body.peopleCount,
          startDate: ctx.request.body.startDate,
          endDate: ctx.request.body.endDate || new Date(ctx.request.body.startDate).addHours(1)
        }
        const reservation = new Reservation(reservationReq);
        return reservation.save().then(savedReservation => {
          ctx.body = savedReservation;
        });
      } else {
        console.log("table not  found")
        ctx.body = {
          message: 'Table not found'
        };
      }

    })
    .catch((err) => errHandler(err, ctx, 404));
}

/**
 * list reservations
 */

async function listAllReservations(ctx) {
  await Reservation.find()
    .then((reservations) => {
      ctx.body = reservations;

    })
    .catch((err) => errHandler(err, ctx, 404));
}

/**
 * Set Work Hours
 */

async function setWorkHours(ctx) {

  let dayFromReq = ctx.request.body.day || Date.now().getWeekDay();
  //console.log(weekdays.some(day => day === dayFromReq));
  if (!weekdays.some(day => day === dayFromReq)) {
    ctx.status = 400;
    ctx.body = {
      message: 'day is invalid'
    };
    return false;
  }
  await Configs.find({ day: dayFromReq })
    .then((configs) => {
      let timezone = ctx.request.body.timezone || 0;
      if (configs.length > 1) {
        ctx.status = 401;
        return 'Duplicate conf found!';
      } else if (configs.length == 1) {
        configs[0].starTime = ctx.request.body.startTime;
        configs[0].endTime = ctx.request.body.endTime;
        configs[0].starTime.hour += timezone;
        configs[0].endTime.hour += timezone;
        return configs[0].save();
      } else {
        const newConfig = new Configs({
          starTime: ctx.request.body.startTime,
          endTime: ctx.request.body.endTime,
          day: dayFromReq,
          timezone: timezone
        });
        newConfig.starTime.hour += timezone;
        newConfig.endTime.hour += timezone;
        return newConfig.save();
      }
    })
    .then((savedConfigs) => {
      console.log('configs saved!');
      ctx.body = savedConfigs;
    })
    .catch((err) => errHandler(err, ctx, 404));

}



async function validateMakeReservation(ctx) {
  let startDate = new Date(ctx.request.body.startDate);
  let endDate = new Date(startDate).addHours(1);
  /*
  if (startDate < Date.now()) {

    let err = {
      message: 'Date must be after from now!'
    };
    errHandler(err, ctx, 400);
    return false;
  }
  */
  let dayFromReq = startDate.getWeekDay();
  await Configs.find({ day: dayFromReq })
    .then((configs) => {
      if (configs.length != 1) {
        throw new Error('Check working hours')
      } else {
        return configs[0];
      }
    })
    .then((workHour) => {

      let workStartDate = new Date(startDate);
      workStartDate.setHours(workHour.starTime.hour);
      workStartDate.setMinutes(workHour.starTime.minute);

      let workEndDate = new Date(endDate);
      workEndDate.setHours(workHour.endTime.hour);
      workEndDate.setMinutes(workHour.endTime.minute);

      if (!(startDate >= workStartDate && endDate <= workEndDate)) {
        throw new Error('Reservation time must be between working hours')
      }

    })
    .then(() => Reservation.find({ tableId: ctx.request.body.tableId })
      .then((reservations) => {

        return !reservations.some(reservation => validateInterval(startDate, endDate, reservation));
      }))
    .then((isValid) => {
      
      if(isValid){
        return makeReservation(ctx);
      }else{
        ctx.status = 400;
        ctx.body = {
          message: 'The reservation time is not available'
        };
      }
    })  
    .catch((err) => errHandler(err, ctx, 404));
}

function validateInterval(startDate, endDate, reservation) {
  // returns false if not valid
  let start = new Date(startDate);
  let end = new Date(endDate)
  //not startDate between rsvStart and rsvEnd
  if (start >= reservation.startDate && start < reservation.endDate) {
    console.log('reservation.startDate: %s , reservation.endDate:%s', reservation.startDate, reservation.endDate);
    console.log('not startDate between rsvStart and rsvEnd');
    return true;
  }
  //not endDate between rsvStart and rsvEnd
  if (end > reservation.startDate && end <= reservation.endDate) {
    console.log('reservation.startDate: %s , reservation.endDate:%s', reservation.startDate, reservation.endDate);
    console.log('not endDate between rsvStart and rsvEnd');
    return true;
  }

  //not  rsvStart >= startDate & rsvEnd <= endDate
  if (reservation.startDate >= start && reservation.endDate <= end) {
    console.log('reservation.startDate: %s , reservation.endDate:%s', reservation.startDate, reservation.endDate);
    console.log('not  rsvStart >= startDate & rsvEnd <= endDate');
    return true;
  }

  return false;

}

function errHandler(err, ctx, errStatus) {
  console.log('error catch: %s', err);
  ctx.status = errStatus || err.statusCode || err.status || 500;
  ctx.body = {
    message: err.message
  };
}

function tableMapper(table) {
  return {
    description: table.description,
    id: table._id
  }
}


app.listen(3000);