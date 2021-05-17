import { connect } from './connect'
import { tvGet, tvPost } from './services'
import { isMobile } from './utils/isMobile'
import { DeviceUUID } from "device-uuid"
import { MDS_URL } from './env'
import { getAvailableAccounts, queryAvailableAccounts, getDeviceId, setDeviceId } from './storage' 
import { renderPos } from './renderPosition'
import { MarketDataSocket } from './MarketDataSocket'

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

//We will want to cache our open Positions - they'll go here.
let POSITIONS = []

//Setup events for active UI elements.
const setupUI = () => {
    //We will hook up UI events here
}


//APPLICATION ENTRY POINT
const main = async () => {    
 
    //Connect to the tradovate API by retrieving an access token 
    await connect({
        name:       "<Your Credentials Here>",
        password:   "<Your Credentials Here>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
        deviceId:   DEVICE_ID   
    })

    //We will need a MarketDataSocket to get realtime price quotes to compare w/ our positions
    const socket = new MarketDataSocket()
    await socket.connect(MDS_URL)

    //run the UI Setup
    setupUI()

    //Calculate P&L! ...but how?

}

//START APP
main()
