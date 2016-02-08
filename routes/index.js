/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

var keystone = require('keystone');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);
var graphqlHTTP = require('express-graphql');
var graphQLSchema = require('../graphql/schema');
var IP = process.env.IP || '192.168.33.10';
var subdomain = require('subdomain');
var REST = require('restful-keystone')(keystone);

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);
keystone.pre('routes', middleware.initErrorHandlers);

// Import Route Controllers
var routes = {
	api: importRoutes('./api'),
	views: importRoutes('./views'),
	auth: importRoutes('./auth')
};

// Setup Route Bindings
exports = module.exports = function(app) {

		// GraphQL
	app.use('/api/graphql', graphqlHTTP({ schema: graphQLSchema, graphiql: true }));

	app.use(subdomain({ base: IP, removeWWW: true}));

	// Allow cross-domain requests (development only)
	if (process.env.NODE_ENV !== 'production') {
		console.log('------------------------------------------------');
		console.log('Notice: Enabling CORS for development.');
		console.log('------------------------------------------------');
		app.all('*', function (req, res, next) {
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Methods', 'GET, POST');
			res.header('Access-Control-Allow-Headers', 'Content-Type');
			next();
		});
	}

	// Views
	app.get('/', routes.views.index);
	app.get('/blog/:category?', routes.views.blog);
	app.get('/blog/post/:post', routes.views.post);
	app.get('/gallery', routes.views.gallery);
	app.all('/contact', routes.views.contact);

		// Website
	app.get('/', routes.views.index);
	app.get('/events', routes.views.events);
	app.get('/events/:event', routes.views.event);
	app.get('/members', routes.views.members);
	app.get('/members/mentors', routes.views.mentors);
	app.get('/member/:member', routes.views.member);
	app.get('/organizations', routes.views.organizations);
	app.get('/links', routes.views.links);
	app.get('/links/:tag?', routes.views.links);
	app.all('/links/link/:link', routes.views.link);
	app.get('/blog/:category?', routes.views.blog);
	app.all('/blog/post/:post', routes.views.post);
	app.get('/about', routes.views.about);
	app.get('/mentoring', routes.views.mentoring);
	app.get('/privacy', routes.views.privacy);
	app.get('/teams', routes.views.teams);

		// API
	app.all('/api*', keystone.middleware.api);
	app.all('/api/me/event', routes.api.me.event);

	//app.all('/api/me/project', routes.api.me.projects);
	app.all('/api/app/');
	app.all('/api/stats', routes.api.stats);
	app.all('/api/event/:id', routes.api.event);

	// API - App
	app.all('/api/app/status', routes.api.app.status);
	app.all('/api/app/rsvp', routes.api.app.rsvp);
	app.all('/api/app/signin-email', routes.api.app['signin-email']);
	app.all('/api/app/signup-email', routes.api.app['signup-email']);
	app.all('/api/app/signin-service', routes.api.app['signin-service']);
	app.all('/api/app/signin-service-check', routes.api.app['signin-service-check']);
	app.all('/api/app/signin-recover', routes.api.app['signin-recover']);

	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);

};
