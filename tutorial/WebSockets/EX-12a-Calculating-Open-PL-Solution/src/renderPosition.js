export const renderPos = (name, pl, netpos) => {

    return `<li data-name="${name}" style="display:flex;flex-direction:row;">
        <span>
            <p>${name}${netpos > 0 ? '+' + netpos : '' + netpos}</p> <p>:</p> <p>(${pl.toFixed(2)} | USD)</p>
        </span>
    </li>`
}