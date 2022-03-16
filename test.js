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
            connection.connection.db.dropDatabase(function (err, result) {
                console.log('db deleted');
            });
        });
    });

    after(function () {
        console.log('closing');
        server.close();
    });

    describe('List tables', function () {
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

    describe('Create Table', function () {
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
    describe('Create  table and get all', function () {
        it('should create a table with corrent id, and list correctly', function (done) {
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
    describe('POST Make Reservation without work hours', function () {
        it('should give error to control working hours', function (done) {
            request
                .post('/reserve')
                .send({
                    "tableId": 1,
                    "peopleCount": 3,
                    "startDate": "2022-03-14T14:00:00.000Z"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('message').which.equal('Check working hours');
                    res.status.should.equal(404);
                    done();
                });


        });
    });

    describe('Set Up tuesdays(!)  work hours', function () {
        it('should give error', function (done) {
            request
                .post('/work-hours')
                .send({
                    "day": "tuesdays",
                    "startTime": { "hour": 9, "minute": 0 },
                    "endTime": { "hour": 18, "minute": 0 },
                    "timezone": 3
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('message').which.equal('day is invalid');
                    res.status.should.equal(404);
                    done();
                });


        });
    });

    describe('Set Up tuesday work hours', function () {
        it('should set up work hours', function (done) {
            request
                .post('/work-hours')
                .send({
                    "day": "tuesday",
                    "startTime": { "hour": 9, "minute": 0 },
                    "endTime": { "hour": 18, "minute": 0 },
                    "timezone": 3
                })
                .end(function (err, res) {
                    if (err) return done(err);

                    res.body.should.have.property('day').which.equal('tuesday');
                    res.body.should.have.property('startTime');
                    res.body.should.have.property('endTime');
                    res.body.startTime.should.have.property('hour').which.equal(12);
                    res.body.startTime.should.have.property('minute').which.equal(0);
                    res.body.endTime.should.have.property('hour').which.equal(21);
                    res.body.endTime.should.have.property('minute').which.equal(0);
                    done();
                });


        });
    });

});