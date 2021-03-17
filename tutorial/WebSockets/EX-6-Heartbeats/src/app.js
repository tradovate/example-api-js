import { WSS } from './env'
import { connect } from './connect'
import { getAccessToken, setAccessToken } from './storage'

//Connect to the tradovate API by retrieving an access token
connect({
    name:       "<replace with your credentials>",
    password:   "<replace with your credentials>",
    appId:      "Sample App",
    appVersion: "1.0",
}, data => {
    const { accessToken, userId, userStatus, name, expirationTime } = data
    setAccessToken(accessToken, expirationTime)
    console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
})

const ws = new WebSocket(WSS)

const handleOpen = _ => {
    const { token } = getAccessToken()
    const authRequest = `authorize\n1\n\n${token}`

    ws.send(authRequest)
}

const handleJSON = msg => {
    const data = JSON.parse(msg.data.slice(1))
    console.log(data)
}

const handleHeartbeat = _ => console.log('ba-bump')

const handleClose = _ => console.log('closed connection')

const handleException = msg => {
    console.error('Malformed request, or server error encountered:')
    console.error(msg)
}

ws.onmessage = msg => {
    const { type, data } = msg
    const kind = data.slice(0,1)
    if(type !== 'message') {
        console.log('non-message type received')
        console.log(msg)
        return
    }

    //message discriminator
    switch(kind) {
        case 'o':
            handleOpen(msg)
            break
        case 'h':
            handleHeartbeat(msg)
            break
        case 'a':
            handleJSON(msg)
            break
        case 'c':
            handleClose(msg)
            break
        default:
            handleException(msg)
    }
}

