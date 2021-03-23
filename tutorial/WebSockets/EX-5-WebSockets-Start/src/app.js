import { connect } from './connect'
import { getAccessToken, setAccessToken } from './storage'

const main = async () => {
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
}

//app entry point
main()
