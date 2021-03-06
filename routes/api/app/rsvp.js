var async = require('async'),
	keystone = require('keystone'),
	RSVP = keystone.list('RSVP'),
	User = keystone.list('User');

exports = module.exports = function(req, res) {

	User.model.findById(req.body.user).exec(function(err, user) {
		if (err || !user) return res.apiResponse({ success: false });
		RSVP.model.findOne()
			.where('who', user)
			.where('event', req.body.event)
			.exec(function(err, rsvp) {

				if (rsvp) {

					if (req.body.participating == 'false' && req.body.cancel == 'true') {
						console.log('[api.app.rsvp] - Existing RSVP found, deleting...');
						rsvp.remove(function(err) {
							if (err) return res.apiResponse({ success: false, err: err });
							console.log('[api.app.rsvp] - Deleted RSVP.');
							return res.apiResponse({ success: true });
						});
					} else {
						console.log('[api.app.rsvp] - Existing RSVP found, updating...');
						rsvp.set({
							participating: req.body.participating == 'true',
							changedAt: req.body.changed
						}).save(function(err) {
							if (err) return res.apiResponse({ success: false, err: err });
							console.log('[api.app.rsvp] - Updated RSVP.');
							return res.apiResponse({ success: true });
						});
					}

				} else {

					console.log('[api.app.rsvp] - No RSVP found, creating...');

					new RSVP.model({
						event: req.body.event,
						who: user,
						participating: req.body.participating == 'true',
						changedAt: req.body.changed
					}).save(function(err) {
						if (err) return res.apiResponse({ success: false, err: err });
						console.log('[api.app.rsvp] - Created RSVP.');
						return res.apiResponse({ success: true });
					});

				}

			});
	});

}
