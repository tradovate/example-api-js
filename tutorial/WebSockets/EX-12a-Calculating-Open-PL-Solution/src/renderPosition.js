export const renderPos = (name, pl) => {

    return `<li data-name="${name}">
        <p>${name} : ($${pl.toFixed(2)})</p>
    </li>`
}