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
const REDIRECT_URI = `http://localhost:3030/oauth/tradovate/callback`
const EXCHANGE_URL  = 'https://live-api-d.tradovate.com/auth/oauthtoken'
const AUTH_URL      = `https://trader-d.tradovate.com/oauth`

//initialize our user session with a unique id.
app.use(session({
    secret: Math.random().toString(36).substring(2),
    resave: false,
    saveUninitialized: true
}))

//construct our authorization code request URL
const authUrl =
    AUTH_URL 
    + `?response_type=code` 
    + `&client_id=${encodeURIComponent(CLIENT_ID)}` 
    + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

// HELPERS -----------------------------------------------------------------------------------------------------------

//exchange our code for an access token, expects our sessionID and necessary credentials
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

//write out HTML to display the result of `/me` endpoint
const showMe = async (_, res, accessToken) => {
    const me = JSON.parse(await request('https://live-api-d.tradovate.com/auth/me', {
        headers: {
            Authorization: 'Bearer ' + accessToken
        }
    }))

    //in case of a non trivial amount of HTML, use a template file or one of node's many supported rendering engines.
    res.write(`<a href="/logout"><h3>Logout</h3></a>`)
    res.write(`<h2>Welcome, ${me.fullName}</h2>`)
    res.write(`<p>ID: ${me.userId}</p>`)
    res.write(`<p>email: ${me.email}</p>`)
    res.write(`<p>verified?: ${me.emailVerified}</p>`)
    res.write(`<p>trial?: ${me.isTrial}</p>`)
}


//retrieve stored token by sessionID, in reality hit the database for this info (this is why we sim async for sync operation)
const getAccessToken = async (userId) => {
    return all_tokens.get(userId)
}


// ROUTES --------------------------------------------------------------------------------------------------------------

//begin the auth flow using our constructed URL
app.get('/auth', (_, res) => {
    res.redirect(authUrl)
})

//After we present our credentials we will be redirected to this API hook
//This is where we extract the code which we will later use to exchange for
//a real access token.
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

        //exchange the retrieved code for our real token and store it
        await exchangeCode(req.sessionID, credentials)

        //if all is well, we should be authorized to see the authenticated home screen now, so redirect to origin
        res.redirect(`/`)
    }
})



//Home route
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

//Logout route
app.get('/logout', (req, res) => {
    all_tokens.del(req.sessionID)
    res.redirect('/')
})


// ENTRY ----------------------------------------------------------------------

app.listen(PORT, () => console.log(`Starting your app on http://localhost:${PORT}`))
