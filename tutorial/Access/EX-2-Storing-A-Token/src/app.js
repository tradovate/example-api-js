import { connect } from './connect'
import { isMobile } from './utils/isMobile'
import "device-uuid"
import { getDeviceId, setDeviceId } from './storage'

import { credentials } from '../../../tutorialsCredentials'
import { setAccessToken } from './storage'

setAccessToken(null)

let DEVICE_ID
if(!isMobile()) {
    const device = getDeviceId()
    DEVICE_ID = device || new DeviceUUID().get()
    setDeviceId(DEVICE_ID)
} else {
    DEVICE_ID = new DeviceUUID().get()
}

if(!isMobile()) {
    setDeviceId(DEVICE_ID)
} 

connect(credentials)