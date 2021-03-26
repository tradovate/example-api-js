import { percentInRange } from "./percentInRange"

const HIGH_HT = '.2em'
    
export const fixChart = (min, max) => {    
    const highs = document.querySelectorAll('[data-high]')
    const lows = document.querySelectorAll('[data-low]')
    const opens = document.querySelectorAll('[data-open]')
    const closes = document.querySelectorAll('[data-close]')
    const flags = document.querySelectorAll('[data-highest]')

    flags.forEach(f => {
        const { highest, lowest } = f.dataset
        f.style.height = `${((highest - lowest)/(max-min)) * 100}%`
        f.style.top = `${percentInRange(min, max, highest)}%`
    })
    highs.forEach(h => {
        const high = h.dataset.high
        h.style.top = `calc(${percentInRange(min, max, high)}% - ${HIGH_HT})`
    })
    lows.forEach(l => {
        const low = l.dataset.low
        l.style.top = `${percentInRange(min, max, low)}%`
    })
    opens.forEach(o => {
        const open = o.dataset.open
        o.style.top = `${percentInRange(min, max, open)}%`
    })
    closes.forEach(c => {
        const close = c.dataset.close
        c.style.top = `${percentInRange(min, max, close)}%`
    })
}