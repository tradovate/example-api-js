import { connect } from './connect'
import { tvGet, tvPost } from './services'
import { isMobile } from './utils/isMobile'
import { DeviceUUID } from "device-uuid"
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

let POSITIONS = []

//Setup events for active UI elements.
const setupUI = () => {

    $buyBtn.addEventListener('click', async () => {
        //first available account
        const { name, id } = getAvailableAccounts()[0]

        if(!$symbol.value) return

        let { orderId } = await tvPost('/order/placeOrder', {
            action: 'Buy',
            symbol: $symbol.value,
            orderQty: parseInt($qty.value, 10),
            orderType: "Market",
            accountName: name,
            accountId: id
        })

        let { contractId } = await tvGet('/order/item', {id: orderId})
        
        POSITIONS = await tvGet('/position/ldeps', {masterids: [getAvailableAccounts()[0].id]})

        let position = POSITIONS.find(p => p.contractId === contractId)
        
        const element = document.createElement('div')
        element.innerHTML = await renderPos(name, position)
        const $maybeSymbol = document.querySelector(`#buy-list li[data-contractId="${contractId}"]`)

        if($maybeSymbol) {
            $maybeSymbol.parentElement.replaceWith(element)
        } else $posList.appendChild(element)
    })

    $sellBtn.addEventListener('click', async () => {
        //first available account
        const { name, id } = getAvailableAccounts()[0]

        if(!$symbol.value) return

        const { orderId } = await tvPost('/order/placeOrder', {
            action: 'Sell',
            symbol: $symbol.value,
            orderQty: parseInt($qty.value, 10),
            orderType: "Market",
            accountName: name,
            accountId: id
        })

        const { contractId } = await tvGet('/order/item', {id: orderId})
        
        POSITIONS = await tvGet('/position/ldeps', {masterids: [getAvailableAccounts()[0].id]})

        const position = POSITIONS.find(p => p.contractId === contractId)
        
        const element = document.createElement('div')
        element.innerHTML = await renderPos(name, position)
        const $maybeSymbol = document.querySelector(`#sell-list li[data-contractId="${contractId}"]`)

        if($maybeSymbol) {
            $maybeSymbol.parentElement.replaceWith(element)
        } else $posList.appendChild(element)
    })
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

    const socket = new MarketDataSocket()
    window.socket = socket

    setupUI()

    POSITIONS = await tvGet('/position/ldeps', {masterids: [getAvailableAccounts()[0].id]})

    const pls = []
    
    const runPL = () => {
        const totalPL = pls.reduce((a, b) => a + b, 0)
        $openPL.innerHTML = ` $${totalPL}`
    }

    POSITIONS.forEach(async pos => {

        if(pos.netPos === 0 && pos.prevPos === 0) return

        const { name } = await tvGet('/contract/item', {id: pos.contractId})
        let nameQuery = name === 'ESM1' || name === 'NQM1' ? name.slice(0, 2) : name.slice(0, 3)
        const { valuePerPoint } = await tvGet('/product/find', { name: nameQuery })

        await socket.subscribeQuote(name, ({Trade}) => {

            let buy = pos.netPrice ? pos.netPrice : pos.prevPrice
            const { price } = Trade            

            let pl = (price - buy) * valuePerPoint * pos.netPos 
            
            const element = document.createElement('div')
            element.innerHTML = renderPos(name, pl)
            $posList.appendChild(element)

            pls.push(pl)
            runPL()
        })        
    })

}

//START APP
main()
