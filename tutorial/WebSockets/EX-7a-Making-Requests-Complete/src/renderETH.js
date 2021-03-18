
export const renderETH = ({
    allowProviderContractInfo,
    contractGroupId,
    currencyId,
    description,
    exchangeChannelId,
    exchangeId,
    id,
    isMicro,
    marketDataSource,
    name,
    priceFormat,
    priceFormatType,
    productType,
    status,
    tickSize,
    valuePerPoint,
}) => {
    return `
        <section>
            <h1>${name}</h1>
            <p>currency ID: ${currencyId == 1 ? '$' : currencyId}</p>
            <h3>info:</h2>
            <span>
                <div>allowProviderContractInfo: ${allowProviderContractInfo}</div>
                <div>contractGroupId: ${contractGroupId}</div>
                <div>exchangeChannelId: ${exchangeChannelId}</div>
                <div>exchangeId: ${exchangeId}</div>
                <div>id: ${id}</div>
                <div>isMicro: ${isMicro}</div>
                <div>marketDataSource: ${marketDataSource}</div>
                <div>priceFormat: ${priceFormat}</div>
                <div>priceFormatType: ${priceFormatType}</div>
                <div>productType: ${productType}</div>
                <div>status: ${status}</div>
                <div>tickSize: ${tickSize}</div>
                <div>valuePerPoint: ${valuePerPoint}</div>
            </span>
            <h3>Description</h3>
            <p>${description}</p>
        </section>
    `
}