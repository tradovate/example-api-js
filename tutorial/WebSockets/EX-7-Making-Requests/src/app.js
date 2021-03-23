import { connect } from './connect'
import { DEMO_URL } from './env'
import { TradovateSocket } from './TradovateSocket'
import { setAccessToken } from './storage'

//Connect to the tradovate API by retrieving an access token
const main = async () => {
    await connect({
        name:       "<replace with your credentials>",
        password:   "<replace with your credentials>",
        appId:      "Sample App",
        appVersion: "1.0",
    }, data => {
        const { accessToken, userId, userStatus, name, expirationTime } = data
        setAccessToken(accessToken, expirationTime)
        console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
    })


    const ws = new TradovateSocket(DEMO_URL)
}

main()