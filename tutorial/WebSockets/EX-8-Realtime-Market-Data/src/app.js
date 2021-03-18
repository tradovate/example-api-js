import { connect } from './connect'
import { WSHelper } from './socket'
import { getAccessToken, setAccessToken } from './storage'

//Connect to the tradovate API by retrieving an access token
connect({
    name:       "<replace with your credentials>",
    password:   "<replace with your credentials>",
    appId:      "Sample App",
    appVersion: "1.0",
}, data => {
    const { accessToken, userId, userStatus, name, expirationTime } = data
    setAccessToken(accessToken, expirationTime)
    console.log(`Successfully stored access token for user {name: ${name}, ID: ${userId}, status: ${userStatus}}.`)
})


//APPLICATION --------------------------------------------------------


const $connBtn      = document.getElementById('connect-btn')
const $statusInd    = document.getElementById('status')

//The websocket helper tool
const helper = new WSHelper()

//give user some feedback about the state of their connection
//by adding an event listener to 'message' that will change the color
$connBtn.addEventListener('click', () => {
    helper.connect()
    helper.ws.addEventListener('message', msg => {
        $statusInd.style.backgroundColor = 
            helper.ws.readyState == 0 ? 'gold'      //pending
        :   helper.ws.readyState == 1 ? 'green'     //OK
        :   helper.ws.readyState == 2 ? 'orange'    //closing
        :   helper.ws.readyState == 3 ? 'red'       //closed
        :   /*else*/                    'silver'    //unknown|default           
    })
})
