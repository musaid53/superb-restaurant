const log = require('why-is-node-running')
require('should');
const app = require('./booking-manager/index');
const server = app.listen();
const request = require('supertest').agent(server);


describe('Blog', function () {
    // before(function() {
    //     console.log('deleting all tables');
    //     request.delete('/delete-all')
    // });

    after(function () {
        console.log('closing');
        server.close();
    });

    describe('GET /list-tables', function () {
        it('should see no tables "', function (done) {
            request
                .get('/list-tables')
                .expect(200, function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.lengthOf(0);
                    done();
                });
        });
    });

    describe('POST /create-table', function () {
        it('should create a table', function (done) {
            request
                .post('/create-table')
                .send({ description: "first table" })
                .end(function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('description').equal('first table');
                    done();
                });
        });
    });
});

setTimeout(function () {
    log() // logs out active handles that are keeping node running
  }, 100)