const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
const mysqlPool = require('../lib/mysqlPool');

const photos = require('../data/photos');

exports.router = router;
exports.photos = photos;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};

/*
 * Route to create a new photo.
 */

async function insertNewPhoto(photo) {
  const validatedPhoto = extractValidFields(
    photo,
    photoSchema
  );
  const [result] = await mysqlPool.query(
    'INSERT INTO photos SET ?',
    validatedPhoto
  );

  return result.insertId;
}

router.post('/', async function (req, res, next) {
  if (validateAgainstSchema(req.body, photoSchema)) {
    const photoid = await insertNewPhoto(req.body);
    res.status(201).json({
      id: photoid,
      links: {
        photo: `/photos/${photoid}`,
        business: `/businesses/${photoid.businessid}`
      }
    });
  } else {
    res.status(400).json({
      error: "Request body is not a valid photo object"
    });
  }
});

/*
 * Route to fetch info about a specific photo.
 */

async function getPhotoById(photoid) {
  const [results] = await mysqlPool.query(
    'SELECT * FROM photos WHERE id = ?',
    [photoid],
  );
  return results[0];
}

router.get('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  const photo = await getPhotoById(photoID);
  if (photo) {
    res.status(200).json(photo);
  } else {
    next();
  }
});

/*
 * Route to update a photo.
 */
async function updatePhotoById(photoid, photo) {
  const validatedPhoto = extractValidFields(
    photo,
    photoSchema
  );
  const [result] = mysqlPool.query(
    'UPDATE photos SET ? WHERE id = ?',
    [validatedPhoto, photoid]
  );
  return result.affectedRows > 0;
}

router.put('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  if (photos[photoID]) {

    if (validateAgainstSchema(req.body, photoSchema)) {
      /*
       * Make sure the updated photo has the same businessid and userid as
       * the existing photo.
       */
      const updatedPhoto = extractValidFields(req.body, photoSchema);
      const existingPhoto = photos[photoID];
      if (existingPhoto && updatedPhoto.businessid === existingPhoto.businessid && updatedPhoto.userid === existingPhoto.userid) {
        try {
          const result = await updatePhotoById(photoID, updatedPhoto);
          if (result) {
            res.status(200).json({
              links: {
                photo: `/photos/${photoID}`,
                business: `/businesses/${updatedPhoto.businessid}`
              }
            });
          } else {
            res.status(404).json({
              error: "No photo with the specified ID exists"
            });
          }
        } catch (err) {
          console.error("Error updating photo:", err);
          res.status(500).json({
            error: "Error updating photo! Try again"
          });
        }
      } else {
        res.status(403).json({
          error: "Updated photo cannot modify businessid or userid"
        });
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid photo object"
      });
    }
  } else {
    next();
  }
});


/*
 * Route to delete a photo.
 */

async function deletePhotoByID(photoid) {
  const [result] = await mysqlPool.query(
    'DELETE FROM photos WHERE id = ?',
    [photoid]
  );
  return result.affectedRows > 0;
}

router.delete('/:photoID', async function (req, res, next) {
  const photoID = parseInt(req.params.photoID);
  const deletedphoto = await deletePhotoByID(photoID);
  if (deletedphoto) {
    res.status(204).end();
  } else {
    next();
  }
});
