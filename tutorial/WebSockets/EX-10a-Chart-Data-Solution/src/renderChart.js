import { percentInRange } from "./utils/percentInRange"

const calcHt = ({highest, lowest, min, max}) => (highest - lowest) / (max - min) * 100

const getTime = (date) =>`${date.getUTCHours()}:${date.getUTCMinutes < 10 ? `0${date.getUTCMinutes()}` : date.getUTCMinutes()}` 

const renderBar = ({min, max}, {
    timestamp,
    open,
    high,
    low,
    close,
    volume,
    upVolume,
    downVolume,
    upTicks,
    downTicks,
    bidVolume,
    offerVolume,
}) => {
    const date = new Date(timestamp)
    const highest = Math.max(high, low, close, open)
    const lowest = Math.min(high, low, open, close)

    const ht = calcHt({highest, lowest, min, max})

    const template = 
`<section data-timestamp="${date.toUTCString()}">
    <div>${date.toLocaleDateString()}</div>
    <h3>${getTime(date)}</h3>
    <div data-high="${high}" style="top: calc(${percentInRange(min, max, high)}% - .2em);"></div>
    <div data-low="${low}" style="top: ${percentInRange(min, max, low)}%;"></div>
    <div data-open="${open}" style="top: ${percentInRange(min, max, open)}%;"></div>
    <div data-close="${close}" style="top: ${percentInRange(min, max, close)}%;"></div>
    <div data-highest="${highest}" data-lowest="${lowest}" style="top: ${percentInRange(min, max, highest)}%;height:${ht}%;"></div>
</section>`    

    return template
}

export const renderChart = ({min, max}, {bars}) => {
    const renders = []    

    bars.forEach(bar => renders.push(renderBar({min, max}, bar)))

    return renders.join('')
}
    
