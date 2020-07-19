const fs = require("fs");
const axios = require("axios");
const { google } = require("googleapis");
const { GOOGLE_DRIVE_CREDENTIALS } = require("../config");

//Saves file from google to filesystem
const getFile = (fileId) => {
  const promise = new Promise(async (resolve, reject) => {
    try {
      const drive = await getDrive();
      const file = await drive.files.get({
        fileId,
        fields: "*",
      });
      const url = file.data.webContentLink;
      const path = file.data.name;
      const writer = fs.createWriteStream(path);
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
      });
      let error = null;
      response.data.pipe(writer);
      writer.on("error", (err) => {
        error = err;
        reject(err);
      });
      writer.on("close", () => {
        if (!error) {
          resolve(true);
        }
      });
    } catch (err) {
      reject(err);
    }
  });

  return promise;
};

//Delete file from google
const deleteFile = (fileId) => {
  const promise = new Promise(async (resolve, reject) => {
    try {
      const drive = await getDrive();
      await drive.files.delete({
        fileId,
      });
      resolve(true);
    } catch (err) {
      reject(err);
    }
  });
  return promise;
};

//Save file to google
const saveFile = ({ filePath, filename, mimeType }) => {
  const promise = new Promise(async (resolve, reject) => {
    try {
      const drive = await getDrive();

      const bucket = await getBucket("youtube");
      const file = await drive.files.create({
        resource: {
          name: filename,
          parents: [bucket.id],
        },
        media: {
          mimeType,
          body: fs.createReadStream(filePath),
        },
        fields: "id",
      });
      resolve(file.data);
    } catch (err) {
      reject(err);
    }
  });
  return promise;
};

/*
Preconditions: 
  A drive folder named "bucketName" must exist
  Note: I created a folder on Google Drive client and shared it with the service account email
Postconditions:
  Returns the first folder with name "buckName".
*/
const getBucket = (buckName) => {
  const promise = new Promise(async (resolve, reject) => {
    try {
      const drive = await getDrive();
      const folder = await drive.files.list({
        pageSize: 1,
        q: `mimeType='application/vnd.google-apps.folder' and name='${buckName}'`,
        fields: "files(id, name)",
      });
      resolve(folder.data.files[0]);
    } catch (err) {
      reject(err);
    }
  });
  return promise;
};

const getDrive = () => {
  const promise = new Promise(async (resolve, reject) => {
    try {
      const auth = await google.auth.getClient({
        credentials: GOOGLE_DRIVE_CREDENTIALS,
        scopes: "https://www.googleapis.com/auth/drive",
      });
      resolve(
        google.drive({
          version: "v3",
          auth,
        })
      );
    } catch (err) {
      reject(err);
    }
  });
  return promise;
};

module.exports = {
  getFile,
  saveFile,
};

// (async () => {
//   try {
//     const a = await getFile("1S3bERIOnWANjEdDWyHMleCaABARwOpYw"); //126DfWnSRfKPOtNc3J3zXsLrIYJ1rvJ8g
//     // const a = await saveFile({
//     //   filePath: path.join(__dirname, "../IMG_026.MOV"),
//     //   filename: "v11.mov",
//     //   mimeType: "video/quicktime",
//     // });
//     console.log("a", a);
//     console.log("a");
//   } catch (e) {
//     console.log(e);
//   }
// })();
