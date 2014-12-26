# Short URLs with context
A simple server to generate unique short URLs and attach some contextual data to them.

A live version is available for testing http://asc.li for testing purposes.

An example using the API has is also available on http://addsumcontext.com


## Usage

### Create a new short link `GET /v0/new/link/`

    http://localhost/v0/new/link/?context=`CONTEXT`&redirect=`REDIRECT`

`CONTEXT` can be any arbitrary string and is the data we want to attach to the link we are about to create.

`REDIRECT` where do you want the short link to go when clicked on. Must be a valid URL.


Example:

    http://asc.li/v0/new/link?context=bob&redirect=http://ubunutu.com

    response --> {
      "link": "http://asc.li/obdkf21"
    }

This attaches the data `bob` to our link and will redirect to `http://ubuntu.com` when someone clicks on the new `http://asc.li/obdkf21` link.

### Getting link statistics

#### Find by specific short URL `GET /v0/link/`

    http://localhost/v0/link/?path=`PATH`

`PATH` The short URL we want statistics for.

Example:

    http://asc.li/v0/link/?path=http://asc.li/obdkf21

    response --> {
      "context": "bob",
      "clicks": 17,
      "link": "http://asc.li/obdkf21",
      "redirect": "http://ubuntu.com"
    }

Here we have retrieved the data from the example above. Currently the only additional data tracked is the number of `clicks` the link has had.

#### Match on context `GET /v0/search/`

```
http://localhost/v0/search/?context=`CONTEXT`
```

`CONTEXT` The context you want to search for (does not need to be exact match)

Example:

```
http://localhost/v0/search/?context=bo

response --> [{
    "context": "bob",
    "clicks": 17,
    "link": "http://asc.li/obdkf21",
    "redirect": "http://ubuntu.com"
  }]
```

Here we have retrieved an array of objects matching the search criteria of `bo`. If no results are found an empty array is returned.

### Running Locally
If you don't want to use http://asc.li and would rather run your own instance:

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

If you're using naught and running Ubuntu, take a look at the `service.sh` file. Copy it to `/etc/init.d/link-context` and
set the `CONTEXT_CWD` variable (see below) to use:

```
# Start, stop, restart the server
$ service link-context start | stop | restart
```

##### CONFIG
Configuration can be done by setting the following environmental variables.

| Environmental Variable | Description                                                              |
|------------------------:--------------------------------------------------------------------------|
| CONTEXT_SEED           | [shortid](https://www.npmjs.org/package/shortid) seed                    |
| CONTEXT_PORT           | Port the server will run on (default 8000)                               |
| CONTEXT_DOMAIN         | Domain your server is running, e.g. http://asc.li                        |
| CONTEXT_CWD            | Path where you have link-context locally, e.g. `/usr/local/link-context` |


### Authentication

There is currently no authentication supported. The aim is to make it as easy as possible to test in a browser or with cURL. If your link context is not open data, run your own instance and use a firewall to limit access to the API.

TODO: Token based authentication coming soon to the http://asc.li incase you don't want to maintain your own instance ;)
