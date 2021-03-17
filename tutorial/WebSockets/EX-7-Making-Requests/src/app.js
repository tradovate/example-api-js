import { connect } from './connect'
import { WSHelper } from './socket'
import { getAccessToken, setAccessToken } from './storage'

//Connect to the tradovate API by retrieving an access token
connect({
    name:       "alennert02",
    password:   "YumD00d24!",
    appId:      "Sample App",
    appVersion: "1.0",
}, data => {
    const { accessToken, userId, userStatus, name, expirationTime } = data
    setAccessToken(accessToken, expirationTime)
    console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
})


const ws = new WSHelper()
ws.connect()

window.ws = ws