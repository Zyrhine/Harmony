const { IncomingForm } = require('formidable');

module.exports = function(db, app, path) {
    app.post('/api/uploadattachment', (req, res) => {
        const form = new IncomingForm({uploadDir: './public/attachment', keepExtensions: true});

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

            const filename = path.basename(files.image.path)
            res.send({
                result: 'OK',
                data: {'filename': filename},
                message: "Upload successful"
            });
        });
    });
}