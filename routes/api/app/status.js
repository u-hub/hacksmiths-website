var keystone = require('keystone'),
	async = require('async'),
	_ = require('underscore'),
	moment = require('moment'),
	crypto = require('crypto');

exports = module.exports = function(req, res) {

	var data = { events: {}, scheduleItems: {}, rsvp: {} };

	async.series([
		function(next) {
			if (!req.body.user) return next();
			keystone.list('User').model.findById(req.body.user).exec(function(err, user) {
				if (err || !user) return next();
				data.user = user;
				return next();
			});
		},
		function(next) {
			keystone.list('Event').model.findOne()
				.where('state', 'past')
				.sort('-eventStartDate')
				.exec(function(err, event) {
					data.events.last = event ? event.toJSON() : false;
					return next();
				});
		},
		function(next) {
			keystone.list('Event').model.findOne()
				.where('state', 'active')
				.sort('-eventStartDate')
				.exec(function(err, event) {
					data.events.next = event ? event.toJSON() : false;
					return next();
				});
		},
		function(next) {
			if (!data.events.last) return next();
			keystone.list('Talk').model.find()
				.where('event', data.events.last)
				.populate('who')
				.sort('sortOrder')
				.exec(function(err, scheduleItems) {
					data.scheduleItems.last = scheduleItems && scheduleItems.length ? scheduleItems.map(function(i) {
						return i.toJSON();
					}) : false;
					return next();
				});
		},
		function(next) {
			if (!data.events.next) return next();
			keystone.list('Talk').model.find()
				.where('event', data.events.next)
				.populate('who')
				.sort('sortOrder')
				.exec(function(err, scheduleItems) {
					data.scheduleItems.next = scheduleItems && scheduleItems.length ? scheduleItems.map(function(i) {
						return i.toJSON();
					}) : false;
					return next();
				});
		},
		function(next) {
			if (!req.body.user) return next();
			if (!data.events.next) return next();
			keystone.list('RSVP').model.findOne()
				.where('who', data.user)
				.where('event', data.events.next)
				.exec(function(err, rsvp) {
					data.rsvp = rsvp;
					return next();
				});
		}
	], function(err) {

		var response = {
			success: true,
			config: {
				versions: {
					compatibility: process.env.APP_COMPATIBILITY_VERSION,
					production: process.env.APP_PRODUCTION_VERSION
				},
				killSwitch: false
			},
			events: {
				last: false,
				next: false
			},
			rsvp: {
				responded: false,
				attending: false
			},
			user: false
		}

		var parseEvent = function(event, current) {
			var eventData = {
				id: event._id,

				name: event.name,

				starts: event.eventStartDate,
				ends: event.eventEndDate,

				place: event.place,
				map: event.map,

				description: keystone.utils.cropString(keystone.utils.htmlToText(event.description), 250, '...', true),

				ticketsAvailable: event.rsvpsAvailable,
				ticketsRemaining: event.remainingRSVPs,

				scheduleItems: current ? data.scheduleItems.next : data.scheduleItems.last
			}
			eventData.hash = crypto.createHash('md5').update(JSON.stringify(eventData)).digest('hex');
			return eventData;
		}

		if (data.events.last) {
			response.events.last = parseEvent(data.events.last);
		}

		if (data.events.next && moment().isBefore(data.events.next.eventEndDate)) {
			response.events.next = parseEvent(data.events.next, true);
			if (data.user) {
				response.rsvp.responded = data.rsvp ? true : false;
				response.rsvp.attending = data.rsvp && data.rsvp.attending ? true : false;
				response.rsvp.date = data.rsvp ? data.rsvp.changedAt : false;
			}
		}

		if (data.user) {
			response.user = {
				date: new Date().getTime(),
				userId: data.user.id,
				name: {
					first: data.user.name.first,
					last: data.user.name.last,
					full: data.user.name.full
				},
				email: data.user.email,
				avatar: data.user.avatarUrl
			};
		}

		res.apiResponse(response);

	});
};
