var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Post Categories Model
 * =====================
 */

var Team = new keystone.List('Team', {
	track: true,
	autokey: {
		from: 'title',
		path: 'key',
		unique: true
	},
	map: {
		name: 'title'
	}
});

Team.add({
	title: {
		type: String,
		required: true,
		initial: true,
		unique: true,
		note: 'Create a cool team name.  Pick something unique to you!'
	},
	avatar: {
		type: Types.CloudinaryImage,
		autoCleanup: true,
		select: true,
		publicID: 'slug'
	},
	website: Types.Url,
	description: {
		type: Types.Markdown
	},
	leaders: {
		type: Types.Relationship,
		ref: 'User',
		many: true,
		required: true,
		initial: true
	},
	location: Types.Location,
	spotlight: {
		type: Types.Boolean,
		default: false
	},
	roles: {
		type: Types.Relationship,
		ref: 'Role',
		many: true
	},
	members: {
		type: Types.Relationship,
		ref: 'User',
		many: true
	},
	projects: {
		type: Types.Relationship,
		ref: 'Project',
		many: true,
		noedit: true
	},
	stats: {
		type: Types.Relationship,
		ref: 'TeamStats',
		many: false,
		noedit: true
	}
});

Team.relationship({
	ref: 'TeamStats',
	refPath: 'team',
	path: 'stats'
});
Team.relationship({
	ref: 'User',
	refPath: 'teams',
	path: 'members'
});
Team.relationship({
	ref: 'Project',
	refPath: 'teams',
	path: 'projects'
});
Team.relationship({
	ref: 'Role',
	refPath: 'team',
	path: 'roles'
});

// Pull out avatar image thumbnail
Team.schema.virtual('avatarUrl').get(function() {
	if (this.logo.exists) return this._.logo.thumbnail(120, 120);
});


Team.defaultColumns = 'title, roles, leaders';
Team.register();
