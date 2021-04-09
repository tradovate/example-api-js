# Using OAuth for Your Tradovate Application's Authentication
In this short tutorial, we will cover using the OAuth service to authenticate users for your application. Authenticating your application
via OAuth for Tradovate is a three step process.

1. We navigate to a special OAuth URL using our client id and client secret, which will be supplied by Tradovate. We present our 
google credentials here.
2. After presenting our credentials, we will be redirected to a supplied redirect URL, but a single-use code will be in the URL query.
Our server must extract the code from the query so we can use it in step 3.
3. We exchange the extracted code for our access token, and we are officially an authenticated entity.

## Getting Setup
We will be starting this project from scratch, however the complete solution is also provided in this repo so feel free to run it.
If you're following along from scratch, boot up a command terminal and navigate to a directory of your choosing. Run the following commands:

```sh
mkdir oauth-example
cd oauth-example
yarn init
```

Follow the prompts after `init`. There's nothing wrong with simply using the defaults. We will need some utilities to help us complete
this project. Let's add those as well:

```sh
yarn add dotenv express express-session node-cache request request-promise-native
```

This seems like a lot, but it's actually quite bare-bones.
* `dotenv` allows us to store some variables locally. I'll be using it to show how to hide our client secret.
* `express` and `express-session` are mainstream server-components. Express gives our server typical routing capabilities. `express-session`
allows us to use user-specific session data in our express routes.
* `node-cache` is a simple stand-in for a database (for our dev purposes, in reality use a database).
* Finally `request` and `request-promise-native` allow us to send requests from the backend asynchronously like we would on the front end.

Now that our dependencies are in order, let's add our environment variables file. Create a new file called `.env`.

```
CLIENT_ID=1
CLIENT_SECRET='your_client_secret'
```

Replace the values with your special client variables, provided to you by Tradovate.

Next we'll add our `index.js` file:

```js
//index.js
require('dotenv').config()
const express = require('express')
const request = require('request-promise-native')
const NodeCache = require('node-cache')
const session = require('express-session')
const app = express()

const PORT = 3030

//this is a replacement for a database in this example. 
//Use a database or some storage solution in a real world app.
const all_tokens = new NodeCache({ deleteOnExpire: true })

//in order to use process.env, we must also create a .env file. 
//This is not included in the example code for security reasons. 
//See the tutorial for details on how to format the variables in the .env file.
const CLIENT_ID     = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI  = `http://localhost:3030/oauth/tradovate/callback`
const EXCHANGE_URL  = `https://live-api-d.tradovate.com/auth/oauthtoken`
const AUTH_URL      = `https://trader-d.tradovate.com/oauth`

// ROUTES ---------------------------------------------------------------------

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html')
    res.write(`<h2>Tradovate OAuth</h2>`)
    res.end()
})

// ENTRY ----------------------------------------------------------------------

app.listen(PORT, () => console.log(`Starting your app on http://localhost:${PORT}`))

```

We import our dependencies using the standard node `require`. We'll be using port 3030 for our examples. We also initialize
our node-cache database stand-in. Then we pull our data from the `.env` file using node's `process.env` property. This allows us
to obfuscate our client id and client secret - if you add `.env` to your `.gitignore` ledger, it won't even show up on github. Now
nobody can steal our credentials. 

In the `ROUTES` section, we setup a simple home route that just sends back an HTML heading with our title inside. We will use this route 
later to fork our login logic, but for now this will suffice. Finally, we start the app up by `listen`ing on port 3030. 

To run the app, we could call `node index.js` from the terminal. But if you'd rather call `yarn start`, add this script to your `package.json`:

```js
{
//...
    "scripts": {
        "start": "node index.js"
    },
//...
}
```
Now we can start our app by calling `yarn start`. We should see 'Starting your app on http://localhost:3030' logged to the terminal, and navigating to
`localhost:3030` should yield your 'Tradovate OAuth' heading if it works.

## Starting the OAuth Flow
In order to start the OAuth flow, we must first redirect our users to a constructed OAuth link. This link needs to contain our client id
and a redirect URI - the URI for our server's OAuth callback. Let's build our URL now:

```js
//construct our authorization code request URL
const authUrl =
    AUTH_URL 
    + `?response_type=code` 
    + `&client_id=${encodeURIComponent(CLIENT_ID)}` 
    + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

```
Now we need to change our route code. Add a new route for `'/auth'`:

```js
app.get('/auth', (_, res) => {
    res.redirect(authUrl)
})
```

We perform a simple redirect to our constructed `authUrl`. Then in the `'/'` route:

```js
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html')
    res.write(`<h2>Tradovate OAuth</h2>`)
    res.write(`<a href="/auth"><h3>Click to Authenticate</h3></a>`) //<-- add this link

    res.end() 
})
```
We've added an anchor element to our response HTML that will hit the `'/auth'` endpoint that we just created.

# The Callback
When we run the code we created, our flow will go like this:

* The page loads, we hit the `'/'` endpoint. Our heading and anchor render.
* We click the anchor, which hits the `'/auth'` endpoint. This redirects us to the constructed OAuth URL.
* We see the Tradovate Login screen! So far so good. We present our credentials. And...

Nothing ever happens. Or we get an error from express saying `cannot /GET`. That's because we never setup a route
for our callback. 

What happens when we present our google credentials is basically this - your app asks google if you are the person you say you are. In response,
Google simply asks for your Google account credentials. If you can satisfy the request, you get a single-use code as a response. The response is sent to the
`REDIRECT_URI` address that we specified at the top of the file. The actual code parameter comes to us in the form of the URL query. We can access this
using the express Request object (any `req` parameter within in a route callback).

Back in our `ROUTES` section, add a new route:

```js
app.get('/oauth/tradovate/callback', async (req, res) => {
    if (req.query.code) {
        //req.query.code is the data we've extracted from the URL
        const credentials = {
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: req.query.code
        }

        //Alright we have a code. How can we exchange our credentials?

    }
})
```

We use the `req` callback parameter's `query` field to access parts of the URL query from code. If it's there, we can easily extract it and 
put it into an object. We will use these `credentials` in our exchange. Now how can we go about doing that?

We're provided with a URL to exchange our code for a token, https://live-api-d.tradovate.com/auth/oauthtoken. We can send a POST
request to that address with our `credentials` object in the request form. If all is well, we should be granted an access token. We'll write a 
utility function to help us exchange our code:

```js
const exchangeCode = async (userId, form) => {
    try {
        //make a post request with our credentials as the form to the tradovate oauth token exchange endpoint
        const responseBody = await request.post(EXCHANGE_URL, { form })
        
        //if we got a token
        const token_data = JSON.parse(responseBody)
        //check it for errors
        if(token_data.error) {
            console.error(`Code Exchange Error: [${token_data.error}] ${token_data.error_description}`)
            return
        }
        //else save the token and expiry
        all_tokens.set(userId, token_data.access_token, token_data.expires_in)
    } catch (e) {
        //catch non-internal errs
        console.error(`Code Exchange failed.`)
        return JSON.parse(e.response.body)
    }
}
```

Our `exchangeCode` function is an asynchronous function, meaning we can use it with the async/await API. It takes two parameters. `userId` is the
`sessionID` field of our request. This is preset for us via `express-session` middleware that we setup in the Getting Setup section. The `form` parameter
will be the `credentials` object we created in our callback route.

We use another of our modules, the `request` module, to make our POST request. This is where we pass in our URL and our `form` parameter. 
We `try` to parse the response JSON. If we got a standard response, it could have one of two formats. Either we got a token and it has the `access_token` and 
`expires_in` fields, or we received the error form with `error` and `error_description` fields. We can account for both here. If we did have a token,
we will save the token to our pseudo-database (keep in mind this cache is cleared on each restart). If there was some other 
unrelated error, it will be caught in the `catch` block.

Now let's utilize that function in our callback:

```js
app.get('/oauth/tradovate/callback', async (req, res) => {
    if (req.query.code) {
        //req.query.code is the data we've extracted from the URL
        const credentials = {
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: req.query.code
        }

        //Now we know what to do...
        //exchange the retrieved code for our real token and store it
        await exchangeCode(req.sessionID, credentials)

        //if all is well, we should be authorized to see the authenticated home screen now, so redirect to origin
        res.redirect(`/`)
    }
})
```

If we run the program now, we'll have our typical flow. But when we submit our google credentials, we will be redirected to the home page. There's
only one problem with that - we haven't forked our logic for the authorized and unauthorized use cases. We'll simply be presented with the 
click-to-authenticate screen again. Let's fix that by splitting up our logic. We can write a helper to cover the case that we're authenticated:

```js
//write out HTML to display the result of `/me` endpoint
const showMe = async (_, res, accessToken) => {
    const me = JSON.parse(await request('https://live-api-d.tradovate.com/auth/me', {
        headers: {
            Authorization: 'Bearer ' + accessToken
        }
    }))

    //in case of a non trivial amount of HTML, use a template file or one of node's many supported rendering engines.
    res.write(`<h2>Welcome, ${me.fullName}</h2>`)
    res.write(`<p>ID: ${me.userId}</p>`)
    res.write(`<p>email: ${me.email}</p>`)
    res.write(`<p>verified?: ${me.emailVerified}</p>`)
    res.write(`<p>trial?: ${me.isTrial}</p>`)
}
```

To determine if we're authenticated, let's write another helper to get our token:

```js
//retrieve stored token by sessionID, in reality hit the database for this info (this is why we sim async for sync operation)
const getAccessToken = async (userId) => {
    return all_tokens.get(userId)
}
```
Normally, you'd want to store and retrieve this info with a database, which is why I've chosen to simulate this as an asynchronous
operation (even though accessing our cache is synchronous). 

Now we're equipped to split our home page logic for authorized and unauthorized users:

```js
app.get('/', async (req, res) => {

    // we're sending HTML
    res.setHeader('Content-Type', 'text/html')
    res.write(`<h2>Tradovate OAuth</h2>`)

    //check our token
    const accessToken = await getAccessToken(req.sessionID)

    if (accessToken) {
        //I have a token! Show me `/me`
        await showMe(req, res, accessToken)
    } else {
        //I don't have a token. Show me how to get one.
        res.write(`<a href="/auth"><h3>Click to Authenticate</h3></a>`)
    }

    //done writing
    res.end()
})
```
If we run through our usual flow, we'll get a response and be redirected home. Our logic should now be properly split and will show the results of `'/me'` from
the Tradovate backend.

## Logout
There's just one loose end left to take care of. We need to add some logout logic. Let's add one more route:

```js
app.get('/logout', (req, res) => {
    all_tokens.del(req.sessionID)
    res.redirect('/')
})
```

In a real world app, you'd probably clear the token from your database. In our example we can simply delete the token associated with the client's `sessionID`.
Now we just need to add an extra line to our `showMe` function:

```js
const showMe = async (req, res, accessToken) => {
    //...
    res.write(`<h2>Tradovate OAuth</h2>`)
    res.write(`<a href="/logout"><h3>Logout</h3></a>`) //<-- add this
    //...
}
```
We can successfully logout using this new anchor after our usual flow.

## Further Reading
Congratulations, you now know how to implement OAuth authentication for your Tradovate app! If you'd like to learn more about
using the Tradovate API, see our other JS examples guides [here](https://github.com/tradovate/example-api-js/).

