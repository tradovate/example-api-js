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

WSHelper.prototype.request = function({url, query, body}) {
    this.ws.send(`${url}\n${this.counter.increment()}\n${query}\n${JSON.stringify(body)}`)
}

WSHelper.prototype.startHeartbeat = function() {
    if(!this.ws) return
    this.hearbeat = setInterval(() => {
        console.log('ba')
        this.ws.send('[]')
    }, 2500)
}

WSHelper.prototype.connect = function() {
    this.ws = new WebSocket(WSS)

    this.startHeartbeat()

    const handleOpen = _ => {
        console.log('Making WS auth request...')
        const { token } = getAccessToken()
        this.request({
            url: 'authorize',
            body: token
        })
    }

    const handleHeartbeat = msg => {
        console.log('bump.')
    }

    const handleJSON = msg => {
        //cut off the frame indicator
        const data = JSON.parse(msg.data.slice(1))
        console.log(data)
    }

    const handleClose = msg => {
        clearInterval(this.hearbeat)
        this.hearbeat = null
    }

    const handleException = msg => {
        console.error('Unexpected response token received:')
        console.error(msg)
    }

    //message discriminator
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
                handleOpen(msg)
                break
            case 'h':
                handleHeartbeat(msg)
                break
            case 'a':
                handleJSON(msg)
                break
            case 'c':
                handleClose(msg)
                break
            default:
                handleException(msg)
        }
    }
}