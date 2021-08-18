import { connect } from './connect'
import { tvGet, tvPost } from './services'
import { isMobile } from './utils/isMobile'
import { DeviceUUID } from "device-uuid"
import { getAvailableAccounts, queryAvailableAccounts, setAccessToken, getDeviceId, setDeviceId } from './storage' 
import { renderPos } from './renderPosition'
import { TradovateSocket } from './TradovateSocket'
import { MDS_URL, WSS_URL } from './env'
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

//Setup events for active UI elements.
const setupUI = (socket) => {

    const onClick = (buyOrSell = 'Buy') => async () => {
        //first available account
        const { name, id } = getAvailableAccounts()[0]

        if(!$symbol.value) return

        let { orderId } = await tvPost('/order/placeOrder', {
            action: buyOrSell,
            symbol: $symbol.value,
            orderQty: parseInt($qty.value, 10),
            orderType: 'Market',
            accountName: name,
            accountId: id
        })
        console.log(orderId)
        await socket.synchronize()
    }

    $buyBtn.addEventListener('click', onClick('Buy'))
    $sellBtn.addEventListener('click', onClick('Sell'))
}


//APPLICATION ENTRY POINT
const main = async () => {     

    const pls = []
    
    const runPL = () => {
        const totalPL = pls.map(({pl}) => pl).reduce((a, b) => a + b, 0)
        $openPL.innerHTML = ` $${totalPL.toFixed(2)}`
    }

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

    const socket = new TradovateSocket()
    await socket.connect(WSS_URL)

    const mdsocket = new MarketDataSocket()
    await mdsocket.connect(MDS_URL)

    socket.onSync(({positions, contracts, products}) => {
        positions.forEach(async pos => {

            if(pos.netPos === 0 && pos.prevPos === 0) return
    
            const { name } = contracts.find(c => c.id === pos.contractId)
    
            //get the value per point from the product catalogue
            let item = products.find(p => p.name.startsWith(name))
            
            let vpp = item.valuePerPoint    
    
            await mdsocket.subscribeQuote(name, ({Trade}) => {
    
                let buy = pos.netPrice ? pos.netPrice : pos.prevPrice
                const { price } = Trade            
    
                let pl = (price - buy) * vpp * pos.netPos 
                
                const element = document.createElement('div')
                element.innerHTML = renderPos(name, pl, pos.netPos)
                const $maybeItem = document.querySelector(`#position-list li[data-name="${name}"`)
                $maybeItem ? $maybeItem.innerHTML = renderPos(name, pl, pos.netPos) : $posList.appendChild(element)
    
                const maybePL = pls.find(p => p.name === name)
                if(maybePL) {
                    maybePL.pl = pl
                } else {
                    pls.push({ name, pl })
                }
    
                runPL()
            })        
        })
    })

    await socket.synchronize()

    setupUI(socket)
}

//START APP
main()
