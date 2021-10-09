const { readFileSync, writeFileSync } = require('fs');
const { convertTo } = require('@shelf/aws-lambda-libreoffice');

module.exports.handler = async event => {
 
  console.log("Incoming Event: ", event);
  const bucket = event.Records[0].s3.bucket.name;
  const filename = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const message = `File is uploaded in - ${bucket} -> ${filename}`;
  console.log(message);

// sd
  var params = {
    Bucket: process.env.SOURCE_BUCKET,
    //Key: data.document.s3Key
    Key : event.Records[0].s3.object.key
  };

  const tempFileName = `/tmp/${filename}`;
  console.log(tempFileName)
  var tempFile = fs.createWriteStream(tempFileName);

const s3 = new S3();
  var s3Stream = s3.getObject(params).createReadStream().pipe(tempFile);

  // Listen for errors returned by the service
  s3Stream.on('error', function(err) {
  // NoSuchKey: The specified key does not exist
  console.error(err);
});

s3Stream.pipe(tempFile).on('error', function(err) {
  // capture any errors that occur when writing data to the file
  console.error('File Stream:', err);
}).on('close', function() {
  console.log('Done.');
});


   console.log(filename)
  if (!canBeConvertedToPDF(filename)) {
    console.log('In false method')
    return false;
  }

  let convertedPath = await convertTo(filename, 'pdf')
  console.log('file converted')
  console.log(convertedPath)


  const outputFilename = `${parse(filename).name}.pdf`;
  const outputFileBuffer = readFileSync(`/tmp/${outputFilename}`);

  await s3
  .upload({
    Bucket: process.env.DESTINATION_BUCKET, Key: outputFilename, Body: outputFileBuffer,
    ACL: 'public-read', ContentType: 'application/pdf'
  })
  .promise();


  return `https://s3.amazonaws.com/${bucket}/${outputFilename}`;
};
