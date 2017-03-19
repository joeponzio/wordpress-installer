#!/usr/bin/env node
var AdmZip = require( 'adm-zip' );
var async  = require( 'async' );
var fs     = require( 'fs' );
var git    = require( 'simple-git' );
var https  = require( 'https' );
var ncp    = require( 'ncp' ).ncp;
var os     = require( 'os' );
var prompt = require( 'prompt' );

var config = {};
ncp.limit = 16;

var createSalt = function(){
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|[];:",./<>?`~';
	for( var i = 0; i < 64; i++ ){
		text += possible.charAt( Math.floor( Math.random() * possible.length ) );
	}
	return text;
};

var createWPConfig = function(){
	var wpConfig =	'<?php' + os.EOL +
					'define( \'DB_NAME\',     \'' + config.dbname + '\' );' + os.EOL +
					'define( \'DB_USER\',     \'' + config.dbuser + '\' );' + os.EOL +
					'define( \'DB_PASSWORD\', \'' + config.dbpass + '\' );' + os.EOL +
					'define( \'DB_HOST\',     \'localhost\' );' + os.EOL +
					'define( \'DB_CHARSET\',  \'utf8\' );' + os.EOL +
					'define( \'DB_COLLATE\',  \'\' );' + os.EOL +
					'' + os.EOL +
					'/*--------------------------------------------------' + os.EOL +
					' * Authentication Unique Keys and Salts' + os.EOL +
					' * https://api.wordpress.org/secret-key/1.1/salt/' + os.EOL +
					'--------------------------------------------------*/' + os.EOL +
					'define( \'AUTH_KEY\',         \'' + createSalt() + '\' );' + os.EOL +
					'define( \'SECURE_AUTH_KEY\',  \'' + createSalt() + '\' );' + os.EOL +
					'define( \'LOGGED_IN_KEY\',    \'' + createSalt() + '\' );' + os.EOL +
					'define( \'NONCE_KEY\',        \'' + createSalt() + '\' );' + os.EOL +
					'define( \'AUTH_SALT\',        \'' + createSalt() + '\' );' + os.EOL +
					'define( \'SECURE_AUTH_SALT\', \'' + createSalt() + '\' );' + os.EOL +
					'define( \'LOGGED_IN_SALT\',   \'' + createSalt() + '\' );' + os.EOL +
					'define( \'NONCE_SALT\',       \'' + createSalt() + '\' );' + os.EOL +
					'' + os.EOL +
					'$table_prefix  = \'wp_\';' + os.EOL +
					'' + os.EOL;
	if( 'y' == config.debug ){
		wpConfig +=	'define( \'WP_DEBUG\',              true );' + os.EOL +
					'define( \'WP_DEBUG_DISPLAY\',      false );' + os.EOL +
					'define( \'WP_DEBUG_LOG\',          true );' + os.EOL;
	} else {
		wpConfig +=	'define( \'WP_DEBUG\',              false );' + os.EOL;
	}
	wpConfig +=		'define( \'AUTOSAVE_INTERVAL\',     ' + config.autosave + ' );' + os.EOL;
	if( false === config.revisions ){
		wpConfig +=	'define( \'WP_POST_REVISIONS\',     false );' + os.EOL;
	} else if( true !== config.revisions ){
		wpConfig +=	'define( \'WP_POST_REVISIONS\',     ' + config.revisions + ' );' + os.EOL;
	}
	wpConfig +=		'' + os.EOL +
					'if( !defined( \'ABSPATH\' ) ){' + os.EOL +
					'  define( \'ABSPATH\', dirname( __FILE__ ) . \'/\' );' + os.EOL +
					'}' + os.EOL + os.EOL +
					'require_once( ABSPATH . \'wp-settings.php\' );';

	fs.writeFile( 'wp-config.php', wpConfig );
};

var deleteFolderRecursive = function( path ){
	if( fs.existsSync( path ) ){
		fs.readdirSync( path ).forEach( function( file, index ){
			var curPath = path + '/' + file;
			if( fs.lstatSync( curPath ).isDirectory() ){
				deleteFolderRecursive( curPath );
			} else {
				fs.unlinkSync( curPath );
			}
		});
		fs.rmdirSync( path );
	}
	return true;
};

var downloadWordPress = function(){
	console.log( 'Downloading WordPress' );
	var wpurl = 'https://wordpress.org/';
	var wpversion = config.wpversion;
	if( 'latest' == config.wpversion ){
		wpversion = 'the latest version';
	} else {
		wpurl += 'wordpress-';
	}
	wpurl += config.wpversion + '.zip';
	https.get( wpurl, function( response ){
		console.log( 'Downloading WordPress (' + config.wpversion + '). Please be patient as this may take a minute.' );
		response.on( 'data', function( data ){
			fs.appendFileSync( 'wordpress.zip', data );
		});
		response.on( 'end', function(){
			console.log( 'Extracting WordPress' );
			fs.unlinkSync( 'LICENSE' );
			fs.unlinkSync( 'README.md' );
			var zip = new AdmZip( 'wordpress.zip' );
			zip.extractAllTo( './' );
			ncp( 'wordpress', '', function( err ){
				runAsyncInstallation();
			});
		})
	});
};

var finishInstallation = function(){
	console.log( 'Cleaning up the installer.' );
	//fs.unlinkSync( 'index.js' );
	//fs.unlinkSync( 'package.json' );
	//deleteFolderRecursive( 'node_modules' );
	console.log( 'All set. Have fun!' );
	return 1;
};

var runAsyncInstallation = function(){
	async.parallel([
		function( callback ){
			createWPConfig();
			console.log( 'Created the wp-config.php file' );
			callback( null, 'Created wp-config file' );
		},
		function( callback ){
			//deleteFolderRecursive( '.git' );
			console.log( 'Deleted the WordPress installer .git reference' );
			callback( null, 'Deleted the WordPress installer .git reference' );
		},
		function( callback ){
			fs.unlink( 'wordpress.zip' );
			console.log( 'Removed the wordpress.zip installation file' );
			callback( null, 'Removed the wordpress.zip installation file' );
		},
		function( callback ){
			deleteFolderRecursive( 'wordpress' );
			console.log( 'Removed the initial wordpress installation folder' );
			callback( null, 'Removed the initial wordpress installation folder' );
		},
		/*
		function( callback ){
			fs.unlinkSync( 'installer.js' );
			callback( null, 'fourteen' );
		},
		*/
	],
	function( err, results ){
		if( !err ){
			finishInstallation();
		} else {
			console.log( err );
			return 1;
		}
	});
};

fs.access( './index.php', fs.F_OK, function( err ){
	if( !err ){
		console.log( 'WordPress (or something else) is already installed in this directory. You must run the installer in its own directory.' );
		return 1;
	}
});

var promptSchema = {
	properties: {
		wpversion: {
			before: function( value ){
				value = value.trim().toLowerCase().replace( /rc/g, 'RC' );
				if( !value.length ){
					value = 'latest';
				}
				return value;
			},
			description: 'WordPress Version Number (leave blank for the latest version):',
			pattern: /^[0-9a-zA-Z\-\.]+$/,
			message: 'Version number must be only letters, numbers, dashes, and/or periods',
			required: false
		},
		dbname: {
			before: function( value ){
				return value.trim();
			},
			description: 'Database Name:',
			pattern: /^[a-zA-Z0-9\-_]+$/,
			message: 'Database name must be only letters, numbers, dashes, and/or underscores',
			required: true
		},
		dbuser: {
			before: function( value ){
				return value.trim();
			},
			description: 'Database User:',
			pattern: /^[a-zA-Z0-9\-_]+$/,
			message: 'Database user must be only letters, numbers, dashes, and/or underscores',
			required: true
		},
		dbpass: {
			before: function( value ){
				return value.trim();
			},
			description: 'Database Password:',
			pattern: /^[\S]+$/,
			message: 'Database password can not have spaces, tabs, or new lines',
			required: true
		},
		debug: {
			before: function( value ){
				return value.toLowerCase();
			},
			description: 'Turn on debug mode?',
			default: 'Y',
			pattern: /^[YyNn]+$/,
			message: 'Please enter Y or N',
			required: true
		},
		autosave: {
			before: function( value ){
				return parseInt( value );
			},
			description: 'Autosave interval, in seconds',
			default: 600,
			pattern: /^[0-9]+$/,
			message: 'Please enter a value in seconds',
			required: true
		},
		revisions: {
			before: function( value ){
				value = value.toLowerCase();
				if( isNaN( value ) || 'all' == value ){
					return true;
				} else if( 0 === parseInt( value ) ){
					return false;
				}
				return parseInt( value );
			},
			description: 'Number of revisions to store',
			default: 'All',
			pattern: /^[0-9alAL]+$/,
			message: 'Please enter a number, or type "all" to store all revisions',
			required: true
		}
    }
};

prompt.colors = false;
prompt.message = '';
prompt.delimiter = '';
prompt.start();
prompt.get( promptSchema, function( err, result ){
	if( err ){
		console.log( err );
		return 1;
	}
	config.wpversion  = result.wpversion;
	config.dbname     = result.dbname;
	config.dbuser     = result.dbuser;
	config.dbpass     = result.dbpass;
	config.debug      = result.debug;
	config.autosave   = result.autosave;
	config.revisions  = result.revisions;
	downloadWordPress();
} );