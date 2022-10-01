const moment = require('moment');
const EventEmitter = require('events');
const { v4: uuid } = require('uuid');
const { lastIndexOf } = require('lodash');
const { getCandleSessions, getCandleLatestSession } = require('services/time');

class Candle extends EventEmitter {
    constructor(instrument, candle = {}) {
        super();

        this.id = candle.id || uuid();
        this.instrument = instrument;
        this.type = 'CANDLE';
        this.high = candle.high || candle.mid.h;
        this.low = candle.low || candle.mid.l;
        this.open = candle.open || candle.mid.o;
        this.close = candle.close || candle.mid.c;
        this.volume = candle.volume;
        this.timestamp = new Date(candle.time || candle.timestamp).getTime();
        this.green = (this.close > this.open);
        this.red = (this.close < this.open);
        this.engulfing = false;
        this.sessions = getCandleSessions({timestamp: this.timestamp});
        this.latestSession = getCandleLatestSession({timestamp: this.timestamp});

        this.register();
        // this.getSessionNames();
    }

    register() {
        return fxtdr.bus.registerObject(this);
    }

    getSessionNames() {
        // TODO: REMOVE THIS REPEAT CODE
        const isDST = moment().isDST();
        const day = moment(this.timestamp).startOf('day');
        const time = moment(this.timestamp);
        

        const sydneyStart = moment(day).add((isDST ? 17 : 15), 'hours').subtract(1, 'minute');
        const sydneyEnd = moment(day).add((isDST ? 2 : 0), 'hours');
        const tokyoStart = moment(day).add((isDST ? 18 : 17), 'hours').subtract(1, 'minute');
        const tokyoEnd = moment(day).add((isDST ? 3 : 2), 'hours');
        const londonStart = moment(day).add(1, 'hours').add(59, 'minutes');
        const londonEnd = moment(day).add(11, 'hours')
        const usStart = moment(day).add(7, 'hours').add(59, 'minutes');
        const usEnd = moment(day).add(16, 'hours');


        if (time.isBetween(londonEnd, sydneyStart)) return this.sessions.push('us');
        if (time.isBetween(tokyoEnd, usStart)) return this.sessions.push('london');
        if (time.isBetween(tokyoStart, sydneyEnd)) return this.sessions.push('tokyo');
        if (time.isBetween(usEnd, tokyoStart)) return this.sessions.push('sydney');

        if (!this.sessions.length) {
            // this.sessions.push('us');
            console.log(time.toLocaleString(), usEnd.toLocaleString(), tokyoStart.toLocaleString())
            console.log(usEnd.toLocaleString(), time.toLocaleString(), time.isBetween(usEnd, tokyoStart), time.isBetween(sydneyEnd, londonStart), time.isBetween(tokyoEnd, usStart), time.isBetween(londonEnd, sydneyStart))
            // console.log(moment(time).toLocaleString(), this)
        }
    }

    getLatestSession() {
        const sessions = this.sessions;
        return sessions.reverse()[0]
    }
}


module.exports = Candle;