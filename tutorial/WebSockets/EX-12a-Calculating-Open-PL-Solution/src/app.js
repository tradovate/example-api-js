import { connect } from './connect'
import { tvPost } from './services'
import { isMobile } from './utils/isMobile'
import { DeviceUUID } from "device-uuid"
import { getAvailableAccounts, getDeviceId, setDeviceId } from './storage' 
import { renderPos } from './renderPosition'
import { TradovateSocket } from './TradovateSocket'
import { credentials } from '../../../tutorialsCredentials'
import { URLs } from '../../../tutorialsURLs'
import { getAccessToken, setAccessToken } from '../../EX-11a-Tick-Charts-Solution/src/storage'

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
const setupUI = () => {

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
    const { accessToken, userId } = await connect(credentials)

    const socket = new TradovateSocket({debugLabel: 'Realtime API'})
    await socket.connect(URLs.WS_DEMO_URL, accessToken)

    const mdsocket = new TradovateSocket({debugLabel: 'Market Data API'})
    await mdsocket.connect(URLs.MD_URL, accessToken)

    socket.subscribe({
        url: 'user/syncrequest',
        body: { users: [userId] },
        subscription: (item) => {
            if(item.users) { //this is the initial response
                const { positions, contracts, products } = item

                positions.forEach(async pos => {
                    if(pos.netPos === 0 && pos.prevPos === 0) return
            
                    const { name } = contracts.find(c => c.id === pos.contractId)
            
                    //get the value per point from products
                    let item = products.find(p => name.startsWith(p.name))
                    
                    let vpp = item.valuePerPoint    
            
                    let unsubscribe = await mdsocket.subscribe({
                        url: 'md/subscribequote',
                        body: { symbol: name },
                        subscription: ({entries}) => {                         
                            
                            let buy = pos.netPrice ? pos.netPrice : pos.prevPrice
                            const { Trade } = entries
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
                        }
                    })                            
                })
            }
        }
    })

    setupUI(socket)
}

//START APP
main()
