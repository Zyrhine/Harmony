module.exports = function(app, path) {
    app.post('/api/groups', function(req, res) {
        if (!req.body) {
            return res.sendStatus(400)
        }
    });
}