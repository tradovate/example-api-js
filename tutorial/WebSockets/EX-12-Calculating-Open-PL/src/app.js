import { connect } from './connect'
import { isMobile } from './utils/isMobile'
import { DeviceUUID } from "device-uuid"
import { tvPost } from './services'
import { getDeviceId, setAccessToken, setDeviceId } from './storage' 
import { TradovateSocket } from './TradovateSocket'
import { credentials } from '../../../tutorialsCredentials'
import { URLs } from '../../../tutorialsURLs'

setAccessToken(null)

//MOBILE DEVICE DETECTION
let DEVICE_ID
if(!isMobile()) {
    const device = getDeviceId()
    DEVICE_ID = device || new DeviceUUID().get()
    setDeviceId(DEVICE_ID)
} else {
    DEVICE_ID = new DeviceUUID().get()
}

 //get relevant UI elements
 const  $buyBtn     = document.getElementById('buy-btn'),
        $sellBtn    = document.getElementById('sell-btn'),
        $posList    = document.getElementById('position-list'),
        $symbol     = document.getElementById('symbol'),
        $openPL     = document.getElementById('open-pl'),
        $qty        = document.getElementById('qty')


//Setup events for active UI elements.
const setupUI = (socket) => {
    //We will hook up UI events here
}


//APPLICATION ENTRY POINT
const main = async () => {
    
    //for caching our open positions
    const pls = []
 
    //Connect to the tradovate API by retrieving an access token 
    await connect(credentials)

    //We will need a MarketDataSocket to get realtime price quotes to compare w/ our positions
    const socket = new TradovateSocket({debugLabel: 'Realtime API'})
    await socket.connect(URLs.WS_DEMO_URL)
    
    const mdsocket = new TradovateSocket({debugLabel: 'Market Data API'})
    await mdsocket.connect(URLs.MD_URL)

    //run the UI Setup
    setupUI(socket)

    //Calculate P&L! ...but how?

}

//START APP
main()
