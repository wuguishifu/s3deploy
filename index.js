const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime');

exports.uploaddir = async (dir, clientOptions, bucket, fileUploadSuccessCallback) => {
    const s3 = new S3Client(clientOptions);
    const files = [];
    walkSync(dir, (filePath) => {
        let bucketPath = filePath.replace(dir, '');
        if (bucketPath.startsWith('/')) {
            bucketPath = bucketPath.substr(1);
        }
        files.push({ filePath, bucketPath });
    });
    await Promise.all(
        files.map(({ filePath, bucketPath }) =>
            new Promise(resolve => {
                console.log({ filePath, bucketPath, type: mime.getType(filePath) });
                s3.send(new PutObjectCommand({
                    Bucket: bucket,
                    Key: bucketPath,
                    Body: fs.readFileSync(filePath),
                    ContentType: mime.getType(filePath)
                })).then(() => {
                    fileUploadSuccessCallback();
                    resolve();
                });
            })
        )
    );
};

function walkSync(path, callback) {
    fs.readdirSync(path).forEach((file) => {
        const filePath = `${path}/${file}`;
        const fileStat = fs.statSync(filePath);
        if (fileStat.isDirectory()) {
            walkSync(filePath, callback);
        } else {
            callback(filePath);
        }
    });
}