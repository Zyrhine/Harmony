module.exports = function(app, path) {
    app.post('/api/messages', function(req, res) {
        if (!req.body) {
            return res.sendStatus(400)
        }
    });
}