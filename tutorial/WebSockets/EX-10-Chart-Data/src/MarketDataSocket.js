import { MDS_URL } from "./env";
import { TradovateSocket } from "./TradovateSocket";

const getJSON = msg => {
    if(msg.data.slice(0,1) !== 'a') return
    return JSON.parse(msg.data.slice(1))
}

/**
 * Constructor for the MarketData Socket.
 */
export function MarketDataSocket() {
    TradovateSocket.call(this, MDS_URL)
    this.subscriptions = []    
}

//MarketDataSocket extends TradovateSocket, clone its prototype using Object.assign
MarketDataSocket.prototype = Object.assign({}, TradovateSocket.prototype)

MarketDataSocket.prototype.subscribeQuote = async function(symbol, fn) {

    const { subscriptionId } = await this.request({
        url: 'md/subscribeQuote',
        body: { symbol }
    })

    const subscriber = msg => {
        const results = getJSON(msg)
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

MarketDataSocket.prototype.unsubscribe = function(symbol) {
    const maybeSub = this.subscriptions.find(sub => sub.symbol === symbol)
    if(!maybeSub) return

    const { subscription } = maybeSub

    console.log(`Closing subscription to ${symbol}.`)
    this.subscriptions.splice(this.subscriptions.indexOf(maybeSub), 1)
    subscription()
}


MarketDataSocket.prototype.subscribeDOM = async function(symbol, fn) {
    const { subscriptionId } = await this.request({
        url: 'md/subscribeDOM',
        body: { symbol }
    })   

    
    const subscriber = msg => {
        const results = getJSON(msg)
        if(!results) return

        const isDOM = data => data.e && data.d && data.d.doms

        results
            .filter(isDOM)
            .map(data => data.d.doms)
            .flat()
            .filter(({contractId}) => subscriptionId === contractId)
            .forEach(dom => fn(dom))
    }

    this.ws.addEventListener('message', subscriber)

    const subscription = () => {
        this.ws.removeEventListener('message', subscriber)
        this.request({
            url: 'md/unsubscribeDOM',
            body: { symbol }
        })
    }

    this.subscriptions.push({symbol, subscription})
    return subscription

}

MarketDataSocket.prototype.subscribeHistorgram = async function(symbol, fn) {
    const { subscriptionId } = await this.request({
        url:  'md/subscribeHistogram',
        body: { symbol }
    })

    const isHistogram = data => data.e && data.d && data.d.histograms

    const subscriber = msg => {
        const results = getJSON(msg)
        if(!results) return

        results
            .filter(isHistogram)
            .map(data => data.d.histograms)
            .flat()
            .filter(({contractId}) => contractId === subscriptionId)
            .forEach(hist => fn(hist))
    }

    const subscription = () => {
        this.ws.removeEventListener('message', subscriber)
        this.request({
            url: 'md/unsubscribeHistogram',
            body: { symbol }
        })
    }
    
    this.ws.addEventListener('message', subscriber)
    this.subscriptions.push({ symbol, subscription })
    return subscription
} 

MarketDataSocket.prototype.disconnect = function() {
    TradovateSocket.prototype.disconnect.call(this)
    this.subscriptions.forEach(({subscription}) => subscription())
    this.subscriptions = []
}