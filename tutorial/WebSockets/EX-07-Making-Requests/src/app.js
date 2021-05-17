import { connect } from './connect'
import { WSS_URL } from './env'
import { TradovateSocket } from './TradovateSocket'

//Connect to the tradovate API by retrieving an access token
const main = async () => {
    await connect({
        name:       "<replace with your credentials>",
        password:   "<replace with your credentials>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    })


    const ws = new TradovateSocket()
    await ws.connect(WSS_URL)
}

main()