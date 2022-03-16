const conn = require('./booking-manager/service/DbConnection');
require('should');
const app = require('./booking-manager/index');
const server = app.listen();
const request = require('supertest').agent(server);
const mongoose = require("mongoose");



describe('Blog', function () {
    before(async function () {
        console.log('deleting all tables');
        //await request.delete('/delete-all');
        await conn.then((connection) => {
            connection.connection.db.dropDatabase(function(err, result){
                console.log('db deleted');
            });
        });
    });

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
                    res.body.should.have.property('id').equal(1);
                    done();
                });
        });
    });
    describe('POST /create-table', function () {
        it('should create a table with corrent id', function () {
            request
                .post('/create-table')
                .send({ description: "second table" })
                .end(function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('description').equal('second table');
                    res.body.should.have.property('id').equal(2);
                    request
                        .get('/list-tables')
                        .expect(200, function (err, res) {
                            if (err) return done(err);
                            res.body.should.have.lengthOf(2);
                            done();
                        });
                });


        });
    });

});