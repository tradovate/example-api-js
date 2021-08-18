import { WSS_URL } from './env'
import { connect } from './connect'
import { getAccessToken } from './storage'

const main = async () => {

    //Connect to the tradovate API by retrieving an access token
    await connect({
        name:       "<your credentials here>",
        password:   "<your credentials here>",
        appId:      "Sample App",
        appVersion: "1.0",
        cid:        8,
        sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    })

    const ws = new WebSocket(WSS_URL)
    let curTime = new Date()

    ws.onmessage = msg => {

        const now = new Date()

        if(now.getTime() - curTime.getTime() >= 2500) {
            ws.send('[]')
            console.log('sent response heartbeat')
            curTime = new Date()
        }

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
