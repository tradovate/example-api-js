
import { renderPriceSize } from './renderPriceSize'

const renderBidOffer = bid => `
    <div>
        <ul>
            ${renderPriceSize(bid)}
        </ul>
    </div>
`

export const renderDOM = ({
    contractId,
    timestamp,
    bids,
    offers,
}) => `
    <section>
        <span>
            <h1>ETHH1 - ${contractId}</h1>
            <time datetime="${new Date(timestamp)}"></time>
        </span>
        <div class="dom-cols">         
            <div class="dom-col-item">
                <h2>Bids</h2>
                ${bids.map(renderBidOffer).join('')}
            </div>
            <div class="dom-col-item">
                <h2>Offers</h2>
                ${offers.map(renderBidOffer).join('')}
            </div>            
        <div>
    </section>
`