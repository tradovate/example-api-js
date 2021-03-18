import { WSS } from "./env";
import { getAccessToken } from './storage'

function Counter() {
    this.current = 0
    this.increment = () => {
        this.current += 1
        return this.current
    }
}

export function WSHelper() {
    this.ws = null
    this.counter = new Counter()
    this.hearbeat = null
}

/**
 * Makes a request and returns the request ID 
 */
WSHelper.prototype.request = function({url, query, body}) {
    this.ws.send(`${url}\n${this.counter.increment()}\n${query}\n${JSON.stringify(body)}`)
    return this.counter.current
}

WSHelper.prototype.listen = function(id, fn) {
    const ws = this.ws
    const subscription = msg => {
        if(msg.data.slice(0, 1) !== 'a') 
            return

        const data = JSON.parse(msg.data.slice(1))

        data.forEach(item => {
            if(item.i === id) {
                fn(item.d)
                ws.removeEventListener('message', subscription)
            }
        })

    } 
    ws.addEventListener('message', subscription)
}

WSHelper.prototype.startHeartbeat = function() {
    const ws = this.ws
    if(!ws || this.heartbeat) return
    this.hearbeat = setInterval(() => {
        console.log('ba')
        ws.send('[]')
    }, 2500)
}

WSHelper.prototype.connect = function() {
    this.ws = new WebSocket(WSS)   

    this.ws.onopen = _ => {
        console.log('Making WS auth request...')
        const { token } = getAccessToken()
        this.request({
            url: 'authorize',
            body: token
        })

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
                handleClose(msg)
                break
            default:
                console.error('Unexpected response token received:')
                console.error(msg)
                break;
        }
    }
}

WSHelper.prototype.isConnected = function() {
    return this.ws && this.ws.readyState != 2 && this.ws.readyState != 3
}