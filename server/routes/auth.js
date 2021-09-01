module.exports = function(db, app, path) {
    app.post('/api/auth', async function(req, res) {
        if (!req.body) {
            return res.sendStatus(400)
        }

        const collection = db.collection('users')

        const query = { email: req.body.email, password: req.body.password }
        const options = {
            // Exclude password in returned document
            projection: { password: 0 }
        }

        const user = await collection.findOne(query, options)

        if (user) {
            res.send({"ok": true, "user": user});
        } else {
            res.send({"ok": false, errors: ["Did not match a user"]});
        }
    });
}

class User {
    constructor(id, email, password, username) {
        this.id = id
        this.email = email
        this.password = password
        this.username = username
    }
}