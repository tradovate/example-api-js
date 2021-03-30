export const renderPriceSize = ({price, size}) => `
    ${price ? '<li>price: ' +price+ '</li>' : ''}
    ${size ? '<li>size: ' +size+ '</li>' : ''}
`