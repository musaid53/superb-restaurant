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
                        .expect(200, function (err, res2) {
                            if (err) return done(err);
                            res2.body.should.have.lengthOf(2);
                            done();
                        });
                });


        });
    });
    describe('Make Reservation without work hours', function () {
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
    describe('Make Reservation with non-existing table ', function () {
        it('should give an error with table not found', function (done) {
            request
                .post('/reserve')
                .send({
                    "tableId": 123123,
                    "peopleCount": 3,
                    "startDate": "2022-03-15T14:00:00.000Z"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('message').which.equal('Table not found');
                    res.status.should.equal(404);
                    done();
                });


        });
    });

    describe('Make Reservation between working hours ', function () {
        it('should create a reservation', function (done) {
            request
                .post('/reserve')
                // todo: startDate mus be relative
                .send({
                    "tableId": 1,
                    "peopleCount": 3,
                    "startDate": "2022-03-15T14:00:00.000Z"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('peopleCount').which.equal(3);
                    res.body.should.have.property('tableId').which.equal(1);
                    res.body.should.have.property('startDate').which.equal('2022-03-15T14:00:00.000Z');
                    res.body.should.have.property('endDate').which.equal('2022-03-15T15:00:00.000Z');
                    res.status.should.equal(200);
                    done();
                });


        });

    });

    describe('Make Reservation outside of working hours ', function () {
        it('should give an error with Reservation time must be between working hours', function (done) {
            request
                .post('/reserve')
                // todo: startDate mus be relative
                .send({
                    "tableId": 1,
                    "peopleCount": 3,
                    "startDate": "2022-03-15T06:00:00.000Z"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('message').which.equal('Reservation time must be between working hours');
                    res.status.should.equal(404);
                    done();
                });


        });
    });

    describe('Make Reservation on same reservation ', function () {
        it('should give an error ', function (done) {
            request
                .post('/reserve')
                // todo: startDate mus be relative
                .send({
                    "tableId": 1,
                    "peopleCount": 3,
                    "startDate": "2022-03-15T14:00:00.000Z"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('message').which.equal('The reservation time is not available');
                    res.status.should.equal(400);
                    done();
                });


        });
    });

    describe('List all reservations ', function () {
        it('Lists all reservation, lengt should equal = 1 ', function (done) {
            request
                .get('/list-all-reservations')
                .expect(200, function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.lengthOf(1);
                    done();
                });


        });
    });

    describe('List all reservations and update the people count ', function () {
        it('Lists all reservation, lengt should equal = 1 ', function (done) {
            request
                .get('/list-all-reservations')
                .expect(200, function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.lengthOf(1);
                    let reservationId = res.body[0]._id;
                    request
                        .post('/reserve')
                        // todo: startDate mus be relative
                        .send({
                            "tableId": 1,
                            "peopleCount": 22,
                            "startDate": "2022-03-15T14:00:00.000Z",
                            "reservationId": reservationId
                        })
                        .end(function (err, res2) {
                            if (err) return done(err);
                            res2.body.should.have.property('peopleCount').which.equal(22);
                            res2.body.should.have.property('tableId').which.equal(1);
                            res2.body.should.have.property('startDate').which.equal('2022-03-15T14:00:00.000Z');
                            res2.body.should.have.property('endDate').which.equal('2022-03-15T15:00:00.000Z');
                            done();
                        });
                });


        });
    });
    describe('List all reservations and update the table ', function () {
        it('Lists all reservation, lengt should equal = 1 ', function (done) {
            request
                .get('/list-all-reservations')
                .expect(200, function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.lengthOf(1);
                    let reservationId = res.body[0]._id;
                    request
                        .post('/reserve')
                        // todo: startDate mus be relative
                        .send({
                            "tableId": 2,
                            "peopleCount": 22,
                            "startDate": "2022-03-15T14:00:00.000Z",
                            "reservationId": reservationId
                        })
                        .end(function (err, res2) {
                            if (err) return done(err);
                            res2.body.should.have.property('peopleCount').which.equal(22);
                            res2.body.should.have.property('tableId').which.equal(2);
                            res2.body.should.have.property('startDate').which.equal('2022-03-15T14:00:00.000Z');
                            res2.body.should.have.property('endDate').which.equal('2022-03-15T15:00:00.000Z');
                            done();
                        });
                });


        });
    });

    describe('List all reservations and update the table ', function () {
        it('should give an error with table not found', function (done) {
            request
                .get('/list-all-reservations')
                .expect(200, function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.lengthOf(1);
                    let reservationId = res.body[0]._id;
                    request
                        .post('/reserve')
                        // todo: startDate mus be relative
                        .send({
                            "tableId": 222,
                            "peopleCount": 22,
                            "startDate": "2022-03-15T14:00:00.000Z",
                            "reservationId": reservationId
                        })
                        .end(function (err, res2) {
                            if (err) return done(err);
                            res2.body.should.have.property('message').which.equal('Table not found');
                            res2.status.should.equal(404);
                            done();
                        });
                });


        });
    });

    describe('List all reservations and update the table ', function () {
        it('should give an error with time is not available', function (done) {
            request
                .get('/list-all-reservations')
                .expect(200, function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.lengthOf(1);
                    let reservationId = res.body[0]._id;
                    request
                        .post('/reserve')
                        // todo: startDate mus be relative
                        .send({
                            "tableId": 222,
                            "peopleCount": 22,
                            "startDate": "2022-03-15T04:00:00.000Z",
                            "reservationId": reservationId
                        })
                        .end(function (err, res2) {
                            if (err) return done(err);
                            res2.body.should.have.property('message').which.equal('Reservation time must be between working hours');
                            res2.status.should.equal(404);
                            done();
                        });
                });


        });
    });

    describe('List all reservations and delete one ', function () {
        it('should give an error with time is not available', function (done) {
            request
                .get('/list-all-reservations')
                .expect(200, function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.lengthOf(1);
                    let reservationId = res.body[0]._id;
                    request
                        .delete('/reservation')
                        // todo: startDate mus be relative
                        .send({
                            "id": reservationId
                        })
                        .end(function (err, res2) {
                            if (err) return done(err);
                            res2.body.should.have.property('message').which.equal('Deleted!');
                            res2.status.should.equal(200);
                            done();
                        });
                });


        });
    });

    describe('DELETE a reservation which doesnt exist ', function () {
        it('should give an error with Not Deleted!', function (done) {
            request
                .delete('/reservation')
                // todo: startDate mus be relative
                .send({
                    "id": "123123123123"
                })
                .end(function (err, res2) {
                    if (err) return done(err);
                    res2.body.should.have.property('message').which.equal('Not Deleted!');
                    res2.status.should.equal(400);
                    done();
                });


        });
    });


    describe('Add 4 reservations, 2 of them are not suitable ', function () {
        it('add 4 reservations, 2 of them should be accepted, others will error', function (done) {
            request
                .post('/reserve')
                .send({
                    "tableId": 1,
                    "peopleCount": 3,
                    "startDate": "2022-03-15T10:00:00.000Z"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    res.body.should.have.property('peopleCount').which.equal(3);
                    res.body.should.have.property('tableId').which.equal(1);
                    res.body.should.have.property('startDate').which.equal('2022-03-15T10:00:00.000Z');
                    res.body.should.have.property('endDate').which.equal('2022-03-15T11:00:00.000Z');

                    request
                        .post('/reserve')
                        .send({
                            "tableId": 1,
                            "peopleCount": 3,
                            "startDate": "2022-03-15T12:00:00.000Z"
                        })
                        .end(function (err, res2) {
                            if (err) return done(err);
                            res2.body.should.have.property('peopleCount').which.equal(3);
                            res2.body.should.have.property('tableId').which.equal(1);
                            res2.body.should.have.property('startDate').which.equal('2022-03-15T12:00:00.000Z');
                            res2.body.should.have.property('endDate').which.equal('2022-03-15T13:00:00.000Z');
                            request
                                .post('/reserve')
                                .send({
                                    "tableId": 1,
                                    "peopleCount": 3,
                                    "startDate": "2022-03-15T11:30:00.000Z"
                                })
                                .end(function (err, res3) {
                                    if (err) return done(err);
                                    res3.body.should.have.property('message').which.equal('The reservation time is not available');
                                    res3.status.should.equal(400);
                                    request
                                        .post('/reserve')
                                        .send({
                                            "tableId": 1,
                                            "peopleCount": 3,
                                            "startDate": "2022-03-15T12:30:00.000Z"
                                        })
                                        .end(function (err, res3) {
                                            if (err) return done(err);
                                            res3.body.should.have.property('message').which.equal('The reservation time is not available');
                                            res3.status.should.equal(400);
                                            done();
                                        });
                                });
                        });

                });


        });
    });



});