# WordPress Installer
The WordPress Installer lets you quickly install the latest (or any past) version WordPress. **NOTE:** Requires node on your system.

## How To Use

* `git clone git@github.com:joeponzio/wordpress-installer.git`
* `npm run installer`
* When prompted, enter the version of WordPress to install (or leave blank for the latest stable version) and your database credentials, and follow the additional prompts

## What To Expect

1. The desired version of **WordPress** will be downloaded and installed in the current directory (this may take a minute so be patient)
1. The installer will remove its own files as they're not needed anymore
1. You have a clean install of WordPress. Enjoy!

## Configuration Options
If you're going to use this a lot, consider adding your preferred defaults to the config options so you can skip through the prompts more quickly. For example, if you use one database user on your localhost for every install, consider adding your database username and password to the `config` variable in `index.js`:

```javascript
var config = {
	autosave: 60,
	dbhost: 'localhost',
	dbpass: 'password',
	dbuser: 'username',
	debug: 'Y',
	revisions: 'All'
};
```

Of course, you'll need to save this in your own (preferably private) repo. But the point is - use it how you want!

## Got Ideas? Go Fork Yourself
I didn't want this installer to be too opinionated; so, it is as Plain Vanilla as they come. We use modified versions of it to:

* Delete *akismet* and *hello.php* (sorry Matt) upon install
* Clone our framework and base child theme repos (and delete the `git` references so they're fresh)
* Create a new `git` repo to the project (and add everything, commit with "initial commit" and push to Github :)
* Run `npm install` and `bower install` after the installation so we're quickly up and running with SCSS and livereload

The point is: you can use this to do whatever you want. Use it as a basis for making your own, custom WordPress installer. Simply fork this repo and customize to your heart's content. Of course, if you find an optimization or fix for this script that would benefit others, please go ahead and pull, create issues, etc.

## Issues or Problems
If you run into any problems or issues with this installer, you should [post them in the issues section of this repo](https://github.com/joeponzio/wordpress-installer/issues).