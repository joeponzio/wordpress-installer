#!/usr/bin/env node
var AdmZip = require( 'adm-zip' );
var fs     = require( 'fs' );
var https  = require( 'https' );
var ncp    = require( 'ncp' ).ncp;
var prompt = require( 'prompt' );
var wpv;

ncp.limit = 16;

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
};

var downloadWordPress = function(){
	var wpurl;
	if( !wpv.length ){
		wpurl = 'https://wordpress.org/latest.zip';
	} else {
		wpurl = 'https://wordpress.org/wordpress-' + wpv + '.zip';
	}
	https.get( wpurl, function( response ){
		console.log( 'Downloading WordPress. Please be patient as this may take a minute.' );
		response.on( 'data', function( data ){
			fs.appendFileSync( 'wordpress.zip', data );
		});
		response.on( 'end', function(){
			console.log( 'Extracting WordPress' );
			fs.unlinkSync( 'LICENSE' );
			fs.unlinkSync( 'README.md' );
			var zip = new AdmZip( 'wordpress.zip' );
			zip.extractAllTo( './' );
			fs.unlink( 'wordpress.zip', moveWordPress );
		})
	});
};

var moveWordPress = function(){
	ncp( 'wordpress', '', function( err ){
		deleteFolderRecursive( 'wordpress' );
		wipeInitializer();
	});
};

var wipeInitializer = function(){
	console.log( 'Cleaning up the installer.' );
	fs.unlinkSync( 'index.js' );
	fs.unlinkSync( 'package.json' );
	deleteFolderRecursive( 'node_modules' );
	console.log( 'All set. Have fun!' );
	return 1;
};

fs.access( './index.php', fs.F_OK, function( err ){
	if( !err ){
		console.log( 'WordPress (or something else) is already installed in this directory. You must run the installer in its own directory.' );
		return 1;
    }
});

deleteFolderRecursive( '.git' );

prompt.start();
var promptSchema = {
	properties: {
		wpv: {
			description: 'Version Number (leave blank for the latest version)',
			pattern: /^[0-9a-zA-Z\-\.]+$/,
			message: 'Version number must be only letters, numbers, dashes, and/or hyphens',
			required: false
		}
    }
};

prompt.get( promptSchema, function( err, result ){
	if( err ){
		console.log( err );
	}
	wpv = result.wpv;
	downloadWordPress();
} );