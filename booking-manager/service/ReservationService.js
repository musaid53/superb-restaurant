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

    async deleteAll(){
        return await Reservation.deleteMany({});
    }
    async listAllReservations(tableId) {
        if(tableId){
            return await Reservation.find({tableId: tableId});
        }
        return await Reservation.find();
        
    }

    async deleteReservationById(id) {
        let objId = mongoose.Types.ObjectId(id.trim()); 
        return await Reservation.deleteOne({ _id: objId })
    }
    async deleteReservationByTableId(id) {
        return await Reservation.deleteMany({ tableId: id })
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
                    if (ctx.request.body.reservationId) {
                        let query = { _id: ctx.request.body.reservationId };
                        return Reservation.findOneAndUpdate(query, reservationReq, { upsert: true, new: true }).then(savedReservation => {
                            ctx.body = savedReservation;
                        });
                    } else {
                        let reservation = new Reservation(reservationReq);
                        return reservation.save().then(savedReservation => {
                            ctx.body = savedReservation;
                        });
                    }

                } else {
                    console.log("table not  found")
                    ctx.body = {
                        message: 'Table not found'
                    };
                    ctx.status = 404;
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
                workStartDate.setHours(workHour.startTime.hour);
                workStartDate.setMinutes(workHour.startTime.minute);

                let workEndDate = new Date(endDate);
                workEndDate.setHours(workHour.endTime.hour);
                workEndDate.setMinutes(workHour.endTime.minute);

                if (!(startDate >= workStartDate && endDate <= workEndDate)) {
                    throw new Error('Reservation time must be between working hours')
                }

            })
            .then(() => Reservation.find({ tableId: ctx.request.body.tableId })
                .then((reservations) => {
                    reservations = ctx.request.body.reservationId ? reservations.filter(it => it.id != ctx.request.body.reservationId) : reservations;
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