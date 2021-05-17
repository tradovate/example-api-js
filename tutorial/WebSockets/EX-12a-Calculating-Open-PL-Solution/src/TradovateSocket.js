import { getAccessToken, getAvailableAccounts } from './storage'

function Counter() {
    this.current = 0
    this.increment = () => {
        this.current += 1
        return this.current
    }
}

/**
 * Constructor for the Tradovate WebSocket
 */
export function TradovateSocket() {
    this.ws = null
    this.counter = new Counter()    
}

TradovateSocket.prototype.getSocket = function() {
    return this.ws
}

/**
 * Makes a request and returns a promise that will resolve with the response JSON data
 */
TradovateSocket.prototype.request = function({url, query, body}) {
    const ws = this.ws
    const id = this.counter.increment()
    const promise = new Promise((res, rej) => {
        const resSubscription = msg => {

            const rejSubscription = () => rej(`Connection closed before request ${id} could be resolved.`)
            ws.addEventListener('close', rejSubscription)

            if(msg.data.slice(0, 1) !== 'a') { return }
            const data = JSON.parse(msg.data.slice(1))

            data.forEach(item => {
                if(item.i === id) {
                    res(item.d)
                    ws.removeEventListener('close', rejSubscription)
                    ws.removeEventListener('message', resSubscription)
                }
            })
        } 
        ws.addEventListener('message', resSubscription)
    })
    this.ws.send(`${url}\n${id}\n${query}\n${JSON.stringify(body)}`)
    return promise
}

TradovateSocket.prototype.synchronize = async function() {
    if(!this.ws || this.ws.readyState == 3 || this.ws.readyState == 2) {
        console.warn('no websocket connection available, please connect the websocket and try again.')
        return
    }
    return await this.request({
        url: 'user/syncrequest',
        body: { users: [getAvailableAccounts()[0].userId] }
    })
}

/**
 * Set a function to be called when the socket synchronizes.
 */
TradovateSocket.prototype.onSync = function(callback) {
    this.ws.addEventListener('message', async msg => {
        const { type, data } = msg
        const kind = data.slice(0,1)
        switch(kind) {
            case 'a':
                const  [...parsedData] = JSON.parse(msg.data.slice(1))

                let schemaOk
                const schemafields = ['accountRiskStatuses', 'accounts', 'cashBalances', 'commandReports', 'commands', 'contractGroups', 'contractMaturities', 'contracts', 'currencies', 'exchanges', 'executionReports', 'fillPairs', 'fills', 'marginSnapshots', 'orderStrategies', 'orderStrategyLinks', 'orderStrategyTypes', 'orderVersions', 'orders', 'positions', 'products', 'properties', 'spreadDefinitions', 'userAccountAutoLiqs', 'userPlugins', 'userProperties', 'userReadStatuses', 'users']
                parsedData.forEach(data => {
                    schemafields.forEach(k => {
                        if(schemaOk && !schemaOk.value) {
                            return
                        }
                        if(k in data.d && Array.isArray(data.d[k])) {
                            schemaOk = { value: true }
                        } else {
                            schemaOk = { value: false }
                        }
                    })
                    
                    if(schemaOk.value) {
                        callback(data.d)
                    }
                })
                break
            default:
                break
        }
    })
}

TradovateSocket.prototype.connect = async function(url) {
    if(!this.ws || this.ws.readyState == 3 || this.ws.readyState == 2) {
        this.ws = new WebSocket(url)
    }

    let interval

    return new Promise((res, rej) => {
        this.ws.addEventListener('message', async msg => {
            const { type, data } = msg
            const kind = data.slice(0,1)
            if(type !== 'message') {
                console.log('non-message type received')
                return
            }
        
            //message discriminator
            switch(kind) {
                case 'o':      
                    console.log('Making WS auth request...')
                    const { token } = getAccessToken()
                    this.ws.send(`authorize\n0\n\n${token}`)          
                    interval = setInterval(() => {
                        if(this.ws.readyState == 3 || this.ws.readyState == 2) {
                            clearInterval(interval)
                            return
                        }
                        console.log('sending response heartbeat...')
                        this.ws.send('[]')
                    }, 2500)
                    break
                case 'h':
                    console.log('receieved server heartbeat...')
                    break
                case 'a':
                    const parsedData = JSON.parse(msg.data.slice(1))
                    const [first] = parsedData
                    if(first.i === 0 && first.s === 200) {
                        res()
                    } else rej()
                    break
                case 'c':
                    console.log('closing websocket')
                    clearInterval(interval)
                    break
                default:
                    console.error('Unexpected response token received:')
                    console.error(msg)
                    break
            }
        })
    })    
}

TradovateSocket.prototype.disconnect = function() {
    console.log('closing websocket connection')
    this.ws.close(1000, `Client initiated disconnect.`)
}

TradovateSocket.prototype.isConnected = function() {
    return this.ws && this.ws.readyState != 2 && this.ws.readyState != 3
}