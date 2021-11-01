import { tvPost } from '../../EX-3-Time-Penalty/src/services'
import { getAvailableAccounts, getAccessToken } from './storage'

export const ORDER_TYPE = {
    Limit:              'Limit',
    MIT:                'MIT',
    Market:             'Market',
    QTS:                'QTS',
    Stop:               'Stop',
    StopLimit:          'StopLimit',
    TrailingStop:       'TralingStop',
    TrailingStopLimit:  'TrailingStopLimit'
}

export const ORDER_ACTION = {
    Buy:                'Buy',
    Sell:               'Sell'
}

export const placeOrder = async ({
    action, 
    symbol,
    orderQty,
    orderType, 
    accountSpec, 
    accountId, 
    clOrdId, 
    price, 
    stopPrice, 
    maxShow, 
    pegDifference,
    timeInForce, 
    expireTime, 
    text, 
    activationTime, 
    customTag50, 
    isAutomated
}) => {

    const { id, name } = getAvailableAccounts()[0]
    const { token } = getAccessToken()

    const normalized_body = {
        action, symbol, orderQty, orderType,
        isAutomated: isAutomated || false,
        accountId: id,
        accountSpec: name
    }    

    if(!token) {
        console.error('No access token found. Please acquire a token and try again.')
        return
    }

    const res = await tvPost('/order/placeOrder', normalized_body)

    return res
}
