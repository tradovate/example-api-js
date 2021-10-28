import { connect } from './connect'
import { getAccessToken } from './storage'
import { credentials } from '../../../tutorialsCredentials'
import { URLs } from '../../../tutorialsURLs'
import { setAccessToken } from './storage'

setAccessToken(null)

const main = async () => {

    //Connect to the tradovate API by retrieving an access token
    await connect(credentials)

    const ws = new WebSocket(URLs.WS_DEMO_URL)
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
