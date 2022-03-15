require('../models/reservation.model');
const dbConnection = require('./DbConnection');
const mongoose = require("mongoose");
const Reservation = mongoose.model('reservations');
const TableService = require('./TableService');
const ConfigService = require('./ConfigService');


class ReservationService {

    constructor() {
        this.db = dbConnection;
        this.model = Reservation;
    }

    async listAllReservations() {
        return await Reservation.find();
    }

    async deleteReservationById(id) {
        return await Reservation.deleteOne({id : id})
    }

    async makeReservation(ctx) {

        return await TableService.findById(ctx.request.body.tableId)
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

            });
    }

    async validateMakeReservation(ctx) {
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
        return await ConfigService.findByDay(dayFromReq)
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

                if (isValid) {
                    return this.makeReservation(ctx);
                } else {
                    ctx.status = 400;
                    ctx.body = {
                        message: 'The reservation time is not available'
                    };
                }
            });

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
    }



};

module.exports = new ReservationService();