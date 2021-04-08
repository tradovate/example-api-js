require('dotenv').config()
const express = require('express')
const request = require('request-promise-native')
const NodeCache = require('node-cache')
const session = require('express-session')
const opn = require('open')
const app = express()

const PORT = 3030

const all_tokens = new NodeCache({ deleteOnExpire: true })

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = `http://localhost:3030/oauth/tradovate/callback`

app.use(session({
    secret: Math.random().toString(36).substring(2),
    resave: false,
    saveUninitialized: true
}))

const authUrl =
    'https://trader-d.tradovate.com/oauth' 
    + `?response_type=code` 
    + `&client_id=${encodeURIComponent(CLIENT_ID)}` 
    + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

app.get('/auth', (_, res) => {
    res.redirect(authUrl)
})

app.get('/oauth/tradovate/callback', async (req, res) => {
   
    if (req.query.code) {
        console.log('code:')
        console.log(req.query.code)

        const credentials = {
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: req.query.code
        }

        await exchangeCode(req.sessionID, credentials)

        res.redirect(`/`)
    }
})


const exchangeCode = async (userId, form) => {
    try {
        const responseBody = await request.post('https://live-api-d.tradovate.com/auth/oauthtoken', { form })
        
        const tokens = JSON.parse(responseBody)
        all_tokens.set(userId, tokens.access_token, tokens.expires_in)

        console.log('token:')
        console.log(tokens.access_token)

        return tokens.access_token
    } catch (e) {
        console.error(`       > Error exchanging ${form.grant_type} for access token`)
        return JSON.parse(e.response.body)
    }
}

const getAccessToken = async (userId) => {
    return all_tokens.get(userId)
}

const isAuthorized = (userId) => {
    return all_tokens.get(userId) ? true : false
}

app.get('/', async (req, res) => {
    console.log('has id yet?')
    console.log(isAuthorized(req.sessionID))

    res.setHeader('Content-Type', 'text/html')
    res.write(`<h2>Tradovate OAuth</h2>`)

    const accessToken = await getAccessToken(req.sessionID)

    if (accessToken) {
        const r2 = JSON.parse(await request('https://live-api-d.tradovate.com/auth/me', {
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        }))
        
        res.write(`<a href="/logout">Logout</a>`)
        res.write(`<h1>Welcome, ${r2.fullName}</h1>`)
        res.write(`<h4>ID: ${r2.userId}</h4>`)
        res.write(`<h4>email: ${r2.email}</h4>`)
        res.write(`<h4>verified?: ${r2.emailVerified}</h4>`)
        res.write(`<h4>trial?: ${r2.isTrial}</h4>`)
    } else {
        res.write(`<a href="/auth"><h3>Click to Authenticate</h3></a>`)
    }

    res.end()
})

app.get('/logout', (req, res) => {
    all_tokens.del(req.sessionID)
    res.redirect('/')
})

app.get('/error', (req, res) => {
    res.setHeader('Content-Type', 'text/html')
    res.write(`<h4>Error: ${req.query.msg}</h4>`)
    res.end()
})

app.listen(PORT, () => console.log(`=== Starting your app on http://localhost:${PORT} ===`))
opn(`http://localhost:${PORT}`)
