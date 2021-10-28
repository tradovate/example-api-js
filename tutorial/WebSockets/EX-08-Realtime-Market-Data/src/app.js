import { credentials } from '../../../tutorialsCredentials'
import { connect } from './connect'
import { setAccessToken } from './storage'
import { TradovateSocket } from './TradovateSocket'

setAccessToken(null)

const main = async () => {
    //Connect to the tradovate API by retrieving an access token
    //await allows us to not call any further code until this is done,
    //ensuring that our dependent code will execute properly. This
    //is how we are strategizing our initialization.
    const { accessToken } = await connect(credentials)


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