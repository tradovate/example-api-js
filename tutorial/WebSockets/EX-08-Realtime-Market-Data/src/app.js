import { connect } from './connect'
import { TradovateSocket } from './TradovateSocket'

const main = async () => {
    //Connect to the tradovate API by retrieving an access token
    //await allows us to not call any further code until this is done,
    //ensuring that our dependent code will execute properly. This
    //is how we are strategizing our initialization.
    await connect({
        name:       "<replace with your credentials>",
        password:   "<replace with your credentials>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    })


    // APPLICATION ----------------------------------------------------

    //HTML elements
    const $outlet       = document.getElementById('outlet')
    const $reqBtn       = document.getElementById('request-btn')
    const $unsubBtn     = document.getElementById('unsubscribe-btn')
    const $connBtn      = document.getElementById('connect-btn')
    const $discBtn      = document.getElementById('disconnect-btn')
    const $statusInd    = document.getElementById('status')
    const $symbol       = document.getElementById('symbol')

    //The websocket helper tool
    const socket = new TradovateSocket()
}

main()