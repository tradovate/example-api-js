# Connecting the Tradovate WebSocket Client

In this section, we will focus on connecting the websocket client. We will discuss all of its features, including how to
establish a connection, how to maintain a connection using *heartbeat frames*, how to send requests to the server, and
what to expect back in response. For readers who are new to using the Tradovate API, connecting to websockets requires
acquiring an access token. You can follow the lessons from [part one](https://github.com/tradovate/example-api-js/tree/main/tutorial/Access/EX-0-Access-Start)
to learn how to acquire a token. 