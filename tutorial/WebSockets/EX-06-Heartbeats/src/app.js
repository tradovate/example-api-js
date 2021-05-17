import { WSS_URL } from './env'
import { connect } from './connect'
import { getAccessToken } from './storage'
import { tvGet, tvPost } from './services'

window.tvGet = tvGet
window.tvPost = tvPost

const main = async () => {

    //Connect to the tradovate API by retrieving an access token
    await connect({
        name:       "<replace with your credentials>",
        password:   "<replace with your credentials>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    })

    const ws = new WebSocket(WSS_URL)
    let interval

    ws.onmessage = msg => {

        const { type, data } = msg
        const kind = data.slice(0,1) // what kind of message is this? the first character lets us know
    
        if(type !== 'message') { 
            console.log('non-message type received')
            console.log(msg)
            return
        }

        //message discriminator
        switch(kind) {
            case 'o':
                console.log('Opening Socket Connection...')
                const { token } = getAccessToken()
                ws.send(`authorize\n0\n\n${token}`)                   
                interval = setInterval(() => {
                    console.log('sending response heartbeat...')
                    ws.send('[]')
                }, 2500)          
                break
            case 'h':
                console.log('received server heartbeat...')
                break
            case 'a':
                const data = JSON.parse(msg.data.slice(1))
                console.log(data)
                break
            case 'c':
                console.log('closing websocket')
                clearInterval(interval)
                break
            default:
                console.error('Unexpected response token received:')
                console.error(msg)
                break;
        }    
    }
}

//app entry point
main()
