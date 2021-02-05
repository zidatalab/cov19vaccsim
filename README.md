# Prototype of a Zi Dashboard based solely on Angular

To install [nodejs](https://nodejs.org/en/download/) and [angular-cli](https://cli.angular.io/) needs to be installed on the system.

If this is the case, the Dashboard can be tested with the following commands from the root directory.

`cd Dashboard`

First launch only: `npm install`

`ng serve`

After update set 

`cp -r Dashboard/dist/Dashboard/* docs/`

Build for github-pages

`ng build --prod --base-href "https://www.zidatasciencelab.de/cov19vaccsim/"`
