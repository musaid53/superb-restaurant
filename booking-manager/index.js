const logger = require('koa-logger');
const router = require('@koa/router')();
const koaBody = require('koa-body');

const Koa = require('koa');
const app = new Koa();
require("./table.model");
process.env

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
  .catch(() => {
    console.log("Connection failed");
  });


// route definitions

router.get('/', health)
    .post('/create-table', createTable)
    .get('/list-table', listTables);


app.use(router.routes());

/**
 * health.
 */

async function health(ctx) {
    ctx.body = 'Up';;
}

/**
 * Create a table.
 */

 async function createTable(ctx) {
    const post = ctx.request.body;
    const id = posts.push(post) - 1;
    post.created_at = new Date();
    post.id = id;
    ctx.redirect('/');
  }





// app.use(async ctx => {
//     ctx.body = 'Up';
// });

app.listen(3000);