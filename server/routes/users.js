module.exports = function(app, path) {
    app.post('/api/users', function(req, res) {
        if (!req.body) {
            return res.sendStatus(400)
        }
    });
}