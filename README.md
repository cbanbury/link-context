# Short URLs with context
A simple server to generate unique short URLs and attach some contextual data to them.

A live version will soon be up on http://asc.li for testing purposes.


## Usage

### Create a new short link `GET /create/new/link/`

    http://localhost/create/new/link/?context=`CONTEXT`&redirect=`REDIRECT`

`CONTEXT` can be any arbitrary string and is the data we want to attach to the link we are about to create.

`REDIRECT` where do you want the short link to go when clicked on.


Example:

    http://asc.li/create/new/link?context=bob&redirect=http://ubunutu.com

    response --> http://asc.li/obdkf21

This attaches the data `bob` to our link and will redirect to `http://ubuntu.com` when someone clicks on the new `http://asc.li/obdkf21` link.

### Getting link statistics

#### Find by specific short URL `GET /link/`

    http://localhost/link/?path=`PATH`

`PATH` The short url we want statistics for.

Example:

    http://asc.li/link/?path=http://asc.li/obdkf21

    response --> {
      "context": "bob",
      "clicks": 17,
      "link": "http://asc.li/obdkf21",
      "redirect": "http://ubuntu.com"
    }

Here we have retrieved the data from the example above. Currently the only additional data tracked is the number of `clicks` the link has had.

#### Match on context `GET /link/context/`
TODO: Ability to fetch data by matching against part of the context assigned to the link

### Running Locally
If you don't want to use http://asc.li and would rather run your own instance, its as easy as:

    $ npm install link-context
    $ cd node_modules/link-context
    $ npm start

Requirements:
- node/npm ~ 0.10.33
- MongoDB ~ 2.6.x

In you want the server running constantly, bring it up with [naught](https://www.npmjs.org/package/naught):

    $ naught start server.js

Requirements:
- naught installed globally

##### CONFIG
All config is currently stored in `server.js`. This and much of the code will be put somewhere more sensible in due course.

<table>
  <tr>
    <td>Config Variable</td><td>Description</td>
  </tr>
  <tr>
    <td>SEED</td><td>[shortid](https://www.npmjs.org/package/shortid) seed </td>
  </tr>
  <tr>
    <td>PORT</td><td>Port the server will run on (default 8000)</td>
  </tr>
  <tr>
    <td>DOMAIN</td><td>Domain your server is running, e.g. http://asc.li</td>
  </tr>
</table>

### Authentication

There is currently no authentication supported. The aim is to make as easy as possible to test in a browser or with cURL. If your link context is not open data, just spin up your own instance and use a firewall to limit access to the API.

TODO: Token based authentication coming soon to the http://asc.li so you won't need to run you own version ;)
