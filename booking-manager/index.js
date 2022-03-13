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
 * Create a reservation to table
 */

async function makeReservation(ctx) {
  await Table.findById(ctx.request.body.tableId)
    .then((table) => {
      if (table) {
        console.log("table found");
        ctx.request.body.endDate = ctx.request.body.endDate || Date.now();
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
          entries:{} 
        });
        newConfigs.entries.set('open', ctx.request.body.open);
        newConfigs.entries.set('close', ctx.request.body.close);
        return newConfigs.save();
      }
    }) 
    .then((savedConfigs)=> {
      console.log('configs saved!');
      ctx.body = savedConfigs.entries;
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