import { setAccessToken } from './storage'
import { connect } from './connect'
import { credentials } from '../../../tutorialsCredentials'

setAccessToken(null)

//Connect to the tradovate API by retrieving an access token
connect(credentials)
