import { connect } from './connect'
import { getAccessToken, setAccessToken } from './storage'

setAccessToken(null)

const main = async () => {
    //Connect to the tradovate API by retrieving an access token
    connect({
        name:       "<replace with your credentials>",
        password:   "<replace with your credentials>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    })
}

//app entry point
main()
