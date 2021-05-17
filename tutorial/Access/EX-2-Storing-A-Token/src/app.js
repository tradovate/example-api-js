import { connect } from './connect'
import { isMobile } from './utils/isMobile'
import "device-uuid"
import { getDeviceId, setDeviceId } from './storage'

let DEVICE_ID
if(!isMobile()) {
    const device = getDeviceId()
    DEVICE_ID = device || new DeviceUUID().get()
    setDeviceId(DEVICE_ID)
} else {
    DEVICE_ID = new DeviceUUID().get()
}

const connect_data = {
    name:       "<replace with your credentials>",
    password:   "<replace with your credentials>",
    appId:      "Sample App",
    appVersion: "1.0",
    cid:        8,
    sec:        'f03741b6-f634-48d6-9308-c8fb871150c2',
    deviceId:   DEVICE_ID
}

if(!isMobile()) {
    setDeviceId(DEVICE_ID)
} 

connect(connect_data)