module.exports = {
    listen: function(app, PORT) {
        let server = app.listen(PORT, () => {
            let host = server.address().address;
            let port = server.address().port;
            console.log("Server listening on: " + host + ":" + port);
        })
    }
}