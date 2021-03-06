const logger = require('koa-logger');
const router = require('@koa/router')();
const koaBody = require('koa-body');
const Koa = require('koa');
const app = module.exports = new Koa();
require("dotenv").config();


const TableService = require('./service/TableService');
const ConfigService = require('./service/ConfigService');
const ReservationService = require('./service/ReservationService');

app.use(logger());
app.use(koaBody());



// route definitions

router.get('/', health)
  .post('/create-table', createTable)
  .delete('/delete-all', deleteAll)
  .get('/list-tables', listTables)
  .post('/reserve', validateMakeReservation)
  .post('/work-hours', setWorkHours)
  //.post('/validate', validate)
  .get('/list-all-reservations', listAllReservations)
  .get('/reservation-by-table/:tableId', listAllReservations)
  .delete('/reservation/:reservationId', deleteReservationById)
  .delete('/delete-table/:tableId', deleteTableById)
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

  await TableService.create(ctx.request.body)
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
 * Delete a table.
 */

async function deleteTableById(ctx) {
  let tableId = ctx.params.tableId;
  await TableService.deleteById(tableId)
    .then((data) => {
      if (data.deletedCount == 0) {
        return data
      } else {
        return ReservationService.deleteReservationByTableId(tableId)
          .then(() => data);
      }
    })
    .then((res) => {
      let message;
      if (res.deletedCount == 0) {
        message = 'Not Found!';
        ctx.status = 400;
      } else {
        message = 'Deleted!';
      }
      ctx.body = {
        message: message
      };
    })
    .catch((err) => errHandler(err, ctx, 406));
}

/**
 * delete all tables.
 */

async function deleteAll(ctx) {
  await ReservationService.deleteAll()
    .then(() => TableService.deleteAll())
    .then(() => ConfigService.deleteAll())
    .then(() => {
      ctx.body = {
        message: 'All documents deleted'
      }
    })
    .catch((err) => errHandler(err, ctx, 401));
}

/**
 * List all tables.
 */

async function listTables(ctx) {
  await TableService.listAll()
    .then((tables) => {
      console.log(process.env.MONGO_URL);
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

  return ReservationService.makeReservation(ctx)
    .catch((err) => errHandler(err, ctx, 404));
}

/**
 * list reservations
 */

async function listAllReservations(ctx) {
  let tableId = ctx.params.tableId;
  await ReservationService.listAllReservations(tableId)
    .then((reservations) => {
      ctx.body = reservations;

    })
    .catch((err) => errHandler(err, ctx, 404));
}

/**
 * Set Work Hours
 */

async function setWorkHours(ctx) {

  return await ConfigService.setWorkHours(ctx)
    .then((savedConfigs) => {
      ctx.body = savedConfigs;
    })
    .catch((err) => errHandler(err, ctx, 404));

}


/**
 * Validate and make reservation
 */
async function validateMakeReservation(ctx) {
  return await ReservationService.validateMakeReservation(ctx)
    .catch((err) => errHandler(err, ctx, 404));
}

/**
 * Delete a reservation 
 */
async function deleteReservationById(ctx) {
  let id = ctx.params.reservationId;
  return await ReservationService.deleteReservationById(id)
    .then((res) => {
      let message;
      if (res.deletedCount == 0) {
        message = 'Not Deleted!';
        ctx.status = 400;
      } else {
        message = 'Deleted!';
      }
      ctx.body = {
        message: message
      };
    })
    .catch((err) => errHandler(err, ctx, 404));
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