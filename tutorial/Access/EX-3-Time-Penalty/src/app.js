import { accountList } from './accountList'
import { handleAccountList } from './handleAccountList'
import { connect } from './connect'
import { setAccessToken } from './storage'

//Connect to the tradovate API by retrieving an access token
connect({
    name:       "<replace with your credentials>",
    password:   "<replace with your credentials>",
    appId:      "Sample App",
    appVersion: "1.0",
    cid:        8,
    sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
}, data => {
    const { accessToken, userId, userStatus, name, expirationTime } = data
    setAccessToken(accessToken, expirationTime)
    console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
})
