const { ObjectId } = require('bson');
const { IncomingForm } = require('formidable');

module.exports = function(db, app, path) {
    app.post('/api/uploadavatar', (req, res) => {
        const form = new IncomingForm({uploadDir: './public/avatar', keepExtensions: true});

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.send({
                    result: "Failed",
                    data: {},
                    numberOfImages: 0,
                    message: "Cannot upload images. Error is :" + err
                });
                return;
            }

            // Set the avatar url in the database
            const filename = path.basename(files.image.path)
            db.collection('users').updateOne({_id: new ObjectId(fields.userId)}, {$set: {imageUrl: filename}}).then(() => {
                res.send({
                    result: 'OK',
                    data: {'filename': filename},
                    message: "Upload successful"
                });
            })
        });
    });
}