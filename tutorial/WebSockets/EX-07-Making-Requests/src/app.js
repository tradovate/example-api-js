import { credentials } from '../../../tutorialsCredentials'
import { URLs } from '../../../tutorialsURLs'
import { connect } from './connect'
import { setAccessToken } from './storage'
import { TradovateSocket } from './TradovateSocket'

setAccessToken(null)

//Connect to the tradovate API by retrieving an access token
const main = async () => {
    const { accessToken } = await connect(credentials)


    const ws = new TradovateSocket()
    await ws.connect(URLs.WS_DEMO_URL, accessToken)
}

main()