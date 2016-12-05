# WordPress Installer
The WordPress Installer lets you quickly install the latest (or any past) version WordPress. **NOTE:** This does not include WordPress MU versions prior to WordPress 3.0 when MU was merged into WordPress.

## How To Use

* `git clone git@github.com:joeponzio/wordpress-installer.git`
* `npm run installer`
* When prompted, enter the version of WordPress to install (or leave blank for the latest stable version)

## What To Expect

1. The desired version of **WordPress** will be downloaded and installed in the current directory (this may take a minute so be patient)
1. The installer will remove its own files as they're not needed anymore
1. You have a clean install of WordPress. Enjoy!

(You still need to create your `wp-config.php` to connect to the database.)

## Got Ideas? Go Fork Yourself
I didn't want this installer to be too opinionated; so, it is as Plain Vanilla as they come. We use modified versions of it to:

* Auto-generate `wp-config.php` files with database credentials filled in during the install
* Delete *hello.php* and *akismet* upon install
* Clone our framework and base child theme repos (and delete the `git` references so they're fresh)
* Create a new `git` repo to the project (and add everything, commit with "initial commit" and push to Github :)
* Run `npm install` and `bower install` after the installation so we're quickly up and running with SCSS and livereload

The point is: you can use this to do whatever you want. Use it as a basis for making your own, custom WordPress installer. Simply fork this repo and customize to your heart's content.

## Issues or Problems
If you run into any problems or issues with this installer, you should [post them in the issues section of this repo](https://github.com/joeponzio/wordpress-installer/issues).