import { getAccessToken } from './storage'

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
export function TradovateSocket(url) {
    this.ws = null
    this.counter = new Counter()
    this.heartbeat = null

    this.connect(url)
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

TradovateSocket.prototype.startHeartbeat = function() {
    const ws = this.ws
    if(!ws || this.heartbeat) return
    this.heartbeat = setInterval(() => {
        console.log('ba')
        ws.send('[]')
    }, 2500)
}

TradovateSocket.prototype.connect = function(url) {
    if(!this.ws || this.ws.readyState == 3 || this.ws.readyState == 2) 
        this.ws = new WebSocket(url)

    this.ws.onopen = _ => {
        console.log('Making WS auth request...')
        const { token } = getAccessToken()
        this.ws.send(`authorize\n0\n\n${token}`)

        this.startHeartbeat()
    }

    this.ws.onmessage = msg => {
        const { type, data } = msg
        const kind = data.slice(0,1)
        if(type !== 'message') {
            console.log('non-message type received')
            console.log(msg)
            return
        }
    
        //message discriminator
        switch(kind) {
            case 'o':                
                break
            case 'h':
                console.log('bump')
                break
            case 'a':
                const data = JSON.parse(msg.data.slice(1))
                console.log(data)
                break
            case 'c':
                console.log('closing websocket')
                break
            default:
                console.error('Unexpected response token received:')
                console.error(msg)
                break;
        }
    }
}

TradovateSocket.prototype.disconnect = function() {
    console.log('closing websocket connection')
    this.ws.close(1000, `Client initiated disconnect.`)
    clearInterval(this.heartbeat)
    this.heartbeat = null
}

TradovateSocket.prototype.isConnected = function() {
    return this.ws && this.ws.readyState != 2 && this.ws.readyState != 3
}