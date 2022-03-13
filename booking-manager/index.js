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

const Table = mongoose.model('tables');
const Reservation = mongoose.model('reservations');
const Configs = mongoose.model('configs');
app.use(logger());
app.use(koaBody());

Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + (h * 60 * 60 * 1000));
  return this;
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
  .post('/reserve', makeReservation)
  .post('/work-hours', setWorkHours)
  .post('/validate', validate)
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
        console.log("table found");
        ctx.request.body.endDate = ctx.request.body.endDate || new Date(ctx.request.body.startDate).addHours(1);
        const reservation = new Reservation(ctx.request.body);
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

  await Configs.findOne()
    .then((configs) => {
      if (configs) {
        console.log('config found');
        configs.entries.set('open', ctx.request.body.open);
        configs.entries.set('close', ctx.request.body.close);
        return configs.save();
      } else {
        console.log('config not found');
        const newConfigs = new Configs({
          entries: {}
        });
        newConfigs.entries.set('open', ctx.request.body.open);
        newConfigs.entries.set('close', ctx.request.body.close);
        return newConfigs.save();
      }
    })
    .then((savedConfigs) => {
      console.log('configs saved!');
      ctx.body = savedConfigs.entries;
    })
    .catch((err) => errHandler(err, ctx, 404));

}



async function validate(ctx) {
  // todo sort
  await Reservation.find({ tableId: ctx.request.body.tableId, })
    .then((reservations) => {

      let fileted = !reservations.some(reservation => validateInterval(ctx.request.body.startDate, ctx.request.body.endDate, reservation));
      ctx.body = fileted;
    })
}

function validateInterval(startDate, endDate, reservation) {
  let start = new Date(startDate);
  let end = new Date(endDate)
  //not startDate between rsvStart and rsvEnd
  if ( start >= reservation.startDate && start < reservation.endDate) {
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