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
//dbname, dbuser, dbpass, ncp.limit = 16, wpversion;

var createSalt = function(){
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|[];:",./<>?`~';
	for( var i = 0; i < 64; i++ ){
		text += possible.charAt( Math.floor( Math.random() * possible.length ) );
	}
	return text;
};

var createWPConfig = function(){
	var wpConfig = '<?php' + os.EOL +
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
		'' + os.EOL +
		'define( \'WP_DEBUG\',              true );' + os.EOL +
		'define( \'WP_DEBUG_DISPLAY\',      false );' + os.EOL +
		'define( \'WP_DEBUG_LOG\',          true );' + os.EOL +
		'define( \'AUTOSAVE_INTERVAL\',     300 );' + os.EOL +
		'define( \'WP_POST_REVISIONS\',     3 );' + os.EOL +
		'define( \'DISALLOW_FILE_EDIT\',    true );' + os.EOL +
		'define( \'IMAGE_EDIT_OVERWRITE\',  true );' + os.EOL +
		'' + os.EOL +
		'if( !defined( \'ABSPATH\' ) ){' + os.EOL +
		'  define( \'ABSPATH\', dirname( __FILE__ ) . \'/\' );' + os.EOL +
		'}' + os.EOL +
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
	var wpurl;
	if( !config.wpversion.length ){
		wpurl = 'https://wordpress.org/latest.zip';
		wpversion = '(the latest version)';
	} else {
		wpurl = 'https://wordpress.org/wordpress-' + config.wpversion + '.zip';
	}
	https.get( wpurl, function( response ){
		console.log( 'Downloading WordPress ' + config.wpversion + '. Please be patient as this may take a minute.' );
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
	deleteFolderRecursive( 'node_modules' );
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
		function( callback ){
			if( fs.existsSync( 'wp-content/plugins/akismet' ) ){
				deleteFolderRecursive( 'wp-content/plugins/akismet' );
				console.log( 'Deleted akismet plugin' );
			}
			callback( null, 'Deleted akismet plugin' );
		},
		function( callback ){
			if( fs.existsSync( 'wp-content/plugins/hello.php' ) ){
				fs.unlinkSync( 'wp-content/plugins/hello.php' );
				console.log( 'Deleted hello.php plugin (sorry Matt)' );
			}
			callback( null, 'Deleted hello.php plugin' );
		},
		function( callback ){
			if( fs.existsSync( 'wp-content/themes/twentyfourteen' ) ){
				deleteFolderRecursive( 'wp-content/themes/twentyfourteen' );
				console.log( 'Deleted Twenty Fourteen theme' );
			}
			callback( null, 'Deleted Twenty Fourteen theme' );
		},
		function( callback ){
			if( fs.existsSync( 'wp-content/themes/twentyfifteen' ) ){
				deleteFolderRecursive( 'wp-content/themes/twentyfifteen' );
				console.log( 'Deleted Twenty Fifteen theme' );
			}
			callback( null, 'Deleted Twenty Fifteen theme' );
		},
		function( callback ){
			if( fs.existsSync( 'wp-content/themes/twentysixteen' ) ){
				deleteFolderRecursive( 'wp-content/themes/twentysixteen' );
				console.log( 'Deleted Twenty Sixteen theme' );
			}
			callback( null, 'Deleted Twenty Sixteen theme' );
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
/*
var moveWordPress = function(){
	ncp( 'wordpress', '', function( err ){
		deleteFolderRecursive( 'wordpress' );
		wipeInitializer();
	});
};
*/

fs.access( './index.php', fs.F_OK, function( err ){
	if( !err ){
		console.log( 'WordPress (or something else) is already installed in this directory. You must run the installer in its own directory.' );
		return 1;
	}
});

var promptSchema = {
	properties: {
		wpversion: {
			description: 'WordPress Version Number (leave blank for the latest version):',
			pattern: /^[0-9a-zA-Z\-\.]+$/,
			message: 'Version number must be only letters, numbers, dashes, and/or hyphens',
			required: false
		},
		dbname: {
			description: 'Database Name:',
			pattern: /^[a-zA-Z0-9\-_]+$/,
			message: 'Database name must be only letters, numbers, dashes, and/or underscores',
			required: true
		},
		dbuser: {
			description: 'Database User:',
			pattern: /^[a-zA-Z0-9\-_]+$/,
			message: 'Database user must be only letters, numbers, dashes, and/or underscores',
			required: true
		},
		dbpass: {
			description: 'Database Password:',
			pattern: /^[\S]+$/,
			message: 'Database password can not have spaces, tabs, or new lines',
			required: true
		},
		debug: {
			description: 'Turn on debug mode? (Y/n)',
			default: 'Y',
			pattern: /^[YyNn]+$/,
			message: 'Please enter Y or N',
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
	config.wpversion  = result.wpversion.trim();
	config.dbname     = result.dbname.trim();
	config.dbuser     = result.dbuser.trim();
	config.dbpass     = result.dbpass.trim();
	config.debug      = result.debug.trim();
	downloadWordPress();
} );