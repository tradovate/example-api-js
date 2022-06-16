import { credentials } from '../../../tutorialsCredentials'
import { connect } from './connect'
import { setAccessToken } from './storage'

setAccessToken(null)

const main = async () => {
    //Connect to the tradovate API by retrieving an access token
    connect(credentials)
}

//app entry point
main()
