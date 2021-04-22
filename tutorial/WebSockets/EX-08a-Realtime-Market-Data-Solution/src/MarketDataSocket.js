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

    const { subscriptionId } = await this.request({
        url: 'md/subscribeQuote',
        body: { symbol }
    })

    const subscriber = msg => {
        const results = JSON.parse(msg.data.slice(1))
        if(!results) return

        const isQuote = data => data.e && data.d && data.d.quotes

        results
            .filter(isQuote)                                //we only want Quote events
            .map(data => data.d.quotes)                     //transform our data into the quotes object
            .flat()                                         //its an array of arrays of quotes right now, so flatten
            .filter(({id}) => id === subscriptionId)        //filter out subscriptions that aren't this one
            .forEach(({entries}) => fn(entries))            //finally call the function

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