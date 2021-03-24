import { DEMO_URL, MDS_URL } from "./env";
import { getAccessToken } from "./storage";
import { TradovateSocket } from "./TradovateSocket";


/**
 * Constructor for the MarketData Socket.
 */
export function MarketDataSocket() {
    TradovateSocket.call(this, MDS_URL)

    this.subscriptions = []    

    this.disconnect = function() {
        TradovateSocket.prototype.disconnect.call(this)
        this.subscriptions.forEach(({subscription}) => subscription())
        this.subscriptions = []
    }
}

//MDHelper extends WSHelper, clone its prototype using Object.assign
MarketDataSocket.prototype = Object.assign({}, TradovateSocket.prototype)

MarketDataSocket.prototype.subscribeQuote = async function(symbol, fn) {

    this.request({
        url: 'md/subscribeQuote',
        body: { symbol }
    })

    let { id } = await fetch(DEMO_URL + '/contract/find?name=BTCH1', {
        headers: {
            'Authorization': 'Bearer '+ getAccessToken().token
        } 
    }).then(res => res.json())

    const subscriber = msg => {
        if(msg.data.slice(0, 1) !== 'a') return
        const results = JSON.parse(msg.data.slice(1))
        if(!results) return
        results.forEach(data => {
            const { quotes } = data.d
            quotes.forEach(quote => {
                const { contractId, entries } = quote
                if(contractId === id) {
                    fn(entries)
                }
            })    
        })
    }

    //listen for events
    this.ws.addEventListener('message', subscriber)

    //return an unsubscribe function.
    const subscription = () => {
        this.ws.removeEventListener('message', subscriber)
        this.request({
            url: 'md/unsubscribeQuote',
            body: { symbol }
        })
    }

    this.subscriptions.push({ symbol, subscription })
    return subscription
}

MarketDataSocket.prototype.unsubscribeQuote = function(symbol) {
    const maybeSub = this.subscriptions.find(sub => sub.symbol === symbol)
    if(!maybeSub) return

    const { subscription } = maybeSub

    console.log(`Closing subscription to ${symbol}.`)
    this.subscriptions.splice(this.subscriptions.indexOf(maybeSub), 1)
    subscription()
} 