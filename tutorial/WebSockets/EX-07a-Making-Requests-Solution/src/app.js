import { credentials } from '../../../tutorialsCredentials'
import { URLs } from '../../../tutorialsURLs'
import { connect } from './connect'
import { renderETH } from './renderETH'
import { setAccessToken } from './storage'
import { TradovateSocket } from './TradovateSocket'

setAccessToken(null)

//Connect to the tradovate API by retrieving an access token
const main = async () => {
    const { accessToken, userId } = await connect(credentials)


    const socket = new TradovateSocket()

    const $outlet       = document.getElementById('outlet')
    const $reqBtn       = document.getElementById('request-btn')
    const $connBtn      = document.getElementById('connect-btn')
    const $statusInd    = document.getElementById('status')

    $connBtn.addEventListener('click', async () => {
        await socket.connect(URLs.WS_DEMO_URL, accessToken)
        socket.ws.addEventListener('message', msg => {
            $statusInd.style.backgroundColor = 
                socket.ws.readyState == 0 ? 'gold'      //pending
            :   socket.ws.readyState == 1 ? 'green'     //OK
            :   socket.ws.readyState == 2 ? 'orange'    //closing
            :   socket.ws.readyState == 3 ? 'red'       //closed
            :   /*else*/                    'silver'    //unknown|default           
        })

        subscribeSync()
    })

    $reqBtn.addEventListener('click', async () => {
        const { d } = await socket.send({
            url: 'product/find',
            query: `name=ETH`
        })
    
        const div = document.createElement('div')
        div.innerHTML = renderETH(d)
        $outlet.firstElementChild 
            ? $outlet.firstElementChild.replaceWith(div)
            : $outlet.appendChild(div)
        
    })

    function subscribeSync() {
        socket.subscribe({
            url: 'user/syncrequest',
            body: { users: [userId] },
            subscription: item => {
                if(item.users) {
                    //initial response has the `users` field and contains all of your current user data
                    const { 
                        accountRiskStatuses,
                        accounts,
                        cashBalances,
                        commandReports,
                        commands,
                        contractGroups,
                        contractMaturities,
                        contracts,
                        currencies,
                        exchanges,
                        executionReports,
                        fillPairs,
                        fills,
                        marginSnapshots,
                        orderStrategies, 
                        orderStrategyLinks,
                        orderStrategyTypes,
                        orderVersions,
                        orders,
                        positions,
                        products,
                        properties,
                        spreadDefinitions,
                        userAccountAutoLiqs,
                        userPlugins,
                        userProperties,
                        userReadStatuses,
                        users        
                    } = item
                    //do setup stuff with data
                    console.log(item)
                } else {
                    //after initial response, subscription events look like this
                    const { entity, entityType, eventType } = item
                    console.log(item)
                }
            }
        })
    }
}

main()